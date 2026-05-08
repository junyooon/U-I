import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET!

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): string {
  const payload = jwt.verify(token, secret) as { sub: string }
  return payload.sub
}
