import { Router } from 'express'
import { randomBytes } from 'crypto'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { computeDistance } from '../lib/distance'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { shareToken: true },
  })
  res.json({ share_token: user?.shareToken ?? null })
})

router.post('/', requireAuth, async (req, res) => {
  const token = randomBytes(20).toString('hex')
  await prisma.user.update({
    where: { id: req.userId },
    data: { shareToken: token },
  })
  res.json({ share_token: token })
})

router.delete('/', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { shareToken: null },
  })
  res.json({ message: 'Share link revoked.' })
})

// Public — no requireAuth
router.get('/:token', async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { shareToken: req.params.token },
    select: { id: true, name: true },
  })

  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Share link not found or revoked.' } })
    return
  }

  const [contacts, categories] = await prisma.$transaction([
    prisma.contact.findMany({
      where: { userId: user.id },
      include: {
        contactCategories: {
          include: { category: { select: { color: true } } },
        },
      },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, color: true },
    }),
  ])

  const nodes = contacts.map(contact => {
    const daysSince = contact.lastContactAt
      ? Math.floor((Date.now() - contact.lastContactAt.getTime()) / 86400000)
      : null
    const distance = computeDistance(daysSince)
    const primaryColor = contact.contactCategories[0]?.category?.color ?? '#888888'

    return {
      id: contact.id,
      name: contact.name,
      category_ids: contact.contactCategories.map(cc => cc.categoryId),
      primary_color: primaryColor,
      distance,
      last_contact_at: null,
      drift_velocity: distance / 100,
    }
  })

  res.json({
    owner: user.name,
    center: { id: user.id, name: user.name },
    nodes,
    categories,
  })
})

export default router
