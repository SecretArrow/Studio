/**
 * Repair pass: re-translate identity-valued keys (dict[s] === s) per locale.
 * Patches scripts/i18n-state chunk files in place, then re-run i18n-assemble.
 * Run: bun scripts/i18n-repair.mjs [--locales=...] [--budget=460]
 */
import fs from "node:fs"
import path from "node:path"
import ZAI from "z-ai-web-dev-sdk"

const ROOT = path.resolve(import.meta.dirname, "..")
const { LOCALES } = await import("./i18n-locales.mjs")

const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith("--")).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=")
  return [k, v === undefined ? true : v]
}))
const BUDGET_MS = (parseInt(args.budget ?? "460", 10) || 460) * 1000
const CHUNK = 350
const ONLY = args.locales ? String(args.locales).split(",") : null
const CONCURRENCY = 3
const MAX_ATTEMPTS = 5

const stateDir = path.join(ROOT, "scripts/i18n-state")

function loadState(locale) {
  const dir = path.join(stateDir, locale)
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => ({
    file: path.join(dir, f),
    map: JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")),
  }))
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
    `These short design-template strings were left UNTRANSLATED by mistake (output identical to source). Translate each into the target language.`,
    `Return the string UNCHANGED only if it is: a person name, initials, a brand, a social handle (@...), an email, a URL, a phone number, a date/calendar term, a single letter, or already genuinely written in the target language.`,
    `Preserve emojis, symbols (✓ ☐ • ·), all-caps styling when the source is all-caps, and every line break (\\n) exactly. Keep translations SHORT.`,
    `Reply with STRICT JSON only: {"<index>":"<translation>"}. No markdown fences, no commentary.`,
  ].join("\n")
}

async function repairBatch(locale, batch) {
  const payload = {}
  batch.forEach((s, i) => { payload[String(i)] = s })
  const z = await getZai()
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const completion = await z.chat.completions.create({
        messages: [
          { role: "assistant", content: systemPrompt(locale) },
          { role: "user", content: `Translate these ${batch.length} strings into ${langOf(locale)}. STRICT JSON object keyed by index.\n${JSON.stringify(payload)}` },
        ],
        thinking: { type: "disabled" },
      })
      const raw = completion.choices[0]?.message?.content ?? ""
      const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        parsed = {}
        const pair = /"(\d+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
        let m
        while ((m = pair.exec(cleaned)) !== null) parsed[m[1]] = JSON.parse(`"${m[2]}"`)
      }
      let changed = 0
      batch.forEach((s, i) => {
        const v = parsed[String(i)]
        if (typeof v === "string" && v.trim() && v !== s) changed++
      })
      return { parsed, changed }
    } catch (e) {
      const is429 = /429|too many/i.test(e.message ?? "")
      if (attempt === MAX_ATTEMPTS) return { parsed: null, changed: 0, error: e.message.slice(0, 100) }
      await new Promise((r) => setTimeout(r, is429 ? 10000 * attempt : 1500))
    }
  }
}

async function main() {
  const started = Date.now()
  const locales = ONLY ?? LOCALES.map((l) => l.code)
  // Build work queue: [locale, batch[]] for identity keys
  const queue = []
  for (const locale of locales) {
    const state = loadState(locale)
    if (!state.length) continue
    const identityKeys = []
    const seen = new Set()
    for (const { map } of state) for (const [k, v] of Object.entries(map)) {
      if (!seen.has(k)) { seen.add(k); if (v === k) identityKeys.push(k) }
    }
    for (let i = 0; i < identityKeys.length; i += CHUNK) queue.push([locale, identityKeys.slice(i, i + CHUNK)])
  }
  const total = queue.length
  console.log(`repair batches: ${total} (locales: ${locales.join(",")})`)
  let done = 0, applied = 0, errors = 0
  let cursor = 0
  async function worker() {
    while (Date.now() - started < BUDGET_MS) {
      const my = cursor++
      if (my >= total) return
      const [locale, batch] = queue[my]
      const { parsed } = await repairBatch(locale, batch)
      done++
      if (parsed) {
        // Patch chunk state files
        const state = loadState(locale)
        for (let i = 0; i < batch.length; i++) {
          const v = parsed[String(i)]
          if (typeof v === "string" && v.trim() && v !== batch[i]) {
            for (const { file, map } of state) {
              if (map[batch[i]] === batch[i]) {
                map[batch[i]] = v
                fs.writeFileSync(file, JSON.stringify(map))
                applied++
                break
              }
            }
          }
        }
      } else errors++
      if (done % 5 === 0) console.log(`progress ${done}/${total} batches, ${applied} strings fixed (${Math.round((Date.now() - started) / 1000)}s)`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  console.log(`REPAIR FINISHED — batches ${done}/${total}, strings fixed: ${applied}, batch errors: ${errors}`)
  console.log(`Now run: bun scripts/i18n-assemble.mjs`)
}

main()
