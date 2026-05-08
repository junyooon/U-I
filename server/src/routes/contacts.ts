import { Router } from 'express'
import { z } from 'zod'
import prisma from '../db/prisma'
import { requireAuth } from '../middleware/auth'
import { computeDistance } from '../lib/distance'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const schema = z.object({
    category_id: z.string().uuid().optional(),
    sort: z.enum(['name', 'last_contact', 'drift_score']).default('drift_score'),
    limit: z.coerce.number().int().min(1).max(500).default(100),
    offset: z.coerce.number().int().min(0).default(0),
  })

  const parsed = schema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid query.' } })
    return
  }

  const { category_id, sort, limit, offset } = parsed.data

  const orderBy =
    sort === 'name' ? { name: 'asc' as const }
    : sort === 'last_contact' ? { lastContactAt: 'desc' as const }
    : { driftScore: 'desc' as const }

  const where = {
    userId: req.userId,
    ...(category_id ? { contactCategories: { some: { categoryId: category_id } } } : {}),
  }

  const [contacts, total] = await prisma.$transaction([
    prisma.contact.findMany({
      where,
      include: { contactCategories: { select: { categoryId: true } } },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.contact.count({ where }),
  ])

  res.json({
    contacts: contacts.map(c => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      category_ids: c.contactCategories.map(cc => cc.categoryId),
      last_contact_at: c.lastContactAt,
      drift_score: c.driftScore,
      distance: c.distance,
      created_at: c.createdAt,
    })),
    total,
  })
})

const IMPORT_COLORS = [
  '#4A90D9', '#7C3AED', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#F97316',
  '#8B5CF6', '#14B8A6', '#F43F5E', '#84CC16',
]

router.post('/import', async (req, res) => {
  const schema = z.object({
    contacts: z.array(z.object({
      name: z.string().min(1).max(100),
      email: z.string().email().nullable().optional(),
      phone: z.string().max(30).nullable().optional(),
      notes: z.string().nullable().optional(),
      category_names: z.array(z.string()).default([]),
    })).min(1).max(500),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  // Collect all unique category names from the import
  const allCategoryNames = [...new Set(
    parsed.data.contacts.flatMap(c => c.category_names.map(n => n.trim().toLowerCase()))
  )].filter(Boolean)

  // Fetch existing categories
  const existingCategories = await prisma.category.findMany({
    where: { userId: req.userId },
  })
  const existingByName = new Map(existingCategories.map(c => [c.name.toLowerCase(), c]))

  // Create missing categories
  const newCategoryNames = allCategoryNames.filter(n => !existingByName.has(n))
  if (newCategoryNames.length > 0) {
    const colorCount = existingCategories.length
    await prisma.category.createMany({
      data: newCategoryNames.map((name, i) => ({
        userId: req.userId,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        color: IMPORT_COLORS[(colorCount + i) % IMPORT_COLORS.length],
      })),
    })
  }

  // Re-fetch all categories now including new ones
  const allCategories = await prisma.category.findMany({ where: { userId: req.userId } })
  const catByName = new Map(allCategories.map(c => [c.name.toLowerCase(), c]))

  // Bulk create contacts
  let imported = 0
  for (const row of parsed.data.contacts) {
    const categoryIds = row.category_names
      .map(n => catByName.get(n.trim().toLowerCase())?.id)
      .filter((id): id is string => !!id)

    await prisma.contact.create({
      data: {
        userId: req.userId,
        name: row.name,
        email: row.email ?? null,
        phone: row.phone ?? null,
        notes: row.notes ?? null,
        driftScore: 0.85,
        distance: 85,
        contactCategories: { create: categoryIds.map(categoryId => ({ categoryId })) },
      },
    })
    imported++
  }

  res.status(201).json({ imported })
})

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100),
    phone: z.string().max(30).nullable().optional(),
    email: z.string().email().nullable().optional(),
    category_ids: z.array(z.string().uuid()).default([]),
    last_contact_at: z.string().datetime().nullable().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const { name, phone, email, category_ids, last_contact_at } = parsed.data
  const lastContactAt = last_contact_at ? new Date(last_contact_at) : null
  const daysSince = lastContactAt
    ? Math.floor((Date.now() - lastContactAt.getTime()) / 86400000)
    : null
  const distance = computeDistance(daysSince)

  const contact = await prisma.contact.create({
    data: {
      userId: req.userId,
      name,
      phone: phone ?? null,
      email: email ?? null,
      lastContactAt,
      driftScore: distance / 100,
      distance,
      contactCategories: { create: category_ids.map(categoryId => ({ categoryId })) },
    },
    include: { contactCategories: { select: { categoryId: true } } },
  })

  res.status(201).json({
    contact: {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      category_ids: contact.contactCategories.map(cc => cc.categoryId),
      last_contact_at: contact.lastContactAt,
      drift_score: contact.driftScore,
      distance: contact.distance,
      created_at: contact.createdAt,
    },
  })
})

router.get('/:id', async (req, res) => {
  const contact = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      contactCategories: { select: { categoryId: true } },
      interactions: { orderBy: { occurredAt: 'desc' } },
    },
  })

  if (!contact) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contact not found.' } })
    return
  }

  res.json({
    contact: {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      notes: contact.notes,
      category_ids: contact.contactCategories.map(cc => cc.categoryId),
      last_contact_at: contact.lastContactAt,
      drift_score: contact.driftScore,
      distance: contact.distance,
      created_at: contact.createdAt,
    },
    interactions: contact.interactions.map(i => ({
      id: i.id,
      type: i.type,
      occurred_at: i.occurredAt,
      notes: i.notes,
    })),
  })
})

router.patch('/:id', async (req, res) => {
  const schema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(30).nullable().optional(),
    email: z.string().email().nullable().optional(),
    notes: z.string().nullable().optional(),
    category_ids: z.array(z.string().uuid()).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const existing = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contact not found.' } })
    return
  }

  const { category_ids, ...fields } = parsed.data

  const contact = await prisma.contact.update({
    where: { id: req.params.id },
    data: {
      ...fields,
      ...(category_ids !== undefined
        ? { contactCategories: { deleteMany: {}, create: category_ids.map(categoryId => ({ categoryId })) } }
        : {}),
    },
    include: { contactCategories: { select: { categoryId: true } } },
  })

  res.json({
    contact: {
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      notes: contact.notes,
      category_ids: contact.contactCategories.map(cc => cc.categoryId),
      last_contact_at: contact.lastContactAt,
      drift_score: contact.driftScore,
      distance: contact.distance,
    },
  })
})

router.delete('/:id', async (req, res) => {
  const existing = await prisma.contact.findFirst({
    where: { id: req.params.id, userId: req.userId },
  })
  if (!existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Contact not found.' } })
    return
  }

  await prisma.contact.delete({ where: { id: req.params.id } })
  res.json({ message: 'Contact permanently deleted.' })
})

export default router
