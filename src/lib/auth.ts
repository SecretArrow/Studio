import "server-only"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const COOKIE_NAME = "studio_session"
const SESSION_DAYS = 7

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET || "studio-dev-secret-change-me-in-production-0123456789"
  return new TextEncoder().encode(s)
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  locale: string
  avatarUrl: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret())
}

export async function setSessionCookie(response: NextResponse, token: string): Promise<NextResponse> {
  response.headers.append(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    }),
  )
  return response
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.headers.append(
    "Set-Cookie",
    serializeCookie(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 }),
  )
  return response
}

interface CookieOpts {
  httpOnly?: boolean
  sameSite?: "lax" | "strict" | "none"
  secure?: boolean
  path?: string
  maxAge?: number
}

function serializeCookie(name: string, value: string, opts: CookieOpts): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${opts.path ?? "/"}`)
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`)
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite === "lax" ? "Lax" : opts.sameSite === "strict" ? "Strict" : "None"}`)
  if (opts.secure) parts.push("Secure")
  if (opts.httpOnly) parts.push("HttpOnly")
  return parts.join("; ")
}

/** Reads the session cookie and loads the user. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(COOKIE_NAME)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secret())
    const userId = payload.sub
    if (!userId) return null
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return null
    return { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale, avatarUrl: user.avatarUrl }
  } catch {
    return null
  }
}

export async function ensurePersonalWorkspace(userId: string): Promise<string> {
  const existing = await db.workspace.findFirst({
    where: { members: { some: { userId, role: "owner" } } },
  })
  if (existing) return existing.id
  const user = await db.user.findUnique({ where: { id: userId } })
  const ws = await db.workspace.create({
    data: { name: user?.name ? `${user.name}'s Workspace` : "My Workspace", ownerId: userId },
  })
  await db.workspaceMember.create({ data: { workspaceId: ws.id, userId, role: "owner" } })
  return ws.id
}

export async function audit(action: string, actorId?: string | null, target?: string | null, meta?: Record<string, unknown>) {
  try {
    await db.auditLog.create({
      data: { action, actorId: actorId ?? undefined, target: target ?? undefined, metaJson: JSON.stringify(meta ?? {}) },
    })
  } catch {
    // audit must never break the request
  }
}
