import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"
import { requireUser } from "@/lib/api-utils"

export const GET = route(async (req: NextRequest) => {
  await requireUser(["admin"])
  const [users, projects, assets, templates, versions, audit] = await Promise.all([
    db.user.count(),
    db.project.count(),
    db.asset.count(),
    db.template.count(),
    db.projectVersion.count(),
    db.auditLog.count(),
  ])
  return ok({ users, projects, assets, templates, versions, audit })
})
