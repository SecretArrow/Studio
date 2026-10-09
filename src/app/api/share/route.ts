import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { requireUser } from "@/lib/api-utils"
import { getProjectAccess } from "@/lib/projects"

export const GET = route(async (req: NextRequest) => {
  const user = await requireUser()
  const projectId = req.nextUrl.searchParams.get("projectId") || ""
  if (!projectId) throw new ApiError(400, "projectId required")
  await getProjectAccess(projectId, user, "edit")
  const links = await db.shareLink.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { id: true, token: true, role: true, revoked: true, createdAt: true },
  })
  return ok({ links })
})

const createSchema = z.object({ projectId: z.string(), role: z.enum(["viewer", "commenter", "editor"]) })

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const body = await parseBody(req, createSchema)
  await getProjectAccess(body.projectId, user, "edit")
  const link = await db.shareLink.create({
    data: { projectId: body.projectId, role: body.role, token: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""), createdById: user.id },
    select: { id: true, token: true, role: true },
  })
  return ok({ link }, { status: 201 })
})
