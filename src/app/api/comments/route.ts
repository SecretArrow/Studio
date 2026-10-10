import { NextRequest } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { ApiError, assertSameOrigin, ok, parseBody, rateLimit, requireUser, route } from "@/lib/api-utils"
import { getSessionUser } from "@/lib/auth"
import { getProjectAccess } from "@/lib/projects"

/** GET /api/comments?projectId=&share= — read access (incl. share-link guests) */
export const GET = route(async (req: NextRequest) => {
  const user = await getSessionUser()
  const projectId = req.nextUrl.searchParams.get("projectId")
  if (!projectId) throw new ApiError(400, "projectId is required")
  const share = req.nextUrl.searchParams.get("share") || undefined

  await getProjectAccess(projectId, user, "read", share)

  const rows = await db.comment.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, projectId: true, pageId: true, elementId: true, body: true,
      parentId: true, resolved: true, createdAt: true,
      user: { select: { name: true, email: true } },
    },
  })
  const comments = rows.map(({ user: author, ...c }) => ({
    ...c,
    author: { name: author?.name ?? null, email: author?.email ?? null },
  }))
  return ok({ comments })
})

const createSchema = z.object({
  projectId: z.string().min(1),
  pageId: z.string().max(100).optional(),
  elementId: z.string().max(100).optional(),
  body: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long (2000 chars max)"),
  parentId: z.string().optional(),
})

/** POST /api/comments — requires "comment" access; notifies the project owner */
export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "comment", 60, 60_000)
  const user = await requireUser()
  const body = await parseBody(req, createSchema)
  const share = req.nextUrl.searchParams.get("share") || undefined

  const access = await getProjectAccess(body.projectId, user, "comment", share)

  if (body.parentId) {
    const parent = await db.comment.findUnique({ where: { id: body.parentId }, select: { projectId: true } })
    if (!parent || parent.projectId !== body.projectId) throw new ApiError(400, "Parent comment not found")
  }

  const comment = await db.comment.create({
    data: {
      projectId: body.projectId,
      pageId: body.pageId,
      elementId: body.elementId,
      userId: user.id,
      body: body.body,
      parentId: body.parentId,
    },
  })

  if (access.project.ownerId !== user.id) {
    await db.notification
      .create({
        data: {
          userId: access.project.ownerId,
          type: "comment",
          payloadJson: JSON.stringify({
            projectId: body.projectId,
            projectName: access.project.name,
            commentId: comment.id,
            by: user.name || user.email,
          }),
        },
      })
      .catch(() => {})
  }

  return ok({ comment: { ...comment, author: { name: user.name, email: user.email } } }, { status: 201 })
})
