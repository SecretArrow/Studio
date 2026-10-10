import { NextRequest } from "next/server"
import { z } from "zod"
import { ApiError, assertSameOrigin, ok, parseBody, rateLimit, route } from "@/lib/api-utils"

export const runtime = "nodejs"

const AI_UNAVAILABLE = "AI service is not available on this deployment — core editing does not depend on it."

const bodySchema = z.object({
  action: z.enum(["copy", "outline", "palette", "translate", "summarize", "rewrite"]),
  payload: z.record(z.string(), z.unknown()).optional(),
})

const copySchema = z.object({
  topic: z.string().min(1, "topic is required").max(300),
  platform: z.string().min(1).max(60).default("social media"),
  tone: z.string().min(1).max(60).default("friendly"),
})
const outlineSchema = z.object({
  topic: z.string().min(1, "topic is required").max(300),
  slides: z.number().int().min(1).max(30).default(8),
})
const paletteSchema = z.object({
  brand: z.string().min(1, "brand is required").max(200),
  mood: z.string().min(1).max(100).default("modern"),
})
const translateSchema = z.object({
  text: z.string().min(1, "text is required").max(8000),
  targetLang: z.string().min(1, "targetLang is required").max(60),
})
const summarizeSchema = z.object({ text: z.string().min(1, "text is required").max(16_000) })
const rewriteSchema = z.object({
  text: z.string().min(1, "text is required").max(8000),
  style: z.string().min(1, "style is required").max(100),
})

function parsePayload<S extends z.ZodType>(schema: S, payload: Record<string, unknown>): z.output<S> {
  const result = schema.safeParse(payload)
  if (!result.success) {
    const msg = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
    throw new ApiError(400, msg, "validation")
  }
  return result.data
}

const SYSTEM_PROMPT =
  "You are a helpful assistant embedded in Studio, a free visual design platform. " +
  "Follow the requested output format EXACTLY. Never add commentary before or after the requested format."

/** One chat completion via z-ai-web-dev-sdk with a hard timeout; throws honest errors. */
async function aiChat(userPrompt: string): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const work = (async () => {
    try {
      const { default: ZAI } = await import("z-ai-web-dev-sdk")
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      })
      return (completion?.choices?.[0]?.message?.content as string | undefined) ?? ""
    } catch (e) {
      if (e instanceof ApiError) throw e
      throw new ApiError(503, AI_UNAVAILABLE, "ai_unavailable")
    }
  })()
  try {
    const text = await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ApiError(503, "AI request timed out — please try again", "ai_timeout")), 60_000)
      }),
    ])
    if (!text.trim()) throw new ApiError(502, "AI returned an empty response — please try again", "ai_empty")
    return text
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Defensive JSON extraction: strips ```json fences, then parses the outermost {...} / [...]. */
function parseJsonLoose(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // fall through to brace slicing
  }
  const first = cleaned.search(/[{[]/)
  const last = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"))
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1))
    } catch {
      return null
    }
  }
  return null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req)
  rateLimit(req, "ai", 10, 60_000)
  const { action, payload } = await parseBody(req, bodySchema)
  const p = (payload ?? {}) as Record<string, unknown>

  switch (action) {
    case "copy": {
      const input = parsePayload(copySchema, p)
      const raw = await aiChat(
        `Write 5 social media copy variants for ${input.platform} about: "${input.topic}". Tone: ${input.tone}. ` +
        `Respond ONLY with a JSON array of exactly 5 objects, each shaped {"headline": string, "caption": string}.`,
      )
      const parsed = parseJsonLoose(raw)
      const variants = (Array.isArray(parsed) ? parsed : [])
        .filter(isRecord)
        .slice(0, 5)
        .map((v) => ({ headline: String(v.headline ?? ""), caption: String(v.caption ?? "") }))
        .filter((v) => v.headline.length > 0)
      if (variants.length === 0) throw new ApiError(502, "AI returned an unexpected format — please try again", "ai_format")
      return ok({ action, variants })
    }

    case "outline": {
      const input = parsePayload(outlineSchema, p)
      const raw = await aiChat(
        `Create a presentation outline with exactly ${input.slides} slides about: "${input.topic}". ` +
        `Respond ONLY with JSON shaped {"title": string, "slides": [{"title": string, "bullets": string[]}]}.`,
      )
      const parsed = parseJsonLoose(raw)
      if (!isRecord(parsed) || !Array.isArray(parsed.slides) || parsed.slides.length === 0) {
        throw new ApiError(502, "AI returned an unexpected format — please try again", "ai_format")
      }
      const slides = parsed.slides
        .filter(isRecord)
        .slice(0, input.slides)
        .map((s) => ({
          title: typeof s.title === "string" ? s.title : "",
          bullets: Array.isArray(s.bullets) ? s.bullets.filter((b): b is string => typeof b === "string").slice(0, 8) : [],
        }))
      return ok({
        action,
        outline: { title: typeof parsed.title === "string" ? parsed.title : input.topic, slides },
      })
    }

    case "palette": {
      const input = parsePayload(paletteSchema, p)
      const raw = await aiChat(
        `Design a 5-color brand color palette. Brand: "${input.brand}". Mood: "${input.mood}". ` +
        `Respond ONLY with JSON shaped {"colors": [{"hex": "#RRGGBB", "name": string}]} with exactly 5 colors.`,
      )
      const parsed = parseJsonLoose(raw)
      const colors = (isRecord(parsed) && Array.isArray(parsed.colors) ? parsed.colors : [])
        .filter(isRecord)
        .map((c) => ({ hex: typeof c.hex === "string" ? c.hex : "", name: typeof c.name === "string" ? c.name : "" }))
        .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c.hex))
        .slice(0, 5)
      if (colors.length === 0) throw new ApiError(502, "AI returned an unexpected format — please try again", "ai_format")
      return ok({ action, colors })
    }

    case "translate": {
      const input = parsePayload(translateSchema, p)
      const text = (await aiChat(`Translate the following text into ${input.targetLang}. Respond with the translation only.\n\n${input.text}`)).trim()
      return ok({ action, text })
    }

    case "summarize": {
      const input = parsePayload(summarizeSchema, p)
      const text = (await aiChat(`Summarize the following text concisely, preserving key points. Respond with the summary only.\n\n${input.text}`)).trim()
      return ok({ action, text })
    }

    case "rewrite": {
      const input = parsePayload(rewriteSchema, p)
      const text = (await aiChat(`Rewrite the following text in a ${input.style} style, keeping the meaning. Respond with the rewritten text only.\n\n${input.text}`)).trim()
      return ok({ action, text })
    }
  }
})
