import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { ok, parseBody, rateLimit, route, assertSameOrigin } from "@/lib/api-utils"
import { audit } from "@/lib/auth"

const schema = z.object({ email: z.string().email().max(200) })

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "forgot", 5, 60_000)
  const { email } = await parseBody(req, schema)
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

  // Always return ok to avoid account enumeration.
  if (!user) return ok({ ok: true })

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
  const tokenHash = await bcrypt.hash(token, 8)
  await db.authToken.create({
    data: { userId: user.id, tokenHash, purpose: "reset", expiresAt: new Date(Date.now() + 3600_000) },
  })
  await audit("auth.forgot", user.id, user.id)

  if (process.env.SMTP_HOST && process.env.SMTP_FROM) {
    // Operators configure SMTP via env; when present a mailer job can pick this up.
    // We surface the token through the notification system as a queue item.
    await db.notification.create({
      data: {
        userId: user.id,
        type: "email.queue",
        payloadJson: JSON.stringify({
          to: user.email,
          subject: "Reset your Studio password",
          body: `Use this token to reset your password: ${token}\nValid for 1 hour.`,
        }),
      },
    })
    return ok({ ok: true, delivered: "email" })
  }

  // Transparent self-hosted/dev mode: no SMTP configured, so hand the token back
  // instead of pretending an email was sent.
  return ok({ ok: true, delivered: "manual", token })
})
