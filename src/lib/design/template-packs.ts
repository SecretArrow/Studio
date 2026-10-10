/**
 * Curated "Paket Template" (template packs) — metadata + matching helpers.
 * ---------------------------------------------------------------------------
 * A pack is a thin curation layer over the template library: it does NOT own
 * templates, it selects them by tag (case-insensitive "any-of substring"
 * match against each template's tags). Pack `tags` are lowercase needles
 * matched against the real tag vocabulary in src/lib/design/templates/*.ts.
 *
 * Coverage (computed against TPLS, see scripts/pack-coverage.ts):
 * every pack matches >= 8 and <= ~120 templates so packs stay curated.
 */

export interface TemplatePack {
  id: string
  /** Indonesian display name */
  nameId: string
  /** English display name */
  nameEn: string
  /** Indonesian description */
  descId: string
  /** English description */
  descEn: string
  /** lowercase tag needles — any-of substring match against template tags */
  tags: string[]
  /** accent color (hex) for badges/labels */
  accent: string
  /** card/banner gradient [from, to] (hex) */
  gradient: [string, string]
  emoji: string
  /** featured packs surface on the dashboard home "Paket musiman" strip */
  featured?: boolean
}

/**
 * Ordered seasonal-first: the 6 seasonal/holiday packs (featured) then the
 * thematic packs. Tags use the exact lowercase vocabulary from the template
 * modules (e.g. "17 agustus", "tahun baru", "gong xi fa cai").
 */
export const TEMPLATE_PACKS: TemplatePack[] = [
  {
    id: "lebaran",
    nameId: "Lebaran & Ramadan",
    nameEn: "Lebaran & Ramadan",
    descId: "Ucapan Idulfitri & Iduladha, poster takjil, spanduk open house, hingga label hampers untuk musim Ramadan.",
    descEn: "Eid greetings, event posters, mosque banners and hampers labels for the Ramadan season.",
    tags: ["lebaran", "ramadan", "idulfitri", "iduladha", "eid", "kareem", "takbir", "kurban", "mudik", "hampers", "sahur", "imsakiyah", "ketupat", "halal bihalal", "sungkeman", "takjil", "safari"],
    accent: "#fbbf24",
    gradient: ["#047857", "#d4a017"],
    emoji: "🌙",
    featured: true,
  },
  {
    id: "pengajian",
    nameId: "Pengajian & Kajian",
    nameEn: "Pengajian & Kajian",
    descId: "Poster kajian & tabligh akbar, jadwal majelis, kajian muslimah/TPQ, donasi masjid, dan kutipan hadits.",
    descEn: "Study-circle and sermon posters, majelis schedules, muslimah & TPQ events, and hadith quotes.",
    tags: ["pengajian", "kajian", "masjid", "majelis", "tabligh akbar", "muslimah", "tpq", "yasinan", "hadits", "donasi", "santunan", "imam", "santri", "pesantren"],
    accent: "#14b8a6",
    gradient: ["#0f766e", "#059669"],
    emoji: "🕌",
    featured: true,
  },
  {
    id: "tahun-baru",
    nameId: "Tahun Baru & Imlek",
    nameEn: "New Year & Imlek",
    descId: "Ucapan 2026, kembang api, Imlek & tahun kuda, Hijriah, resolusi, tracker kebiasaan, dan kalender.",
    descEn: "2026 greetings, fireworks, Lunar New Year, Hijriah, resolutions, habit trackers and calendars.",
    tags: ["tahun baru", "new year", "imlek", "hijriah", "muharram", "gong xi fa cai", "resolusi", "kalender", "calendar", "2026", "fireworks", "lampion", "angpao", "shio kuda", "karnaval", "tutup tahun", "januari"],
    accent: "#f59e0b",
    gradient: ["#dc2626", "#f59e0b"],
    emoji: "🏮",
    featured: true,
  },
  {
    id: "nasional",
    nameId: "Hari Besar Nasional RI",
    nameEn: "Indonesian National Days",
    descId: "Dirgahayu RI, 17 Agustus, Kartini, Sumpah Pemuda, Hari Pahlawan, Hari Batik, hingga Hari Santri.",
    descEn: "Independence Day, Kartini, Youth Pledge, Heroes Day, Batik Day and other national moments.",
    tags: ["17 agustus", "dirgahayu", "kemerdekaan", "kartini", "sumpah pemuda", "hari pahlawan", "batik", "pancasila", "upacara", "lomba", "maulid", "hari santri"],
    accent: "#ef4444",
    gradient: ["#b91c1c", "#f87171"],
    emoji: "🇮🇩",
    featured: true,
  },
  {
    id: "festif",
    nameId: "Festif Dunia",
    nameEn: "World Festivities",
    descId: "Natal, Valentine, Halloween, Hari Guru, Earth Day, dan perayaan dunia lainnya.",
    descEn: "Christmas, Valentine, Halloween, Teacher's Day, Earth Day and other world celebrations.",
    tags: ["valentine", "natal", "christmas", "halloween", "santa", "salju", "winter", "hari guru", "back to school", "earth day", "mothers day", "fathers day", "galentine", "gereja"],
    accent: "#ec4899",
    gradient: ["#db2777", "#fb7185"],
    emoji: "🎄",
    featured: true,
  },
  {
    id: "sale",
    nameId: "Promo & Sale Musiman",
    nameEn: "Seasonal Promo & Sale",
    descId: "Tanggal kembar 10.10/11.11/12.12, flash sale, THR, payday, clearance, dan promo musiman.",
    descEn: "Twin-date sales, flash deals, THR, payday, clearance and seasonal promotions.",
    tags: ["sale", "promo", "diskon", "flash sale", "clearance", "thr", "payday", "gajian", "coupon", "double date"],
    accent: "#f97316",
    gradient: ["#c2410c", "#fb923c"],
    emoji: "🏷️",
    featured: true,
  },
  {
    id: "media-sosial",
    nameId: "Media Sosial",
    nameEn: "Social Media",
    descId: "Post Instagram & Pinterest: quote, tips, engagement, produk, dan konten harian siap posting.",
    descEn: "Instagram & Pinterest posts: quotes, tips, engagement, product and everyday content.",
    tags: ["instagram", "pinterest"],
    accent: "#a855f7",
    gradient: ["#7c3aed", "#ec4899"],
    emoji: "📱",
  },
  {
    id: "presentasi",
    nameId: "Presentasi",
    nameEn: "Presentations",
    descId: "Deck & pitch slides, infographic, whiteboard, roadmap, dan diagram rapat.",
    descEn: "Decks & pitch slides, infographics, whiteboards, roadmaps and meeting diagrams.",
    tags: ["presentation", "deck", "slides", "pitch", "whiteboard", "diagram", "roadmap", "mind map", "flowchart"],
    accent: "#8b5cf6",
    gradient: ["#1f2937", "#7c3aed"],
    emoji: "📊",
  },
  {
    id: "bisnis-karier",
    nameId: "Bisnis & Karier",
    nameEn: "Business & Career",
    descId: "CV & resume, kartu nama, banner LinkedIn, invoice, logo, dan materi korporat.",
    descEn: "Resumes & CVs, business cards, LinkedIn banners, invoices, logos and corporate assets.",
    tags: ["resume", "cv", "business", "business card", "linkedin", "career", "hiring", "finance", "corporate", "startup", "umkm", "professional", "office", "invoice"],
    accent: "#b45309",
    gradient: ["#78350f", "#d97706"],
    emoji: "💼",
  },
  {
    id: "acara-undangan",
    nameId: "Acara & Undangan",
    nameEn: "Events & Invitations",
    descId: "Undangan pernikahan & ulang tahun, tiket, sertifikat, dan pengumuman acara.",
    descEn: "Wedding & birthday invitations, tickets, certificates and event announcements.",
    tags: ["invitation", "event", "wedding", "party", "birthday", "undangan", "ticket", "concert", "workshop", "certificate", "award"],
    accent: "#f43f5e",
    gradient: ["#be123c", "#f472b6"],
    emoji: "💌",
  },
  {
    id: "pendidikan",
    nameId: "Pendidikan",
    nameEn: "Education",
    descId: "Worksheet, flashcards, kuis, media belajar anak, dan materi guru untuk kelas.",
    descEn: "Worksheets, flashcards, quizzes, kids learning media and classroom materials.",
    tags: ["education", "kids", "anak", "sekolah", "study", "flashcards", "worksheet", "teacher", "math", "quiz", "school", "course", "homework", "language", "guru", "belajar"],
    accent: "#16a34a",
    gradient: ["#166534", "#84cc16"],
    emoji: "🎓",
  },
]

/** Seasonal pack ids, in TEMPLATE_PACKS order (all featured). */
export const SEASONAL_PACK_IDS = ["lebaran", "pengajian", "tahun-baru", "nasional", "festif", "sale"] as const

/** Featured packs (seasonal-first order), optionally capped. */
export function featuredPacks(max?: number): TemplatePack[] {
  const list = TEMPLATE_PACKS.filter((p) => p.featured)
  return max === undefined ? list : list.slice(0, max)
}

/** Look up a pack by id (returns undefined for unknown ids). */
export function packById(id: string): TemplatePack | undefined {
  return TEMPLATE_PACKS.find((p) => p.id === id)
}

/**
 * Normalize a tags value into a string[]. Accepts a DB JSON-string column
 * (e.g. '["lebaran","ramadan"]') or an already-parsed array. Malformed or
 * empty input yields [].
 */
export function parseTags(tags: string | string[] | null | undefined): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  try {
    const parsed: unknown = JSON.parse(tags)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/**
 * Build a predicate for a pack: true when ANY of the value's tags contains
 * ANY of the pack's tag needles (case-insensitive substring, any-of).
 * Accepts a JSON-string (DB `tags` column) or a string[] (TemplateSpec.tags).
 */
export function packTemplateMatcher(pack: TemplatePack): (tags: string | string[] | null | undefined) => boolean {
  const needles = pack.tags.map((t) => t.toLowerCase())
  return (tags) => {
    const list = parseTags(tags)
    return list.some((tag) => {
      const hay = tag.toLowerCase()
      return needles.some((needle) => hay.includes(needle))
    })
  }
}
