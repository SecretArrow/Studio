/**
 * Assemble per-locale dictionaries from chunk state into
 * public/i18n/templates/{locale}.json (+ report parity across locales).
 * Run: bun scripts/i18n-assemble.mjs
 */
import fs from "node:fs"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const STRINGS = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/i18n-strings.json"), "utf8"))
const { LOCALES } = await import("./i18n-locales.mjs")
const stateDir = path.join(ROOT, "scripts/i18n-state")
const outDir = path.join(ROOT, "public/i18n/templates")
fs.mkdirSync(outDir, { recursive: true })

const keyset = STRINGS.map((x) => x.s)
const report = []

for (const locale of LOCALES.map((l) => l.code)) {
  const dir = path.join(stateDir, locale)
  const merged = {}
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
      Object.assign(merged, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
    }
  }
  // Complete with identity fallback for any missing keys so every locale file
  // has the SAME key set (parity) — translation can be improved later by
  // re-running chunks.
  let missing = 0
  for (const s of keyset) {
    if (typeof merged[s] !== "string" || !merged[s].trim()) { merged[s] = s; missing++ }
  }
  fs.writeFileSync(path.join(outDir, `${locale}.json`), JSON.stringify(merged))
  report.push({ locale, translated: keyset.length - missing, total: keyset.length, coverage: Math.round(((keyset.length - missing) / keyset.length) * 100) })
}

fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify({ version: 1, locales: LOCALES }, null, 2))
for (const r of report) console.log(`${r.locale}: ${r.translated}/${r.total} (${r.coverage}%)`)
console.log("assembled to public/i18n/templates/")
