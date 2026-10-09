import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ok, parseBody, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser } from "@/lib/auth"
import { getProjectAccess } from "@/lib/projects"

type Ctx = { params: Promise<{ id: string }> }

export const GET = route(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params
  const user = await getSessionUser()
  await getProjectAccess(id, user, "read")
  const versions = await db.projectVersion.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, label: true, thumbnail: true, createdAt: true, createdBy: { select: { name: true } } },
  })
  return ok({ versions })
})

const createSchema = z.object({ label: z.string().max(120).optional() })

export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  const { project } = await getProjectAccess(id, user, "edit")
  const body = await parseBody(req, createSchema)
  const count = await db.projectVersion.count({ where: { projectId: id } })
  const version = await db.projectVersion.create({
    data: {
      projectId: id,
      label: body.label || `Snapshot ${count + 1}`,
      contentJson: project.contentJson,
      thumbnail: project.thumbnail,
      createdById: user!.id,
    },
    select: { id: true, label: true, createdAt: true },
  })
  return ok({ version }, { status: 201 })
})
