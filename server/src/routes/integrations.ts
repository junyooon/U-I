import { Router } from 'express'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { encrypt } from '../lib/encryption'
import { syncAll } from '../services/sync'

const router = Router()

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
]

function makeOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )
}

function signState(userId: string): string {
  const sig = crypto
    .createHmac('sha256', process.env.JWT_SECRET!)
    .update(userId)
    .digest('hex')
    .slice(0, 16)
  return `${userId}:${sig}`
}

function verifyState(state: string): string | null {
  const idx = state.lastIndexOf(':')
  if (idx === -1) return null
  const userId = state.slice(0, idx)
  return signState(userId) === state ? userId : null
}

router.get('/google/auth-url', requireAuth, (_req, res) => {
  const client = makeOAuthClient()
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: signState(_req.userId),
    prompt: 'consent',
  })
  res.json({ url })
})

router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string }
  const origin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'

  if (!code || !state) {
    res.redirect(`${origin}?integration=error`)
    return
  }

  const userId = verifyState(state)
  if (!userId) {
    res.redirect(`${origin}?integration=error`)
    return
  }

  try {
    const client = makeOAuthClient()
    const { tokens } = await client.getToken(code)

    if (!tokens.access_token) throw new Error('No access token returned')

    const accessTokenEnc = encrypt(tokens.access_token)
    const refreshTokenEnc = tokens.refresh_token ? encrypt(tokens.refresh_token) : null
    const tokenExpiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null

    for (const provider of ['google_email', 'google_calendar']) {
      await prisma.integration.upsert({
        where: { userId_provider: { userId, provider } },
        update: {
          status: 'connected',
          accessTokenEnc,
          ...(refreshTokenEnc ? { refreshTokenEnc } : {}),
          ...(tokenExpiresAt ? { tokenExpiresAt } : {}),
        },
        create: {
          userId,
          provider,
          status: 'connected',
          accessTokenEnc,
          refreshTokenEnc,
          tokenExpiresAt,
        },
      })
    }

    syncAll(userId).catch(err => console.error('Initial sync error:', err))

    res.redirect(`${origin}?integration=connected`)
  } catch (err) {
    console.error('Integration callback error:', err)
    res.redirect(`${origin}?integration=error`)
  }
})

router.post('/sync', requireAuth, (req, res) => {
  syncAll(req.userId).catch(err => console.error('Sync error:', err))
  res.status(202).json({ status: 'sync_queued', estimated_completion_seconds: 15 })
})

router.get('/', requireAuth, async (req, res) => {
  const rows = await prisma.integration.findMany({ where: { userId: req.userId } })
  const providers = ['google_email', 'google_calendar']
  res.json({
    integrations: providers.map(provider => {
      const found = rows.find(r => r.provider === provider)
      return {
        provider,
        status: found?.status ?? 'disconnected',
        last_synced_at: found?.lastSyncedAt ?? null,
      }
    }),
  })
})

export default router
