import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, requireUser, route } from "@/lib/api-utils"
import { getProjectAccess } from "@/lib/projects"

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  resolved: z.boolean().optional(),
  body: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long (2000 chars max)").optional(),
})

/** PATCH /api/comments/[id] — resolve/edit; allowed for the author or editors */
export const PATCH = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const comment = await db.comment.findUnique({ where: { id } })
  if (!comment) throw new ApiError(404, "Comment not found")

  const share = req.nextUrl.searchParams.get("share") || undefined
  if (comment.userId !== user.id) {
    await getProjectAccess(comment.projectId, user, "edit", share)
  }

  const body = await parseBody(req, patchSchema)
  const data: { resolved?: boolean; body?: string } = {}
  if (body.resolved !== undefined) data.resolved = body.resolved
  if (body.body !== undefined) data.body = body.body

  const updated = await db.comment.update({
    where: { id },
    data,
    select: { id: true, body: true, resolved: true, projectId: true, pageId: true, elementId: true, parentId: true, createdAt: true },
  })
  return ok({ comment: updated })
})

/** DELETE /api/comments/[id] — allowed for the author or the project owner */
export const DELETE = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const user = await requireUser()
  const { id } = await ctx.params

  const comment = await db.comment.findUnique({ where: { id } })
  if (!comment) throw new ApiError(404, "Comment not found")

  if (comment.userId !== user.id) {
    const project = await db.project.findUnique({ where: { id: comment.projectId }, select: { ownerId: true } })
    if (!project || project.ownerId !== user.id) {
      throw new ApiError(403, "Only the comment author or the project owner can delete it")
    }
  }

  await db.comment.deleteMany({ where: { parentId: id } }) // remove direct replies
  await db.comment.delete({ where: { id } })
  return ok({ deleted: true })
})
