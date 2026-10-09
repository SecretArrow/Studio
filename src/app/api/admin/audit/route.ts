import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, route } from "@/lib/api-utils"
import { requireUser } from "@/lib/api-utils"

export const GET = route(async (req: NextRequest) => {
  await requireUser(["admin"])
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50", 10) || 50, 200)
  const rows = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  })
  return ok({ rows })
})
