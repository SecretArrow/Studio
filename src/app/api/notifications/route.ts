import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"

/** GET /api/notifications — own notifications, newest 50, plus unread count */
export const GET = route(async () => {
  const user = await requireUser()
  const [notifications, unread] = await Promise.all([
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ])
  return ok({ notifications, unread })
})

const patchSchema = z.object({
  ids: z.array(z.string().min(1)).max(200).optional(),
  all: z.boolean().optional(),
})

/** PATCH /api/notifications — mark read by ids or all */
export const PATCH = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const body = await parseBody(req, patchSchema)
  if (!body.all && (!body.ids || body.ids.length === 0)) {
    throw new ApiError(400, "Provide ids[] or all=true")
  }
  const res = await db.notification.updateMany({
    where: {
      userId: user.id,
      read: false,
      ...(body.ids && !body.all ? { id: { in: body.ids } } : {}),
    },
    data: { read: true },
  })
  return ok({ updated: res.count })
})
