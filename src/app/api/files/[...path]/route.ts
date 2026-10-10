import { NextRequest, NextResponse } from "next/server"
import path from "node:path"
import { promises as fs } from "node:fs"
import { db } from "@/lib/db"
import { ApiError, route } from "@/lib/api-utils"

export const runtime = "nodejs"

const UPLOAD_ROOT = "/home/z/my-project/upload"

type Ctx = { params: Promise<{ path: string[] }> }

/**
 * GET /api/files/{yyyy-mm}/{filename} — stream an uploaded asset.
 * Security: strict path-traversal guard + the Asset row must exist for this exact URL.
 */
export const GET = route(async (_req: NextRequest, ctx: Ctx) => {
  const { path: segments } = await ctx.params
  if (!segments || segments.length === 0) throw new ApiError(404, "File not found")

  const cleaned: string[] = []
  for (const seg of segments) {
    let d: string
    try {
      d = decodeURIComponent(seg)
    } catch {
      throw new ApiError(400, "Bad path")
    }
    if (!d || d === "." || d === ".." || d.includes("/") || d.includes("\\") || d.includes("\0")) {
      throw new ApiError(400, "Bad path")
    }
    cleaned.push(d)
  }
  const rel = cleaned.join("/")
  const abs = path.normalize(path.join(UPLOAD_ROOT, rel))
  if (!abs.startsWith(UPLOAD_ROOT + path.sep)) throw new ApiError(400, "Bad path")

  const asset = await db.asset.findFirst({
    where: { url: `/api/files/${rel}` },
    select: { mime: true },
  })
  if (!asset) throw new ApiError(404, "File not found")

  let data: Buffer
  try {
    data = await fs.readFile(abs)
  } catch {
    throw new ApiError(404, "File not found")
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": asset.mime,
      "Content-Length": String(data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
})
