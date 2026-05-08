import { Router } from 'express'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { computeDistance } from '../lib/distance'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true },
  })

  if (!user) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } })
    return
  }

  const [contacts, categories] = await prisma.$transaction([
    prisma.contact.findMany({
      where: { userId: req.userId },
      include: {
        contactCategories: {
          include: { category: { select: { color: true } } },
        },
      },
    }),
    prisma.category.findMany({
      where: { userId: req.userId },
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
      last_contact_at: contact.lastContactAt,
      drift_velocity: distance / 100,
    }
  })

  res.json({ center: { id: user.id, name: user.name }, nodes, categories })
})

export default router
