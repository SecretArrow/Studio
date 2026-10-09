import { NextRequest } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { audit } from "@/lib/auth"

const schema = z.object({ token: z.string().min(10).max(200) })

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const { token } = await parseBody(req, schema)
  const tokens = await db.authToken.findMany({
    where: { purpose: "verify", usedAt: null, expiresAt: { gt: new Date() } },
  })
  let matched: (typeof tokens)[number] | null = null
  for (const t of tokens) {
    if (await bcrypt.compare(token, t.tokenHash)) {
      matched = t
      break
    }
  }
  if (!matched) throw new ApiError(400, "Verification link is invalid or has expired")
  await db.$transaction([
    db.user.update({ where: { id: matched.userId }, data: { emailVerifiedAt: new Date() } }),
    db.authToken.update({ where: { id: matched.id }, data: { usedAt: new Date() } }),
  ])
  await audit("auth.verify", matched.userId, matched.userId)
  return ok({ ok: true })
})
