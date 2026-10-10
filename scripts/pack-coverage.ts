/**
 * Scratch tool for Task 8-b — computes how many TPLS templates each candidate
 * pack tag-set matches (case-insensitive "any-of substring" semantics), to tune
 * pack definitions in src/lib/design/template-packs.ts.
 * Run: bun scripts/pack-coverage.ts
 */
import { TPLS } from "../src/lib/design/templates/index"

interface Candidate {
  id: string
  tags: string[]
}

const CANDIDATES: Candidate[] = [
  { id: "lebaran", tags: ["lebaran", "ramadan", "idulfitri", "iduladha", "eid", "kareem", "takbir", "kurban", "mudik", "hampers", "sahur", "imsakiyah", "ketupat", "halal bihalal", "sungkeman", "takjil", "safari"] },
  { id: "pengajian", tags: ["pengajian", "kajian", "masjid", "majelis", "tabligh akbar", "muslimah", "tpq", "yasinan", "hadits", "donasi", "santunan", "imam", "santri", "pesantren"] },
  { id: "tahun-baru", tags: ["tahun baru", "new year", "imlek", "hijriah", "muharram", "gong xi fa cai", "resolusi", "kalender", "calendar", "2026", "fireworks", "lampion", "angpao", "shio kuda", "karnaval", "tutup tahun", "januari"] },
  { id: "nasional", tags: ["17 agustus", "dirgahayu", "kemerdekaan", "kartini", "sumpah pemuda", "hari pahlawan", "batik", "pancasila", "upacara", "lomba", "maulid", "hari santri"] },
  { id: "festif", tags: ["valentine", "natal", "christmas", "halloween", "santa", "salju", "winter", "hari guru", "back to school", "earth day", "mothers day", "fathers day", "galentine", "gereja"] },
  { id: "sale", tags: ["sale", "promo", "diskon", "flash sale", "clearance", "thr", "payday", "gajian", "coupon", "double date"] },
  { id: "media-sosial", tags: ["instagram", "story", "youtube", "thumbnail", "podcast", "carousel", "vlog", "twitter", "channel", "tiktok"] },
  { id: "media-sosial-narrow", tags: ["story", "youtube", "thumbnail", "podcast", "carousel", "vlog", "twitter", "channel"] },
  { id: "presentasi", tags: ["presentation", "deck", "slides", "pitch", "whiteboard", "diagram", "roadmap", "mind map", "flowchart"] },
  { id: "bisnis-karier", tags: ["resume", "cv", "business", "business card", "linkedin", "career", "hiring", "finance", "corporate", "startup", "umkm", "professional", "office", "invoice"] },
  { id: "acara-undangan", tags: ["invitation", "event", "wedding", "party", "birthday", "undangan", "ticket", "concert", "workshop", "certificate", "award"] },
  { id: "pendidikan", tags: ["education", "kids", "anak", "sekolah", "study", "flashcards", "worksheet", "teacher", "math", "quiz", "school", "course", "homework", "language", "guru", "belajar"] },
]

function matches(tags: string[], needles: string[]): boolean {
  return tags.some((row) => {
    const hay = row.toLowerCase()
    return needles.some((n) => hay.includes(n))
  })
}

let fail = 0
for (const c of CANDIDATES) {
  const needles = c.tags.map((t) => t.toLowerCase())
  const hit = TPLS.filter((t) => matches(t.tags.map((x) => x.toLowerCase()), needles))
  const status = hit.length >= 8 && hit.length <= 120 ? "OK " : hit.length < 8 ? "LOW" : "BIG"
  if (status !== "OK ") fail++
  console.log(`${status} ${c.id.padEnd(20)} ${String(hit.length).padStart(3)}  [${c.tags.join(", ")}]`)
  if (status === "LOW") console.log("     names:", hit.slice(0, 12).map((t) => t.slug).join(", "))
}

// quick probes
console.log("\n-- probes --")
const probe = (label: string, needles: string[]) => {
  const n = needles.map((x) => x.toLowerCase())
  console.log(label, TPLS.filter((t) => matches(t.tags.map((x) => x.toLowerCase()), n)).length)
}
probe("instagram alone:", ["instagram"])
probe("story alone:", ["story"])
probe("instagram+story overlap:", ["instagram", "story"])
probe("2026 alone:", ["2026"])
probe("2026 outside newyear modules:", ["2026"])
console.log("2026 non-(newyear/nasional) slugs:", TPLS.filter((t) => matches(t.tags, ["2026"]) && !["seasonal-newyear", "seasonal-nasional"].some((s) => t.slug.startsWith(s)) && t.category !== "seasonal").map((t) => t.slug).join(", ") || "(none)")

console.log(fail === 0 ? "\nALL CANDIDATES WITHIN RANGE" : `\n${fail} candidate(s) out of range`)
