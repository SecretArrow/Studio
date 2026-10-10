import { NextRequest } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { ApiError, ok, route, assertSameOrigin } from "@/lib/api-utils"
import { getSessionUser, ensurePersonalWorkspace } from "@/lib/auth"
import { isTemplateLocale } from "@/lib/design/i18n/locales"
import { localizeDesignDoc } from "@/lib/design/i18n/localize"
import type { DesignDoc } from "@/lib/design/types"

type Ctx = { params: Promise<{ id: string }> }

/**
 * Server-side dictionary cache. Dictionaries are immutable static files, so a
 * per-process Map keyed by locale is enough (validated locale codes only).
 */
const dictCache = new Map<string, Record<string, string>>()

async function readTemplateDictionary(locale: string): Promise<Record<string, string>> {
  const cached = dictCache.get(locale)
  if (cached) return cached
  const file = path.join(process.cwd(), "public", "i18n", "templates", `${locale}.json`)
  const raw = await readFile(file, "utf8")
  const dict = JSON.parse(raw) as Record<string, string>
  if (!dict || typeof dict !== "object" || Array.isArray(dict)) throw new Error("Invalid dictionary file")
  dictCache.set(locale, dict)
  return dict
}

/** Safely read the optional { locale } body — empty/missing/malformed bodies are fine. */
async function readLocaleBody(req: NextRequest): Promise<{ locale?: string }> {
  try {
    const body = (await req.json()) as { locale?: unknown } | null
    if (body && typeof body === "object" && typeof body.locale === "string") return { locale: body.locale }
  } catch {
    /* no body or invalid JSON — treat as no locale */
  }
  return {}
}

/** POST /api/templates/[id]/use — create a personal editable project from a template */
export const POST = route(async (req: NextRequest, ctx: Ctx) => {
  assertSameOrigin(req)
  const { id } = await ctx.params
  const user = await getSessionUser()
  if (!user) throw new ApiError(401, "Sign in to use templates", "unauthorized")
  const template = await db.template.findUnique({ where: { id } })
  if (!template) throw new ApiError(404, "Template not found")
  const workspaceId = await ensurePersonalWorkspace(user.id)

  // Effective locale: explicit body locale → session user's profile locale → none.
  const body = await readLocaleBody(req)
  const effectiveLocale = isTemplateLocale(body.locale) ? body.locale : isTemplateLocale(user.locale) ? user.locale : null

  // Localize best-effort: any failure falls back to the original doc — using a
  // template must never break because of localization.
  let contentJson = template.contentJson
  let doc: DesignDoc | null = null
  let localizedTo: string | null = null
  try {
    doc = JSON.parse(template.contentJson) as DesignDoc
  } catch {
    doc = null
  }
  if (doc && effectiveLocale) {
    try {
      const dict = await readTemplateDictionary(effectiveLocale)
      doc = localizeDesignDoc(doc, dict)
      contentJson = JSON.stringify(doc)
      localizedTo = effectiveLocale
    } catch (e) {
      console.error("[templates/use] localization failed, using original doc", e)
      localizedTo = null
    }
  }

  const project = await db.project.create({
    data: {
      name: `${template.name}`,
      type: template.type,
      width: template.width,
      height: template.height,
      contentJson,
      thumbnail: template.thumbnail,
      ownerId: user.id,
      workspaceId,
      templateId: template.id,
    },
    select: { id: true, name: true, type: true, updatedAt: true },
  })
  return ok({ project, doc, localizedTo }, { status: 201 })
})
