import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, rateLimit, route, assertSameOrigin } from "@/lib/api-utils"
import { audit, hashPassword, setSessionCookie, createSessionToken } from "@/lib/auth"

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(200),
})

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "reset", 10, 60_000)
  const { token, password } = await parseBody(req, schema)

  const tokens = await db.authToken.findMany({
    where: { purpose: "reset", usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
  let matched: (typeof tokens)[number] | null = null
  for (const t of tokens) {
    if (await bcrypt.compare(token, t.tokenHash)) {
      matched = t
      break
    }
  }
  if (!matched) throw new ApiError(400, "Reset link is invalid or has expired")

  const passwordHash = await hashPassword(password)
  await db.$transaction([
    db.user.update({ where: { id: matched.userId }, data: { passwordHash } }),
    db.authToken.update({ where: { id: matched.id }, data: { usedAt: new Date() } }),
  ])
  await audit("auth.reset", matched.userId, matched.userId)
  const jwt = await createSessionToken(matched.userId)
  return setSessionCookie(ok({ ok: true }), jwt)
})
