import 'dotenv/config'
import cron from 'node-cron'
import prisma from './db/prisma'
import { syncAll } from './services/sync'
import { sendDigestForAllUsers } from './services/notifications'

console.log('U&I worker started')

// Sync Gmail + Calendar every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('[worker] Running integration sync...')
  try {
    const users = await prisma.user.findMany({
      where: { integrations: { some: { status: 'connected' } } },
      select: { id: true },
    })
    await Promise.allSettled(users.map(u => syncAll(u.id)))
    console.log(`[worker] Synced ${users.length} users`)
  } catch (err) {
    console.error('[worker] Sync error:', err)
  }
})

// Send weekly digest — Sundays at 9:00 AM UTC
cron.schedule('0 9 * * 0', async () => {
  console.log('[worker] Sending weekly digests...')
  try {
    await sendDigestForAllUsers()
    console.log('[worker] Digests sent')
  } catch (err) {
    console.error('[worker] Digest error:', err)
  }
})

// Clean up expired + revoked refresh tokens — daily at 2:00 AM UTC
cron.schedule('0 2 * * *', async () => {
  console.log('[worker] Cleaning up expired tokens...')
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: new Date() } }, { revoked: true }] },
    })
    console.log(`[worker] Deleted ${count} tokens`)
  } catch (err) {
    console.error('[worker] Cleanup error:', err)
  }
})
