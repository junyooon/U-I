import { Router } from 'express'
import { z } from 'zod'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    include: { _count: { select: { contactCategories: true } } },
    orderBy: { createdAt: 'asc' },
  })

  res.json({
    categories: categories.map(c => ({
      id: c.id,
      name: c.name,
      color: c.color,
      contact_count: c._count.contactCategories,
      created_at: c.createdAt,
    })),
  })
})

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(50),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const category = await prisma.category.create({
    data: { ...parsed.data, userId: req.userId },
    include: { _count: { select: { contactCategories: true } } },
  })

  res.status(201).json({
    category: {
      id: category.id,
      name: category.name,
      color: category.color,
      contact_count: category._count.contactCategories,
      created_at: category.createdAt,
    },
  })
})

router.patch('/:id', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(50).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } })
    return
  }

  const category = await prisma.category.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  res.json({ category: { id: category.id, name: category.name, color: category.color } })
})

router.delete('/:id', async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { _count: { select: { contactCategories: true } } },
  })
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } })
    return
  }

  const contactCount = existing._count.contactCategories
  await prisma.category.delete({ where: { id: req.params.id } })

  res.json({ message: `Category deleted. ${contactCount} contacts moved to uncategorized.` })
})

export default router
