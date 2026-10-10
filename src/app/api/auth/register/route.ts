import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, rateLimit, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, createSessionToken, ensurePersonalWorkspace, hashPassword, setSessionCookie } from "@/lib/auth"

const schema = z.object({
  email: z.string().email().max(200),
  name: z.string().min(1).max(80),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
})

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "register", 5, 60_000)
  const body = await parseBody(req, schema)
  const email = body.email.toLowerCase().trim()

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) throw new ApiError(409, "An account with this email already exists")

  const passwordHash = await hashPassword(body.password)
  const user = await db.user.create({ data: { email, name: body.name.trim(), passwordHash } })
  const workspaceId = await ensurePersonalWorkspace(user.id)

  // Best-effort email verification token. When the operator has not configured
  // SMTP the token is returned so self-hosted users can still verify (transparent
  // dev mode — never faked as a "sent email").
  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
  const tokenHash = await bcrypt.hash(token, 8)
  await db.authToken.create({
    data: { userId: user.id, tokenHash, purpose: "verify", expiresAt: new Date(Date.now() + 48 * 3600_000) },
  })

  await audit("user.register", user.id, user.id, { email })
  const jwt = await createSessionToken(user.id)
  return setSessionCookie(
    ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale, avatarUrl: user.avatarUrl }, workspaceId, verifyHint: process.env.SMTP_HOST ? undefined : token }),
    jwt,
  )
})
