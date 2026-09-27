import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { getDatabase, type SubscriptionTier, type User } from './db'

export interface AuthTokenPayload {
  sub: string
  email: string
  tier: SubscriptionTier
  iat: number
  exp: number
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        tier: SubscriptionTier
      }
    }
  }
}

const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'zand_ai_jwt_insecure_development_secret_change_me'

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || DEFAULT_JWT_SECRET
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const hash = hashPassword(password, salt)
  const a = Buffer.from(hash, 'hex')
  const b = Buffer.from(storedHash, 'hex')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf-8')
}

export function createJwt(payload: { sub: string; email: string; tier: SubscriptionTier }, expiresInSeconds = 86400 * 7): string {
  const secret = getJwtSecret()
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const nowSec = Math.floor(Date.now() / 1000)
  const fullPayload: AuthTokenPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + expiresInSeconds,
  }
  const payloadEncoded = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payloadEncoded}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  return `${header}.${payloadEncoded}.${signature}`
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, payload, signature] = parts
    const secret = getJwtSecret()

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const a = Buffer.from(signature)
    const b = Buffer.from(expectedSignature)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null
    }

    const decoded = JSON.parse(base64UrlDecode(payload)) as AuthTokenPayload
    const nowSec = Math.floor(Date.now() / 1000)
    if (decoded.exp && decoded.exp < nowSec) {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const token = authHeader.slice(7).trim()
  const payload = verifyJwt(token)
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  const db = getDatabase()
  const user = await db.findUserById(payload.sub)
  if (!user) {
    res.status(401).json({ error: 'User account not found' })
    return
  }

  req.user = {
    id: user.id,
    email: user.email,
    tier: user.tier,
  }

  next()
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    const payload = verifyJwt(token)
    if (payload) {
      const db = getDatabase()
      const user = await db.findUserById(payload.sub)
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          tier: user.tier,
        }
      }
    }
  }
  next()
}

export function sanitizeUser(user: User): {
  id: string
  email: string
  tier: SubscriptionTier
  createdAt: string
} {
  return {
    id: user.id,
    email: user.email,
    tier: user.tier,
    createdAt: user.createdAt,
  }
}
