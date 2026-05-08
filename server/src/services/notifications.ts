import prisma from '../db/prisma'
import { sendWeeklyDigest } from '../lib/email'

export async function sendDigestForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { notificationSettings: true },
  })
  if (!user?.notificationSettings?.channelEmailDigest) return

  const { warnDays } = user.notificationSettings

  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: {
      contactCategories: {
        include: { category: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { driftScore: 'desc' },
  })

  const drifting = contacts
    .map(c => ({
      name: c.name,
      daysSince: c.lastContactAt
        ? Math.floor((Date.now() - c.lastContactAt.getTime()) / 86_400_000)
        : null,
      category: c.contactCategories[0]?.category?.name ?? 'Uncategorized',
    }))
    .filter(c => c.daysSince === null || c.daysSince >= warnDays)
    .slice(0, 10)

  if (!drifting.length) return

  await sendWeeklyDigest(user.email, user.name, drifting)
}

export async function sendDigestForAllUsers() {
  const users = await prisma.user.findMany({
    where: { notificationSettings: { channelEmailDigest: true } },
    select: { id: true },
  })
  await Promise.allSettled(users.map(u => sendDigestForUser(u.id)))
}
