import { Router } from 'express'
import { z } from 'zod'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { sendDigestForUser } from '../services/notifications'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const settings = await prisma.notificationSettings.findUnique({
    where: { userId: req.userId },
  })
  if (!settings) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Settings not found.' } })
    return
  }
  res.json({
    global_thresholds: {
      warn_days: settings.warnDays,
      alert_days: settings.alertDays,
      critical_days: settings.criticalDays,
    },
    channels: {
      in_app: settings.channelInApp,
      push: settings.channelPush,
      email_digest: settings.channelEmailDigest,
    },
  })
})

router.patch('/', async (req, res) => {
  const schema = z.object({
    warn_days: z.number().int().min(1).optional(),
    alert_days: z.number().int().min(1).optional(),
    critical_days: z.number().int().min(1).optional(),
    channel_in_app: z.boolean().optional(),
    channel_push: z.boolean().optional(),
    channel_email_digest: z.boolean().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const { warn_days, alert_days, critical_days, channel_in_app, channel_push, channel_email_digest } = parsed.data

  const settings = await prisma.notificationSettings.update({
    where: { userId: req.userId },
    data: {
      ...(warn_days !== undefined && { warnDays: warn_days }),
      ...(alert_days !== undefined && { alertDays: alert_days }),
      ...(critical_days !== undefined && { criticalDays: critical_days }),
      ...(channel_in_app !== undefined && { channelInApp: channel_in_app }),
      ...(channel_push !== undefined && { channelPush: channel_push }),
      ...(channel_email_digest !== undefined && { channelEmailDigest: channel_email_digest }),
    },
  })

  res.json({
    global_thresholds: {
      warn_days: settings.warnDays,
      alert_days: settings.alertDays,
      critical_days: settings.criticalDays,
    },
    channels: {
      in_app: settings.channelInApp,
      push: settings.channelPush,
      email_digest: settings.channelEmailDigest,
    },
  })
})

// Trigger a test digest immediately
router.post('/test-digest', async (req, res) => {
  await sendDigestForUser(req.userId)
  res.json({ message: 'Digest sent.' })
})

export default router
