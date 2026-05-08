import crypto from 'crypto'
import { CookieOptions } from 'express'

export const REFRESH_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_EXPIRY_MS,
    path: '/',
  }
}
