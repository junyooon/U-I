import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../db/prisma'
import { decrypt } from '../lib/encryption'
import { computeDistance } from '../lib/distance'

async function makeClient(userId: string, provider: string): Promise<OAuth2Client | null> {
  const integration = await prisma.integration.findUnique({
    where: { userId_provider: { userId, provider } },
  })
  if (!integration || integration.status !== 'connected' || !integration.accessTokenEnc) return null

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )
  client.setCredentials({
    access_token: decrypt(integration.accessTokenEnc),
    refresh_token: integration.refreshTokenEnc ? decrypt(integration.refreshTokenEnc) : undefined,
  })
  return client
}

async function recalculate(contactId: string, userId: string) {
  const latest = await prisma.interaction.findFirst({
    where: { contactId },
    orderBy: { occurredAt: 'desc' },
  })
  const lastContactAt = latest?.occurredAt ?? null
  const daysSince = lastContactAt
    ? Math.floor((Date.now() - lastContactAt.getTime()) / 86_400_000)
    : null
  const distance = computeDistance(daysSince)
  await prisma.contact.update({
    where: { id: contactId },
    data: { lastContactAt, driftScore: distance / 100, distance },
  })
}

async function upsertInteraction(
  contactId: string,
  userId: string,
  occurredAt: Date,
  type: string,
  source: string,
) {
  const existing = await prisma.interaction.findFirst({
    where: { contactId, source },
    orderBy: { occurredAt: 'desc' },
  })
  if (existing && occurredAt <= existing.occurredAt) return

  await prisma.interaction.create({
    data: { contactId, userId, type, occurredAt, source },
  })
  await recalculate(contactId, userId)
}

export async function syncGmail(userId: string) {
  const client = await makeClient(userId, 'google_email')
  if (!client) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gmail = google.gmail({ version: 'v1', auth: client as any })
  const contacts = await prisma.contact.findMany({ where: { userId, email: { not: null } } })

  for (const contact of contacts) {
    try {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        q: `from:${contact.email} OR to:${contact.email}`,
        maxResults: 1,
      })
      if (!data.messages?.length) continue

      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: data.messages[0].id!,
        format: 'metadata',
        metadataHeaders: ['Date'],
      })
      const dateStr = msg.data.payload?.headers?.find(h => h.name === 'Date')?.value
      if (!dateStr) continue

      const occurredAt = new Date(dateStr)
      if (isNaN(occurredAt.getTime())) continue

      await upsertInteraction(contact.id, userId, occurredAt, 'email', 'gmail_sync')
    } catch (err) {
      console.error(`Gmail sync failed for contact ${contact.id}:`, err)
    }
  }

  await prisma.integration.update({
    where: { userId_provider: { userId, provider: 'google_email' } },
    data: { lastSyncedAt: new Date() },
  })
}

export async function syncCalendar(userId: string) {
  const client = await makeClient(userId, 'google_calendar')
  if (!client) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendar = google.calendar({ version: 'v3', auth: client as any })
  const contacts = await prisma.contact.findMany({ where: { userId, email: { not: null } } })

  for (const contact of contacts) {
    try {
      const { data } = await calendar.events.list({
        calendarId: 'primary',
        q: contact.email!,
        orderBy: 'startTime',
        singleEvents: true,
        timeMax: new Date().toISOString(),
        maxResults: 10,
      })

      const events = (data.items ?? []).filter(e =>
        e.attendees?.some(a => a.email === contact.email)
      )
      if (!events.length) continue

      const latest = events[events.length - 1]
      const dateStr = latest.start?.dateTime ?? latest.start?.date
      if (!dateStr) continue

      const occurredAt = new Date(dateStr)
      if (isNaN(occurredAt.getTime())) continue

      await upsertInteraction(contact.id, userId, occurredAt, 'in_person', 'calendar_sync')
    } catch (err) {
      console.error(`Calendar sync failed for contact ${contact.id}:`, err)
    }
  }

  await prisma.integration.update({
    where: { userId_provider: { userId, provider: 'google_calendar' } },
    data: { lastSyncedAt: new Date() },
  })
}

export async function syncAll(userId: string) {
  await Promise.allSettled([syncGmail(userId), syncCalendar(userId)])
}
