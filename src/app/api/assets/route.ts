import { NextRequest } from "next/server"
import path from "node:path"
import { promises as fs } from "node:fs"
import { randomBytes } from "node:crypto"
import { db } from "@/lib/db"
import {
  ApiError,
  MAX_UPLOAD_BYTES,
  assertSameOrigin,
  ok,
  rateLimit,
  requireUser,
  route,
  sanitizeSvg,
  sniffMime,
} from "@/lib/api-utils"
import { getSessionUser } from "@/lib/auth"

export const runtime = "nodejs"

const UPLOAD_ROOT = "/home/z/my-project/upload"

const KIND_BY_MIME: Record<string, string> = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "svg",
}

function kindOf(mime: string): string | null {
  if (KIND_BY_MIME[mime]) return KIND_BY_MIME[mime]
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  if (mime.startsWith("font/")) return "font"
  return null
}

/** GET /api/assets?kind=&q= — current user's private uploads + the public CC0 library */
export const GET = route(async (req: NextRequest) => {
  const user = await getSessionUser()
  const sp = req.nextUrl.searchParams
  const kind = sp.get("kind") || undefined
  const q = sp.get("q")?.trim() || ""

  const where = {
    ...(kind ? { kind } : {}),
    ...(q ? { filename: { contains: q } } : {}),
    ...(user ? { OR: [{ ownerId: user.id }, { ownerId: null }] } : { ownerId: null }),
  }

  const [assets, total] = await Promise.all([
    db.asset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, kind: true, url: true, filename: true, mime: true, size: true,
        width: true, height: true, license: true, attribution: true, tags: true,
        ownerId: true, createdAt: true,
      },
    }),
    db.asset.count({ where }),
  ])
  return ok({ assets, total })
})

/** POST /api/assets — multipart upload (field "file", 30MB max, magic-byte verified) */
export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  const user = await requireUser()
  rateLimit(req, "upload", 30, 60_000)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    throw new ApiError(400, "Expected multipart/form-data with a 'file' field")
  }
  const entry = form.get("file")
  if (!(entry instanceof File)) throw new ApiError(400, "Missing 'file' field")
  if (entry.size === 0) throw new ApiError(400, "File is empty")
  if (entry.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "File too large — 30MB maximum")

  const originalName = (entry.name.split(/[\\/]/).pop() || "upload").slice(0, 200)
  const isSvg = originalName.toLowerCase().endsWith(".svg") || entry.type === "image/svg+xml"

  let buf: Buffer
  let mime: string
  let ext: string
  let kind: string | null

  if (isSvg) {
    const text = await entry.text()
    if (!/<svg[\s>]/i.test(text)) throw new ApiError(400, "File is not a valid SVG document")
    buf = Buffer.from(sanitizeSvg(text), "utf8")
    mime = "image/svg+xml"
    ext = "svg"
    kind = "svg"
  } else {
    const ab = await entry.arrayBuffer()
    const sniff = sniffMime(ab)
    const sniffedKind = sniff ? kindOf(sniff.mime) : null
    if (!sniff || !sniffedKind) {
      throw new ApiError(415, "Unsupported file type — upload images, SVG, video, audio or fonts")
    }
    buf = Buffer.from(ab)
    mime = sniff.mime
    ext = sniff.ext
    kind = sniffedKind
  }

  const now = new Date()
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const storedName = `c${now.getTime().toString(36)}${randomBytes(9).toString("hex")}.${ext}`
  const dir = path.join(UPLOAD_ROOT, ym)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, storedName), buf)

  const asset = await db.asset.create({
    data: {
      ownerId: user.id,
      kind,
      url: `/api/files/${ym}/${storedName}`,
      filename: originalName,
      mime,
      size: buf.length,
      license: "CC0",
    },
    select: { id: true, kind: true, url: true, filename: true, mime: true, size: true, createdAt: true },
  })
  return ok({ asset }, { status: 201 })
})
