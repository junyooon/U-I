import { Router } from 'express'
import { z } from 'zod'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { computeDistance } from '../lib/distance'

const router = Router({ mergeParams: true })
router.use(requireAuth)

router.post('/', async (req, res) => {
  const schema = z.object({
    type: z.enum(['in_person', 'manual']),
    occurred_at: z.string().datetime(),
    notes: z.string().max(500).nullable().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!contact) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contact not found.' } })
    return
  }

  const occurredAt = new Date(parsed.data.occurred_at)

  const interaction = await prisma.interaction.create({
    data: {
      contactId: contact.id,
      userId: req.userId,
      type: parsed.data.type,
      occurredAt,
      notes: parsed.data.notes ?? null,
      source: 'manual',
    },
  })

  const latest = await prisma.interaction.findFirst({
    where: { contactId: contact.id },
    orderBy: { occurredAt: 'desc' },
  })

  const lastContactAt = latest?.occurredAt ?? null
  const daysSince = lastContactAt
    ? Math.floor((Date.now() - lastContactAt.getTime()) / 86400000)
    : null
  const distance = computeDistance(daysSince)

  await prisma.contact.update({
    where: { id: contact.id },
    data: { lastContactAt, driftScore: distance / 100, distance },
  })

  res.status(201).json({
    interaction: {
      id: interaction.id,
      type: interaction.type,
      occurred_at: interaction.occurredAt,
      notes: interaction.notes,
    },
    new_distance: distance,
  })
})

router.delete('/:interactionId', async (req, res) => {
  const interaction = await prisma.interaction.findFirst({
    where: {
      id: req.params.interactionId,
      contactId: req.params.id,
      userId: req.userId,
    },
  })
  if (!interaction) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interaction not found.' } })
    return
  }

  await prisma.interaction.delete({ where: { id: interaction.id } })

  const latest = await prisma.interaction.findFirst({
    where: { contactId: req.params.id },
    orderBy: { occurredAt: 'desc' },
  })

  const lastContactAt = latest?.occurredAt ?? null
  const daysSince = lastContactAt
    ? Math.floor((Date.now() - lastContactAt.getTime()) / 86400000)
    : null
  const distance = computeDistance(daysSince)

  await prisma.contact.update({
    where: { id: req.params.id },
    data: { lastContactAt, driftScore: distance / 100, distance },
  })

  res.json({ message: 'Interaction deleted.' })
})

export default router
