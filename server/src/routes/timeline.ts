import { Router } from 'express'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const [interactions, drifting] = await prisma.$transaction([
    // Most recent 60 interactions across all contacts, with contact info
    prisma.interaction.findMany({
      where: { userId: req.userId },
      orderBy: { occurredAt: 'desc' },
      take: 60,
      include: {
        contact: {
          include: {
            contactCategories: {
              include: { category: { select: { color: true } } },
              take: 1,
            },
          },
        },
      },
    }),
    // Contacts sorted by most drifted (highest driftScore) — top 10
    prisma.contact.findMany({
      where: { userId: req.userId },
      orderBy: { driftScore: 'desc' },
      take: 10,
      include: {
        contactCategories: {
          include: { category: { select: { color: true } } },
          take: 1,
        },
      },
    }),
  ])

  res.json({
    interactions: interactions.map(i => ({
      id: i.id,
      type: i.type,
      occurred_at: i.occurredAt,
      notes: i.notes,
      contact: {
        id: i.contact.id,
        name: i.contact.name,
        primary_color: i.contact.contactCategories[0]?.category?.color ?? '#888888',
      },
    })),
    drifting: drifting.map(c => ({
      id: c.id,
      name: c.name,
      primary_color: c.contactCategories[0]?.category?.color ?? '#888888',
      last_contact_at: c.lastContactAt,
      drift_score: c.driftScore,
    })),
  })
})

export default router
