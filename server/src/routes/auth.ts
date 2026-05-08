import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import { google } from 'googleapis'
import prisma from '../db/prisma'
import { signAccessToken } from '../lib/jwt'
import { generateRefreshToken, hashToken, cookieOptions, REFRESH_EXPIRY_MS } from '../lib/tokens'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0]
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.', field } })
    return
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already registered.' } })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, emailVerified: true },
  })
  await prisma.notificationSettings.create({ data: { userId: user.id } })

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email },
    message: 'Account created.',
  })
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input.' } })
    return
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials.' } })
    return
  }

  const raw = generateRefreshToken()
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    },
  })

  res.cookie('refresh_token', raw, cookieOptions())
  res.json({
    access_token: signAccessToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  })
})

router.post('/refresh', async (req, res) => {
  const raw: string | undefined = req.cookies?.refresh_token
  if (!raw) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token.' } })
    return
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(raw) },
  })

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired refresh token.' } })
    return
  }

  const newRaw = generateRefreshToken()
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(newRaw),
        expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
      },
    }),
  ])

  res.cookie('refresh_token', newRaw, cookieOptions())
  res.json({ access_token: signAccessToken(stored.userId) })
})

router.post('/logout', async (req, res) => {
  const raw: string | undefined = req.cookies?.refresh_token
  if (raw) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw), revoked: false },
      data: { revoked: true },
    })
  }
  res.clearCookie('refresh_token', { path: '/' })
  res.json({ message: 'Logged out.' })
})

router.post('/oauth/google', async (req, res) => {
  const parsed = z.object({ code: z.string() }).safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing code.' } })
    return
  }

  try {
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )

    const { tokens } = await oauth2Client.getToken(parsed.data.code)
    oauth2Client.setCredentials(tokens)

    const people = google.people({ version: 'v1', auth: oauth2Client })
    const me = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names',
    })

    const email = me.data.emailAddresses?.[0]?.value
    const name = me.data.names?.[0]?.displayName ?? 'User'
    const oauthId = me.data.resourceName?.split('/')[1]

    if (!email || !oauthId) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Could not retrieve Google account info.' } })
      return
    }

    let user = await prisma.user.findUnique({ where: { email } })
    let isNewUser = false

    if (!user) {
      user = await prisma.user.create({
        data: { name, email, emailVerified: true, oauthProvider: 'google', oauthId },
      })
      await prisma.notificationSettings.create({ data: { userId: user.id } })
      isNewUser = true
    }

    const raw = generateRefreshToken()
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
      },
    })

    res.cookie('refresh_token', raw, cookieOptions())
    res.json({
      access_token: signAccessToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
      is_new_user: isNewUser,
    })
  } catch (err) {
    console.error('Google OAuth error:', err)
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid or expired Google code.' } })
  }
})

export default router
