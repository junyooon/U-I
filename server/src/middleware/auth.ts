import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing access token.' } })
    return
  }
  try {
    req.userId = verifyAccessToken(header.slice(7))
    next()
  } catch {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token.' } })
  }
}
