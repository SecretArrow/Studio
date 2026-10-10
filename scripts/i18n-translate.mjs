/**
 * Chunked LLM translation of template strings into 25 locales, with resume
 * state and a time budget per run (the sandbox reaps background processes
 * between tool calls, so the script is called repeatedly until complete).
 *
 * Run: bun scripts/i18n-translate.mjs [--locales=en,id,...] [--budget=420] [--chunk=350]
 * State: scripts/i18n-state/{locale}/{chunkIndex}.json
 * Final: public/i18n/templates/{locale}.json (written by --assemble)
 */
import fs from "node:fs"
import path from "node:path"
import ZAI from "z-ai-web-dev-sdk"

const ROOT = path.resolve(import.meta.dirname, "..")
const STRINGS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/i18n-strings.json"), "utf8"))
const { LOCALES } = await import("./i18n-locales.mjs")

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=")
  return [k, v === undefined ? true : v]
}))
const BUDGET_MS = (parseInt(args.budget ?? "420", 10) || 420) * 1000
const CHUNK = parseInt(args.chunk ?? "350", 10) || 350
const ONLY = args.locales ? String(args.locales).split(",") : null
const CONCURRENCY = 3
const MAX_ATTEMPTS = 5

const chunks = []
for (let i = 0; i < STRINGS.length; i += CHUNK) chunks.push(STRINGS.slice(i, i + CHUNK))

const stateDir = path.join(ROOT, "scripts/i18n-state")
fs.mkdirSync(stateDir, { recursive: true })

function chunkPath(locale, idx) {
  return path.join(stateDir, locale, `${String(idx).padStart(3, "0")}.json`)
}

function localeProgress(locale) {
  const dir = path.join(stateDir, locale)
  if (!fs.existsSync(dir)) return 0
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).length
}

let zai = null
async function getZai() {
  if (!zai) zai = await ZAI.create()
  return zai
}

function langOf(locale) {
  const l = LOCALES.find((x) => x.code === locale)
  return `${l.en} (${l.native})`
}

function systemPrompt(locale) {
  return [
    `You are a professional localization engine for a graphic-design template app. Target language: ${langOf(locale)}.`,
    `Translate each short design-template text string (posters, flyers, resumes, social posts, event invitations).`,
    `Rules:`,
    `1) Natural, concise marketing/editorial phrasing that fits design layouts. Keep translations SHORT.`,
    `2) If a string is a person name, initials, brand, social handle (@...), email, URL, phone number, date, address placeholder, or ALREADY in the target language — return it UNCHANGED.`,
    `3) Preserve emojis, symbols (✓ ☐ • ·), all-caps styling when the source is all-caps, and every line break (\\n) exactly.`,
    `4) Never add quotes, explanations, or notes to the translations.`,
    `5) Reply with STRICT JSON only: an object mapping each numeric index (as string) to the translated string, e.g. {"0":"Hola","1":"Venta 50%"}. No markdown fences, no commentary.`,
  ].join("\n")
}

async function translateChunk(locale, idx) {
  const file = chunkPath(locale, idx)
  if (fs.existsSync(file)) return "done"
  const items = chunks[idx]
  const payload = {}
  items.forEach((it, i) => { payload[String(i)] = it.s })
  const z = await getZai()
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await z.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt(locale) },
          { role: "user", content: `Translate these ${items.length} strings. STRICT JSON object keyed by index.\n${JSON.stringify(payload)}` },
        ],
        thinking: { type: "disabled" },
      })
      const raw = completion.choices[0]?.message?.content ?? ""
      const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        // Salvage valid "index":"value" pairs from a truncated/malformed payload
        parsed = {}
        const pair = /"(\d+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
        let m
        while ((m = pair.exec(cleaned)) !== null) parsed[m[1]] = JSON.parse(`"${m[2]}"`)
      }
      const out = {}
      let missing = 0
      items.forEach((it, i) => {
        const v = parsed[String(i)]
        if (typeof v === "string" && v.trim()) out[it.s] = v
        else { out[it.s] = it.s; missing++ }
      })
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify(out))
      await new Promise((r) => setTimeout(r, 400))
      return missing > 0 ? `done(${missing} fallback)` : "done"
    } catch (e) {
      const is429 = /429|too many/i.test(e.message ?? "")
      if (attempt === MAX_ATTEMPTS) return `error: ${e.message.slice(0, 120)}`
      await new Promise((r) => setTimeout(r, is429 ? 10000 * attempt : 1500))
    }
  }
}

async function main() {
  const locales = ONLY ?? LOCALES.map((l) => l.code)
  const total = locales.length * chunks.length
  const started = Date.now()
  console.log(`strings=${STRINGS.length} chunks/locale=${chunks.length} locales=${locales.length} totalChunks=${total} budgetMs=${BUDGET_MS}`)
  const queue = []
  for (const locale of locales) for (let i = 0; i < chunks.length; i++) queue.push([locale, i])
  // prioritize: keep queue order but skip already-done cheaply
  let done = 0, errors = 0
  let cursor = 0
  async function worker() {
    while (Date.now() - started < BUDGET_MS) {
      const my = cursor++
      if (my >= queue.length) return
      const [locale, idx] = queue[my]
      if (fs.existsSync(chunkPath(locale, idx))) { done++; continue }
      const r = await translateChunk(locale, idx)
      if (r.startsWith("error")) errors++
      done++
      if (done % 10 === 0) console.log(`progress ${done}/${total} (${Math.round((Date.now() - started) / 1000)}s)`)
      if (!r.startsWith("done")) console.log(`${locale}#${idx}: ${r}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  const perLocale = locales.map((l) => `${l}:${localeProgress(l)}/${chunks.length}`).join(" ")
  console.log(`FINISHED budget run — chunks done: ${done}/${total}, errors: ${errors}`)
  console.log(`progress: ${perLocale}`)
}

main()
