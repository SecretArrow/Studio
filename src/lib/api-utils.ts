import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser, type SessionUser } from "@/lib/auth"

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, message: string, code = "error") {
    super(message)
    this.status = status
    this.code = code
  }
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data as unknown as Record<string, unknown>, init)
}

export function fail(status: number, message: string, code = "error"): NextResponse {
  return NextResponse.json({ error: message, code }, { status })
}

/** Wraps a route handler with uniform error mapping. */
export function route<T extends unknown[]>(fn: (...args: T) => Promise<NextResponse>): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args)
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.message, e.code)
      console.error("[api]", e)
      const message = e instanceof Error ? e.message : "Internal error"
      return fail(500, message)
    }
  }
}

export async function requireUser(roles?: string[]): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new ApiError(401, "Sign in required", "unauthorized")
  if (roles && !roles.includes(user.role)) throw new ApiError(403, "Insufficient permissions", "forbidden")
  return user
}

export async function parseBody<T>(req: NextRequest, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    throw new ApiError(400, "Invalid JSON body")
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new ApiError(400, msg, "validation")
  }
  return result.data
}

/* ---------------- rate limiting (in-memory token bucket) ---------------- */

const buckets = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(req: NextRequest, key: string, limit: number, windowMs: number): void {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local"
  const bucketKey = `${key}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(bucketKey)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return
  }
  bucket.count += 1
  if (bucket.count > limit) {
    throw new ApiError(429, "Too many requests — slow down and try again shortly", "rate_limited")
  }
}

/** Basic CSRF guard: for mutating verbs require same-origin (or missing Origin for native clients). */
export function assertSameOrigin(req: NextRequest): void {
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method)
  if (!mutating) return
  const origin = req.headers.get("origin")
  if (!origin) return // non-browser client
  const host = req.headers.get("host")
  try {
    const originHost = new URL(origin).host
    if (host && originHost !== host) throw new ApiError(403, "Cross-origin request blocked", "csrf")
  } catch (e) {
    if (e instanceof ApiError) throw e
    throw new ApiError(403, "Invalid origin", "csrf")
  }
}

/* ---------------- upload safety ---------------- */

const MAGIC: { mime: string; ext: string; bytes: number[]; offset?: number }[] = [
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", ext: "gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "video/mp4", ext: "mp4", bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: "video/webm", ext: "webm", bytes: [0x1a, 0x45, 0xdf, 0xa3] },
  { mime: "audio/mpeg", ext: "mp3", bytes: [0x49, 0x44, 0x33] },
  { mime: "audio/wav", ext: "wav", bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "audio/ogg", ext: "ogg", bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: "font/ttf", ext: "ttf", bytes: [0x00, 0x01, 0x00, 0x00] },
  { mime: "font/otf", ext: "otf", bytes: [0x4f, 0x54, 0x54, 0x4f] },
  { mime: "font/woff", ext: "woff", bytes: [0x77, 0x4f, 0x46, 0x46] },
  { mime: "font/woff2", ext: "woff2", bytes: [0x77, 0x4f, 0x46, 0x32] },
]

/** Detect the real content type from magic bytes; returns null when unknown. */
export function sniffMime(buf: ArrayBuffer): { mime: string; ext: string } | null {
  const arr = new Uint8Array(buf.slice(0, 16))
  for (const m of MAGIC) {
    const off = m.offset ?? 0
    if (arr.length >= off + m.bytes.length && m.bytes.every((b, i) => arr[off + i] === b)) {
      return { mime: m.mime, ext: m.ext }
    }
  }
  return null
}

const EXT_MIME: Record<string, string> = {
  svg: "image/svg+xml",
  csv: "text/csv",
  json: "application/json",
  srt: "text/plain",
  vtt: "text/plain",
  txt: "text/plain",
}

export function extMime(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  return EXT_MIME[ext] ?? null
}

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024 // 30MB

/**
 * Sanitize uploaded SVG markup: remove scripts, event handlers and
 * javascript: URLs. Returns cleaned string.
 */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "$1=\"#\"")
    .replace(/<(iframe|object|embed|animate)[\s\S]*?(<\/\1>|\/>|>)/gi, "")
}

export function clampNum(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}
