import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, rateLimit, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, createSessionToken, ensurePersonalWorkspace, setSessionCookie, verifyPassword } from "@/lib/auth"

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
})

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "login", 10, 60_000)
  const body = await parseBody(req, schema)
  const email = body.email.toLowerCase().trim()

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password", "bad_credentials")
  }
  const workspaceId = await ensurePersonalWorkspace(user.id)
  await audit("user.login", user.id, user.id)
  const jwt = await createSessionToken(user.id)
  return setSessionCookie(
    ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role, locale: user.locale, avatarUrl: user.avatarUrl }, workspaceId }),
    jwt,
  )
})
