import "server-only"
import { db } from "@/lib/db"
import { ApiError } from "@/lib/api-utils"
import type { SessionUser } from "@/lib/auth"

export type ShareRole = "viewer" | "commenter" | "editor"

export interface ProjectAccess {
  project: {
    id: string
    name: string
    type: string
    width: number
    height: number
    contentJson: string
    thumbnail: string | null
    ownerId: string
    workspaceId: string
    folderId: string | null
    favorite: boolean
    shareMode: string
    updatedAt: Date
    createdAt: Date
    deletedAt: Date | null
  }
  role: "owner" | "editor" | "commenter" | "viewer"
}

/** Resolve a project and the acting user's role on it. */
export async function getProjectAccess(projectId: string, user: SessionUser | null, need: "read" | "comment" | "edit" = "read", shareToken?: string | null): Promise<ProjectAccess> {
  const project = await db.project.findUnique({ where: { id: projectId } })
  if (!project || project.deletedAt) throw new ApiError(404, "Project not found")

  // Rank of the granted roles vs. the minimum role the requested access level needs.
  // (need "comment" maps to the "commenter" role, "edit" to "editor".)
  const rank: Record<string, number> = { viewer: 1, commenter: 2, editor: 3 }
  const required = need === "read" ? "viewer" : need === "comment" ? "commenter" : "editor"

  if (user && project.ownerId === user.id) return { project, role: "owner" }

  // share link token path
  if (shareToken) {
    const link = await db.shareLink.findUnique({ where: { token: shareToken } })
    if (link && !link.revoked && link.projectId === projectId && (!link.expiresAt || link.expiresAt > new Date())) {
      if (rank[link.role] >= rank[required]) return { project, role: link.role as ShareRole }
    }
  }

  // workspace member path
  if (user) {
    const member = await db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: project.workspaceId, userId: user.id } },
    })
    if (member) {
      const role = member.role === "owner" ? "editor" : member.role === "admin" ? "editor" : "viewer"
      if (rank[role] >= rank[required]) return { project, role: role as ShareRole }
    }
  }

  // global link-share mode
  const modeRank: Record<string, string> = { "link-view": "viewer", "link-comment": "commenter", "link-edit": "editor" }
  const modeRole = modeRank[project.shareMode]
  if (modeRole) {
    if (rank[modeRole] >= rank[required]) return { project, role: modeRole as ShareRole }
  }

  throw new ApiError(403, "You do not have access to this project", "forbidden")
}
