/**
 * Social media post templates — square, portrait & landscape posts.
 * Styles follow 2026 design trends: oversized type, gradient layering,
 * retro-futurism, bold color, neo-minimalism, sticker accents.
 */
import {
  V,
  asset,
  doc,
  ellipse,
  F,
  gradient,
  img,
  page,
  pill,
  rect,
  rule,
  shp,
  solid,
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const IG = 1080
const INK = "#111827"

/* ------------------------------ quote posts (family) ------------------------------ */

interface QuoteStyle {
  slug: string
  name: string
  bg: ReturnType<typeof gradient> | ReturnType<typeof solid>
  quoteColor: string
  authorColor: string
  brandColor: string
  font: string
  weight: number
  lh: number
  italic?: boolean
  upper?: boolean
  ls?: number
  decorate: (els: DesignElement[]) => void
}

const QUOTE_STYLES: QuoteStyle[] = [
  {
    slug: "quote-night-serif-post",
    name: "Night Serif — Quote Post",
    bg: solid("#0b1220"),
    quoteColor: "#f9fafb",
    authorColor: "#fbbf24",
    brandColor: "#64748b",
    font: F.serif,
    weight: 700,
    lh: 1.18,
    decorate: (els) => {
      els.push(rule(110, 210, 120, "#fbbf24", 8))
      els.push(ellipse({ x: 800, y: 740, w: 260, h: 260, fill: "#1e293b" }))
      els.push(shp("star", { x: 850, y: 790, w: 90, h: 90, fill: "#fbbf24", rotation: 18 }))
    },
  },
  {
    slug: "quote-cobalt-post",
    name: "Cobalt Bold — Quote Post",
    bg: solid("#1d4ed8"),
    quoteColor: "#ffffff",
    authorColor: "#bfdbfe",
    brandColor: "#93c5fd",
    font: F.pop,
    weight: 800,
    lh: 1.12,
    upper: true,
    decorate: (els) => {
      els.push(rect({ x: -80, y: 830, w: 1240, h: 330, fill: "#1e3a8a", rotation: -5 }))
      els.push(shp("badge", { x: 880, y: 140, w: 110, h: 110, fill: "#fde047", rotation: 12 }))
    },
  },
  {
    slug: "quote-duotone-post",
    name: "Duotone Dream — Quote Post",
    bg: gradient("#7c3aed", "#db2777", 150),
    quoteColor: "#ffffff",
    authorColor: "#fde68a",
    brandColor: "#f5f3ff",
    font: F.serif,
    weight: 700,
    lh: 1.2,
    italic: true,
    decorate: (els) => {
      els.push(ellipse({ x: -120, y: -120, w: 380, h: 380, fill: "#ffffff", opacity: 0.1 }))
      els.push(ellipse({ x: 820, y: 820, w: 340, h: 340, fill: "#ffffff", opacity: 0.1 }))
    },
  },
  {
    slug: "quote-marker-post",
    name: "Marker Note — Quote Post",
    bg: solid("#fef3c7"),
    quoteColor: INK,
    authorColor: "#b45309",
    brandColor: "#92400e",
    font: F.marker,
    weight: 400,
    lh: 1.25,
    decorate: (els) => {
      els.push(img(asset("frame-tape"), { x: 60, y: 60, w: 340, h: 340, opacity: 0.9, rotation: -6 }))
      els.push(img(asset("underline-scribble"), { x: 620, y: 880, w: 340, h: 60, rotation: 2 }))
    },
  },
  {
    slug: "quote-mono-post",
    name: "Mono Grid — Quote Post",
    bg: solid("#f4f4f5"),
    quoteColor: INK,
    authorColor: "#52525b",
    brandColor: "#a1a1aa",
    font: F.mono,
    weight: 700,
    lh: 1.4,
    decorate: (els) => {
      els.push(rule(110, 190, 860, "#d4d4d8", 3))
      els.push(rule(110, 900, 860, "#d4d4d8", 3))
      els.push(txt("01", { x: 110, y: 130, w: 200, h: 44, size: 30, font: F.mono, weight: 400, color: "#a1a1aa" }))
    },
  },
  {
    slug: "quote-neon-post",
    name: "Neon Night — Quote Post",
    bg: solid("#09090b"),
    quoteColor: "#fafafa",
    authorColor: "#22d3ee",
    brandColor: "#52525b",
    font: F.display,
    weight: 400,
    lh: 1.05,
    upper: true,
    ls: 3,
    decorate: (els) => {
      els.push(rect({ x: 80, y: 80, w: 920, h: 920, fill: "transparent", stroke: "#22d3ee", sw: 5, r: 40, dash: [22, 16] }))
      els.push(shp("star", { x: 850, y: 130, w: 90, h: 90, fill: "#a3e635", rotation: 20 }))
      els.push(ellipse({ x: 130, y: 820, w: 120, h: 120, fill: "#db2777", opacity: 0.8 }))
    },
  },
]

const QUOTE_TEXTS = [
  ["“Creativity is\nintelligence\nhaving fun.”", "— attributed to Einstein"],
  ["“Done is better\nthan perfect.”", "— Sheryl Sandberg"],
  ["“Simplicity is the\nultimate\nsophistication.”", "— Leonardo da Vinci"],
  ["“Make it simple.\nThen make it\nbeautiful.”", "— design proverb"],
  ["“The details are\nnot the details.\nThey make the design.”", "— Charles Eames"],
  ["“Start where you are.\nUse what you\nhave.”", "— Arthur Ashe"],
]

const quotePosts: TemplateSpec[] = QUOTE_STYLES.map((s, i) => ({
  slug: s.slug,
  name: s.name,
  category: "social",
  type: "canvas" as const,
  tags: ["quote", "instagram", "square", "typography"],
  width: IG,
  height: IG,
  featured: i === 2,
  build: () => {
    const [quote, author] = QUOTE_TEXTS[i]
    const els: DesignElement[] = [
      txt(quote, { x: 110, y: 280, w: 860, h: 560, size: 100, font: s.font, weight: s.weight, color: s.quoteColor, lh: s.lh, italic: s.italic, upper: s.upper, ls: s.ls ?? 0 }),
      txt(author, { x: 114, y: 860, w: 700, h: 60, size: 40, font: i === 3 ? F.hand : F.sans, weight: 500, color: s.authorColor }),
      txt("STUDIO · DAILY INSPIRATION", { x: 114, y: 962, w: 700, h: 34, size: 22, weight: 600, color: s.brandColor, ls: 4, upper: true }),
    ]
    s.decorate(els)
    return doc("canvas", IG, IG, s.bg, [page("Post", s.bg, els)])
  },
}))

/* ------------------------------ sale / promo posts ------------------------------ */

const promoPosts: TemplateSpec[] = [
  {
    slug: "fashion-flash-post",
    name: "Fashion Flash — Sale Post",
    category: "social",
    type: "canvas",
    tags: ["sale", "fashion", "instagram", "square"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#fdf2f8"), [
        page("Post", solid("#fdf2f8"), [
          rect({ x: 0, y: 0, w: IG, h: 340, fill: "#db2777", rotation: 0 }),
          rect({ x: -60, y: 250, w: 1200, h: 120, fill: "#f9a8d4", rotation: -4 }),
          txt("FLASH\nSALE", { x: 90, y: 40, w: 600, h: 260, size: 120, font: F.display, weight: 400, color: "#ffffff", lh: 0.95, ls: 4 }),
          txt("THIS WEEKEND ONLY", { x: 96, y: 300, w: 700, h: 50, size: 40, font: F.cond, weight: 600, color: "#831843", ls: 6, upper: true }),
          txt("40% OFF", { x: 90, y: 470, w: 900, h: 220, size: 190, font: F.display, weight: 400, color: "#831843" }),
          txt("dresses · shoes · bags · accessories", { x: 96, y: 710, w: 800, h: 50, size: 34, weight: 400, color: "#9d174d" }),
          ...pill("SHOP NOW", { x: 96, y: 820, w: 380, h: 96, fill: "#db2777", size: 36, color: "#ffffff" }),
          txt("code: PINK40 · online & in store", { x: 96, y: 952, w: 700, h: 44, size: 28, font: F.mono, weight: 400, color: "#9d174d" }),
          img(asset("sparkle"), { x: 800, y: 470, w: 140, h: 140 }),
        ]),
      ]),
  },
  {
    slug: "tech-drop-post",
    name: "Tech Drop — Launch Post",
    category: "social",
    type: "canvas",
    tags: ["tech", "launch", "product", "dark"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#0b1220"), [
        page("Post", solid("#0b1220"), [
          ellipse({ x: 560, y: -180, w: 680, h: 680, fill: "#1d4ed8", opacity: 0.35 }),
          ellipse({ x: -160, y: 760, w: 480, h: 480, fill: "#22d3ee", opacity: 0.18 }),
          txt("THE DROP\nIS LIVE", { x: 100, y: 250, w: 880, h: 400, size: 150, font: F.display, weight: 400, color: "#fafafa", lh: 0.98, ls: 3 }),
          txt("NOVA X2 · ANC EARBUDS", { x: 106, y: 680, w: 800, h: 50, size: 40, font: F.mono, weight: 700, color: "#22d3ee", ls: 4 }),
          txt("48h battery · spatial audio · IPX5", { x: 106, y: 750, w: 800, h: 46, size: 32, weight: 400, color: "#cbd5e1" }),
          ...pill("GET 20% LAUNCH DEAL", { x: 106, y: 850, w: 520, h: 96, fill: "#22d3ee", size: 32, color: "#0b1220" }),
          txt("link in bio · ships worldwide", { x: 106, y: 972, w: 700, h: 40, size: 26, font: F.mono, weight: 400, color: "#64748b" }),
          img(asset("lightning"), { x: 820, y: 560, w: 170, h: 170, rotation: 12 }),
        ]),
      ]),
  },
  {
    slug: "beauty-bogo-post",
    name: "Beauty BOGO — Promo Post",
    category: "social",
    type: "canvas",
    tags: ["sale", "beauty", "cosmetics", "square"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#fefce8"), [
        page("Post", solid("#fefce8"), [
          img(asset("checkers"), { x: 0, y: 0, w: IG, h: IG, opacity: 0.35 }),
          rect({ x: 140, y: 140, w: 800, h: 800, fill: "#fefce8", r: 32 }),
          txt("BUY 1 GET 1", { x: 0, y: 260, w: IG, h: 130, size: 110, font: F.pop, weight: 800, color: "#a16207", align: "center" }),
          txt("lip care week", { x: 0, y: 410, w: IG, h: 90, size: 64, font: F.script, weight: 400, color: "#db2777", align: "center" }),
          rule(440, 540, 200, "#f59e0b", 6),
          txt("All shea balms & tinted oils included.\nOnline only — while stock lasts.", { x: 190, y: 600, w: 700, h: 130, size: 32, weight: 400, color: "#713f12", align: "center", lh: 1.5 }),
          ...pill("CODE: BALMBUY1", { x: 340, y: 770, w: 400, h: 88, fill: "#a16207", size: 32, color: "#fefce8" }),
        ]),
      ]),
  },
  {
    slug: "weekend-grocery-post",
    name: "Weekend Market — Grocery Post",
    category: "social",
    type: "canvas",
    tags: ["sale", "food", "grocery", "market"],
    width: IG,
    height: IG,
    build: () => {
      const deals: [string, string][] = [
        ["Strawberries 500g", "$2.49"],
        ["Sourdough loaf", "$3.20"],
        ["Free-range eggs ×12", "$4.10"],
        ["Cold-pressed OJ 1L", "$3.80"],
      ]
      const rows: DesignElement[] = []
      deals.forEach(([item, price], i) => {
        const y = 560 + i * 84
        rows.push(txt(item, { x: 110, y, w: 560, h: 56, size: 34, font: F.body, weight: 500, color: "#14532d", vAlign: "middle" }))
        rows.push(txt(price, { x: 700, y, w: 260, h: 56, size: 34, font: F.mono, weight: 700, color: "#166534", align: "right", vAlign: "middle" }))
        rows.push(rule(110, y + 62, 850, "#bbf7d0", 3))
      })
      return doc("canvas", IG, IG, solid("#f0fdf4"), [
        page("Post", solid("#f0fdf4"), [
          img(asset("leaf"), { x: 760, y: 100, w: 220, h: 220, rotation: 12 }),
          txt("WEEKEND\nFARM MARKET", { x: 106, y: 170, w: 880, h: 320, size: 96, font: F.serif, weight: 700, color: "#14532d", lh: 1.1 }),
          txt("Sat–Sun · 8 AM to 2 PM · parking free", { x: 110, y: 500, w: 800, h: 46, size: 30, weight: 500, color: "#15803d" }),
          ...rows,
          txt("12 Orchard Lane · bring your own bag", { x: 110, y: 940, w: 860, h: 42, size: 26, font: F.hand, weight: 400, color: "#166534" }),
        ]),
      ])
    },
  },
]

/* ------------------------------ engagement & community ------------------------------ */

const engagementPosts: TemplateSpec[] = [
  {
    slug: "this-or-that-post",
    name: "This or That — Engagement Post",
    category: "social",
    type: "canvas",
    tags: ["engagement", "instagram", "interactive"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#faf5ff"), [
        page("Post", solid("#faf5ff"), [
          rect({ x: 80, y: 250, w: 440, h: 440, fill: "#7c3aed", r: 28 }),
          rect({ x: 560, y: 250, w: 440, h: 440, fill: "#fde047", r: 28 }),
          txt("THIS", { x: 80, y: 400, w: 440, h: 120, size: 100, font: F.display, weight: 400, color: "#ffffff", align: "center" }),
          txt("coffee", { x: 80, y: 530, w: 440, h: 60, size: 44, font: F.script, weight: 400, color: "#f5f3ff", align: "center" }),
          txt("THAT", { x: 560, y: 400, w: 440, h: 120, size: 100, font: F.display, weight: 400, color: INK, align: "center" }),
          txt("tea", { x: 560, y: 530, w: 440, h: 60, size: 44, font: F.script, weight: 400, color: "#713f12", align: "center" }),
          txt("THIS OR THAT?", { x: 0, y: 110, w: IG, h: 100, size: 90, font: F.cond, weight: 600, color: INK, align: "center", ls: 6, upper: true }),
          txt("comment your pick — we read every reply", { x: 0, y: 790, w: IG, h: 50, size: 34, weight: 500, color: "#6b7280", align: "center" }),
          txt("or / this-or-that · new round friday", { x: 0, y: 950, w: IG, h: 40, size: 24, font: F.mono, weight: 400, color: "#a78bfa", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "fill-blank-post",
    name: "Fill in the Blank — Engagement Post",
    category: "social",
    type: "canvas",
    tags: ["engagement", "community", "fun"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#fff7ed"), [
        page("Post", solid("#fff7ed"), [
          ellipse({ x: 700, y: -140, w: 500, h: 500, fill: "#fed7aa", opacity: 0.8 }),
          txt("FILL IN\nTHE BLANK", { x: 100, y: 170, w: 880, h: 300, size: 120, font: F.marker, weight: 400, color: "#9a3412", lh: 1.1, rotation: -2 }),
          rect({ x: 100, y: 540, w: 880, h: 160, fill: "#ffffff", r: 24, stroke: "#f97316", sw: 4, dash: [18, 12] }),
          txt("My favorite way to start the morning is ____.", { x: 140, y: 570, w: 800, h: 100, size: 40, font: F.hand, weight: 700, color: "#431407", vAlign: "middle" }),
          txt("best answer gets a shoutout in our stories ✦", { x: 100, y: 780, w: 880, h: 50, size: 34, weight: 500, color: "#9a3412" }),
          ...pill("COMMENT BELOW", { x: 100, y: 860, w: 400, h: 90, fill: "#f97316", size: 32, color: "#fff7ed" }),
        ]),
      ]),
  },
  {
    slug: "milestone-thanks-post",
    name: "10K Thank You — Milestone Post",
    category: "social",
    type: "canvas",
    tags: ["milestone", "thank you", "community"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, gradient("#0ea5e9", "#6366f1", 160), [
        page("Post", gradient("#0ea5e9", "#6366f1", 160), [
          img(asset("confetti"), { x: 60, y: 80, w: 960, h: 300, opacity: 0.9 }),
          txt("10,000", { x: 0, y: 350, w: IG, h: 260, size: 240, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 4 }),
          txt("of you — thank you!", { x: 0, y: 640, w: IG, h: 80, size: 60, font: F.script, weight: 700, color: "#fde047", align: "center" }),
          txt("Two years ago this page was a notebook\nof sketches. Today it is a community of\nmakers from 90 countries. Terima kasih,\nmerci, thank you — on to 20K.", { x: 190, y: 760, w: 700, h: 220, size: 30, weight: 400, color: "#eff6ff", align: "center", lh: 1.55 }),
          ...pill("@yourstudio", { x: 390, y: 960, w: 300, h: 70, fill: "#ffffff", size: 28, color: "#4338ca" }),
        ]),
      ]),
  },
  {
    slug: "testimonial-post",
    name: "Customer Love — Testimonial Post",
    category: "social",
    type: "canvas",
    tags: ["testimonial", "review", "social proof"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#ecfdf5"), [
        page("Post", solid("#ecfdf5"), [
          img(asset("chat-bubble"), { x: 80, y: 120, w: 220, h: 187 }),
          txt("“The free export\nsold me. Everything\nelse kept me here.”", { x: 100, y: 340, w: 880, h: 360, size: 76, font: F.serif, weight: 700, color: "#064e3b", lh: 1.25 }),
          ellipse({ x: 110, y: 760, w: 110, h: 110, fill: "#059669" }),
          txt("DR", { x: 110, y: 762, w: 110, h: 106, size: 44, font: F.pop, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }),
          txt("Dana R. — freelance illustrator", { x: 250, y: 775, w: 600, h: 44, size: 32, weight: 600, color: "#065f46", vAlign: "middle" }),
          txt("★★★★★  Google review · verified customer", { x: 252, y: 828, w: 600, h: 38, size: 24, font: F.mono, weight: 400, color: "#059669" }),
          ...pill("START FREE — NO CARD NEEDED", { x: 100, y: 920, w: 640, h: 84, fill: "#064e3b", size: 28, color: "#ecfdf5" }),
        ]),
      ]),
  },
  {
    slug: "team-intro-post",
    name: "Meet the Maker — Team Post",
    category: "social",
    type: "canvas",
    tags: ["team", "about", "introduction"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#fdf8f1"), [
        page("Post", solid("#fdf8f1"), [
          ellipse({ x: 340, y: 130, w: 400, h: 400, fill: "#fde68a" }),
          txt("JD", { x: 340, y: 230, w: 400, h: 200, size: 150, font: F.serif, weight: 700, color: "#92400e", align: "center" }),
          txt("MEET THE MAKER", { x: 0, y: 580, w: IG, h: 60, size: 40, font: F.cond, weight: 600, color: "#b45309", align: "center", ls: 8, upper: true }),
          txt("Junia Dewi", { x: 0, y: 650, w: IG, h: 110, size: 90, font: F.serif, weight: 700, color: INK, align: "center" }),
          txt("Head of illustration · 9 years · 3 cats", { x: 0, y: 780, w: IG, h: 50, size: 34, weight: 400, color: "#78350f", align: "center" }),
          txt("“I draw the sticker packs. Say hi —\nI read every comment with tea in hand.”", { x: 190, y: 860, w: 700, h: 120, size: 30, font: F.hand, weight: 400, color: "#92400e", align: "center", lh: 1.5 }),
        ]),
      ]),
  },
  {
    slug: "hiring-post",
    name: "We're Hiring — Recruitment Post",
    category: "social",
    type: "canvas",
    tags: ["hiring", "jobs", "recruitment"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid(INK), [
        page("Post", solid(INK), [
          rect({ x: 90, y: 90, w: 900, h: 900, fill: "#22c55e", r: 40 }),
          txt("WE'RE\nHIRING", { x: 150, y: 200, w: 780, h: 400, size: 180, font: F.display, weight: 400, color: INK, lh: 0.95, ls: 4 }),
          txt("Junior Motion Designer", { x: 156, y: 620, w: 780, h: 70, size: 52, font: F.pop, weight: 700, color: "#14532d" }),
          txt("Bandung or remote · full-time · portfolio over CV", { x: 156, y: 705, w: 780, h: 46, size: 30, weight: 500, color: "#166534" }),
          rect({ x: 156, y: 800, w: 770, h: 3, fill: "#14532d", r: 0 }),
          txt("send your reel → jobs@studio.example", { x: 156, y: 830, w: 780, h: 50, size: 30, font: F.mono, weight: 400, color: "#14532d" }),
          shp("star", { x: 820, y: 160, w: 100, h: 100, fill: "#fde047", rotation: 15 }),
        ]),
      ]),
  },
]

/* ------------------------------ content & promo ------------------------------ */

const contentPosts: TemplateSpec[] = [
  {
    slug: "coming-soon-post",
    name: "Coming Soon — Teaser Post",
    category: "social",
    type: "canvas",
    tags: ["teaser", "launch", "countdown"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#0c0a09"), [
        page("Post", solid("#0c0a09"), [
          img(asset("sunburst"), { x: 290, y: 190, w: 500, h: 500, opacity: 0.9 }),
          txt("SOMETHING\nIS COMING", { x: 0, y: 300, w: IG, h: 300, size: 110, font: F.display, weight: 400, color: "#fff7ed", align: "center", lh: 1.05, ls: 6 }),
          txt("09 . 09 . 2026", { x: 0, y: 730, w: IG, h: 80, size: 60, font: F.mono, weight: 700, color: "#f59e0b", align: "center", ls: 10 }),
          txt("turn on notifications — you'll want to see this first", { x: 0, y: 860, w: IG, h: 50, size: 30, weight: 400, color: "#d6d3d1", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "webinar-promo-post",
    name: "Free Webinar — Promo Post",
    category: "social",
    type: "canvas",
    tags: ["webinar", "event", "education", "promo"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#f5f3ff"), [
        page("Post", solid("#f5f3ff"), [
          rect({ x: 0, y: 0, w: IG, h: 380, fill: V, r: 0 }),
          ellipse({ x: 760, y: -120, w: 420, h: 420, fill: "#6d28d9" }),
          txt("FREE LIVE WEBINAR", { x: 90, y: 80, w: 800, h: 60, size: 36, font: F.mono, weight: 700, color: "#fde68a", ls: 6 }),
          txt("Brand kits that\nclick in 30 minutes", { x: 90, y: 150, w: 860, h: 210, size: 72, font: F.serif, weight: 700, color: "#ffffff", lh: 1.15 }),
          txt("THU · JUL 17 · 7 PM WIB", { x: 100, y: 430, w: 800, h: 56, size: 40, font: F.cond, weight: 600, color: V, ls: 3 }),
          ...["What goes in a real brand kit", "Colors that survive dark mode", "Live teardown: 3 viewer brands"].map((s, i) => {
            const y = 530 + i * 78
            return [
              shp("badge", { x: 100, y, w: 52, h: 52, fill: "#fde68a" }),
              txt(String(i + 1), { x: 100, y: y - 2, w: 52, h: 56, size: 26, font: F.display, weight: 400, color: INK, align: "center", vAlign: "middle" }),
              txt(s, { x: 180, y, w: 760, h: 52, size: 32, weight: 500, color: "#374151", vAlign: "middle" }),
            ] as DesignElement[]
          }).flat(),
          ...pill("SAVE YOUR SEAT", { x: 100, y: 810, w: 460, h: 94, fill: V, size: 34, color: "#ffffff" }),
          txt("studio.example/webinar · replay included", { x: 100, y: 940, w: 800, h: 42, size: 26, font: F.mono, weight: 400, color: "#7c3aed" }),
        ]),
      ]),
  },
  {
    slug: "blog-promo-post",
    name: "New on the Blog — Promo Post",
    category: "social",
    type: "canvas",
    tags: ["blog", "article", "promo", "portrait"],
    width: IG,
    height: 1350,
    build: () =>
      doc("canvas", IG, 1350, solid("#ffffff"), [
        page("Post", solid("#ffffff"), [
          rect({ x: 90, y: 90, w: 900, h: 560, fill: "#111827", r: 28 }),
          img(asset("stripes-diag"), { x: 90, y: 90, w: 900, h: 560, opacity: 0.5, r: 0 }),
          txt("THE\nCOLOR\nISSUE", { x: 140, y: 160, w: 500, h: 400, size: 120, font: F.display, weight: 400, color: "#ffffff", lh: 1 }),
          ellipse({ x: 700, y: 380, w: 220, h: 220, fill: "#fde047" }),
          txt("NEW\nGUIDE", { x: 700, y: 420, w: 220, h: 140, size: 36, font: F.mono, weight: 700, color: INK, align: "center", lh: 1.3 }),
          txt("How to pick colors that\nwork in every context", { x: 90, y: 700, w: 900, h: 160, size: 56, font: F.serif, weight: 700, color: INK, lh: 1.3 }),
          txt("A 6-minute read on building palettes that survive dark mode, print and tiny screens — with 12 free swatch sheets inside.", { x: 90, y: 880, w: 900, h: 140, size: 32, weight: 400, color: "#4b5563", lh: 1.6 }),
          ...pill("READ THE GUIDE", { x: 90, y: 1070, w: 440, h: 92, fill: V, size: 32, color: "#ffffff" }),
          txt("studio.app/blog/color-guide", { x: 90, y: 1210, w: 700, h: 44, size: 28, font: F.mono, weight: 400, color: "#6b7280" }),
        ]),
      ]),
  },
  {
    slug: "podcast-episode-post",
    name: "New Episode — Podcast Post",
    category: "social",
    type: "canvas",
    tags: ["podcast", "episode", "audio"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#7c2d12"), [
        page("Post", solid("#7c2d12"), [
          img(asset("music-note"), { x: 700, y: 90, w: 280, h: 280, opacity: 0.9 }),
          txt("EP. 042", { x: 100, y: 130, w: 400, h: 60, size: 40, font: F.mono, weight: 700, color: "#fde047", ls: 6 }),
          txt("Small brands,\nbig taste", { x: 100, y: 220, w: 860, h: 300, size: 110, font: F.serif, weight: 700, color: "#fff7ed", lh: 1.12 }),
          txt("How two-person coffee roasters win\nloyal fans without big budgets — with\nRara of Kopi Kita Roastery.", { x: 104, y: 560, w: 820, h: 180, size: 34, weight: 400, color: "#ffedd5", lh: 1.6 }),
          rule(104, 790, 160, "#fde047", 8),
          txt("listen free · 38 min · every platform", { x: 104, y: 830, w: 800, h: 46, size: 30, font: F.mono, weight: 400, color: "#fcd34d" }),
          ...pill("▶ PLAY EPISODE", { x: 104, y: 910, w: 440, h: 92, fill: "#fde047", size: 32, color: "#7c2d12" }),
        ]),
      ]),
  },
  {
    slug: "did-you-know-post",
    name: "Did You Know — Fact Post",
    category: "social",
    type: "canvas",
    tags: ["facts", "education", "series"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#ecfeff"), [
        page("Post", solid("#ecfeff"), [
          ellipse({ x: -100, y: 700, w: 460, h: 460, fill: "#a5f3fc", opacity: 0.7 }),
          img(asset("planet"), { x: 640, y: 110, w: 360, h: 252 }),
          txt("DID YOU KNOW?", { x: 100, y: 380, w: 880, h: 90, size: 76, font: F.cond, weight: 600, color: "#155e75", ls: 4, upper: true }),
          txt("The three primary colors\nof screens — red, green\nand blue — can mix into\n16.7 million shades.", { x: 100, y: 490, w: 880, h: 330, size: 46, font: F.body, weight: 400, color: "#0c4a6e", lh: 1.45 }),
          rule(104, 850, 130, "#06b6d4", 8),
          txt("fact series · #06", { x: 104, y: 890, w: 500, h: 40, size: 26, font: F.mono, weight: 400, color: "#0e7490" }),
          ...pill("FOLLOW FOR MORE", { x: 104, y: 950, w: 460, h: 80, fill: "#155e75", size: 28, color: "#ecfeff" }),
        ]),
      ]),
  },
  {
    slug: "restaurant-special-post",
    name: "Chef's Special — Restaurant Post",
    category: "social",
    type: "canvas",
    tags: ["food", "restaurant", "special", "menu"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#1c1917"), [
        page("Post", solid("#1c1917"), [
          img(asset("pizza"), { x: 620, y: 560, w: 380, h: 380, opacity: 0.95, rotation: 8 }),
          rect({ x: 70, y: 70, w: 940, h: 940, fill: "transparent", stroke: "#fbbf24", sw: 3, r: 20, dash: [4, 14] }),
          txt("CHEF'S SPECIAL", { x: 110, y: 140, w: 700, h: 50, size: 30, font: F.mono, weight: 700, color: "#fbbf24", ls: 8 }),
          txt("Truffle\nMushroom\nRavioli", { x: 106, y: 220, w: 760, h: 400, size: 120, font: F.serif, weight: 700, color: "#fafaf9", lh: 1.1 }),
          txt("hand-folded · 24h sauce · shaved parmesan", { x: 110, y: 650, w: 720, h: 46, size: 30, weight: 400, color: "#d6d3d1" }),
          txt("$18", { x: 110, y: 740, w: 300, h: 120, size: 100, font: F.display, weight: 400, color: "#fbbf24" }),
          txt("friday–sunday only", { x: 300, y: 800, w: 400, h: 46, size: 30, font: F.hand, weight: 400, color: "#fcd34d" }),
          txt("reserve: 0812-3456-7890 · Osteria Nove", { x: 110, y: 920, w: 800, h: 42, size: 26, font: F.mono, weight: 400, color: "#a8a29e" }),
        ]),
      ]),
  },
  {
    slug: "travel-promo-post",
    name: "Wander More — Travel Post",
    category: "social",
    type: "canvas",
    tags: ["travel", "tourism", "promo", "nature"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, solid("#082f49"), [
        page("Post", solid("#082f49"), [
          img(asset("mountain"), { x: 0, y: 470, w: IG, h: 500 }),
          ellipse({ x: 740, y: 110, w: 200, h: 200, fill: "#fde047" }),
          txt("ESCAPE THE\nEVERYDAY", { x: 0, y: 170, w: IG, h: 300, size: 110, font: F.display, weight: 400, color: "#f0f9ff", align: "center", lh: 1.05, ls: 3 }),
          txt("3-day highland escapes from $149 — guide, stays & sunrise hikes included.", { x: 140, y: 1010, w: 800, h: 100, size: 32, weight: 400, color: "#bae6fd", align: "center", lh: 1.5 }),
          ...pill("PLAN YOUR TRIP", { x: 340, y: 1130, w: 400, h: 88, fill: "#fde047", size: 30, color: "#082f49" }),
          txt("roamaway.example · DM for custom dates", { x: 0, y: 960, w: IG, h: 40, size: 24, font: F.mono, weight: 400, color: "#7dd3fc", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "real-estate-post",
    name: "Just Listed — Real Estate Post",
    category: "social",
    type: "canvas",
    tags: ["real estate", "listing", "house"],
    width: IG,
    height: IG,
    build: () => {
      const specs: [string, string][] = [["Beds", "3"], ["Baths", "2"], ["Area", "180 m²"], ["Year", "2021"]]
      const cells: DesignElement[] = []
      specs.forEach(([k, v], i) => {
        const x = 100 + i * 222
        cells.push(rect({ x, y: 700, w: 200, h: 160, fill: "#ffffff", r: 16, stroke: "#e5e7eb", sw: 2 }))
        cells.push(txt(v, { x, y: 720, w: 200, h: 70, size: 44, font: F.display, weight: 400, color: V, align: "center" }))
        cells.push(txt(k, { x, y: 790, w: 200, h: 40, size: 24, weight: 500, color: "#6b7280", align: "center" }))
      })
      return doc("canvas", IG, IG, solid("#f8fafc"), [
        page("Post", solid("#f8fafc"), [
          rect({ x: 90, y: 100, w: 900, h: 470, fill: "#c7d2fe", r: 24 }),
          img(asset("frame-simple"), { x: 150, y: 140, w: 780, h: 390, opacity: 0.35 }),
          txt("PHOTO HERE", { x: 90, y: 300, w: 900, h: 70, size: 44, font: F.mono, weight: 700, color: "#4f46e5", align: "center", ls: 8 }),
          txt("JUST LISTED", { x: 96, y: 600, w: 500, h: 50, size: 32, font: F.mono, weight: 700, color: "#db2777", ls: 6 }),
          txt("Sunny Family Home, Riverside District", { x: 94, y: 646, w: 890, h: 44, size: 34, font: F.serif, weight: 700, color: "#1e1b4b" }),
          ...cells,
          txt("$429,000", { x: 96, y: 890, w: 500, h: 90, size: 76, font: F.pop, weight: 800, color: INK }),
          ...pill("BOOK A VIEWING", { x: 620, y: 900, w: 370, h: 84, fill: V, size: 28, color: "#ffffff" }),
          txt("SM Property · WA 0812-0000-1111 · licensed agent", { x: 96, y: 1000, w: 880, h: 40, size: 24, font: F.mono, weight: 400, color: "#9ca3af" }),
        ]),
      ])
    },
  },
  {
    slug: "monday-energy-post",
    name: "Monday Energy — Motivation Post",
    category: "social",
    type: "canvas",
    tags: ["motivation", "monday", "gradient"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, gradient("#f97316", "#db2777", 155), [
        page("Post", gradient("#f97316", "#db2777", 155), [
          img(asset("sun"), { x: 690, y: 120, w: 240, h: 240, opacity: 0.95 }),
          txt("NEW WEEK,\nNEW ENERGY", { x: 90, y: 300, w: 900, h: 420, size: 130, font: F.marker, weight: 400, color: "#ffffff", lh: 1.1, rotation: -2 }),
          txt("small steps on monday beat\nbig plans on someday", { x: 96, y: 760, w: 840, h: 120, size: 38, font: F.hand, weight: 400, color: "#fef3c7", lh: 1.4 }),
          txt("#mondaymotivation · @yourstudio", { x: 96, y: 940, w: 800, h: 40, size: 26, font: F.mono, weight: 400, color: "#ffffff", opacity: 0.85 }),
        ]),
      ]),
  },
  {
    slug: "linkedin-tips-post",
    name: "3 Career Tips — LinkedIn Post",
    category: "social",
    type: "canvas",
    tags: ["linkedin", "career", "tips"],
    width: 1200,
    height: 1200,
    build: () =>
      doc("canvas", 1200, 1200, solid("#ffffff"), [
        page("Post", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1200, h: 220, fill: "#0a66c2", r: 0 }),
          txt("WHAT 8 YEARS OF FREELANCE TAUGHT ME", { x: 70, y: 70, w: 1060, h: 90, size: 40, font: F.cond, weight: 600, color: "#ffffff", ls: 2, upper: true }),
          ...[
            ["Reply fast, deliver slow", "Speed of response builds more trust than speed of delivery — just say when."],
            ["Price the outcome", "Clients buy the result, not your hours. Anchor every quote to their goal."],
            ["Show the messy middle", "Process posts got me 5× more inbound than portfolio posts."],
          ].flatMap(([title, body], i) => {
            const y = 300 + i * 270
            return [
              txt(`0${i + 1}`, { x: 70, y, w: 160, h: 110, size: 72, font: F.display, weight: 400, color: "#0a66c2" }),
              txt(title, { x: 240, y: y + 6, w: 880, h: 60, size: 44, font: F.pop, weight: 700, color: "#111827" }),
              txt(body, { x: 242, y: y + 80, w: 880, h: 110, size: 30, weight: 400, color: "#4b5563", lh: 1.5 }),
            ] as DesignElement[]
          }),
          rule(70, 1100, 1060, "#e5e7eb", 3),
          txt("full story → alexmorgan.design/journal", { x: 70, y: 1130, w: 900, h: 40, size: 26, font: F.mono, weight: 400, color: "#0a66c2" }),
        ]),
      ]),
  },
]

/* ------------------------------ portrait & landscape extras ------------------------------ */

const formatPosts: TemplateSpec[] = [
  {
    slug: "quote-portrait-post",
    name: "Editorial Quote — Portrait Post (4:5)",
    category: "social",
    type: "canvas",
    tags: ["quote", "portrait", "instagram", "editorial"],
    width: IG,
    height: 1350,
    build: () =>
      doc("canvas", IG, 1350, solid("#fafaf9"), [
        page("Post", solid("#fafaf9"), [
          txt("“", { x: 70, y: 60, w: 300, h: 260, size: 260, font: F.serif, weight: 700, color: "#e7e5e4" }),
          txt("Good design is\nhonest. It does\nnot promise what\ncannot be\ndelivered.", { x: 110, y: 300, w: 860, h: 560, size: 74, font: F.serif, weight: 700, color: "#1c1917", lh: 1.3 }),
          rule(114, 930, 130, "#f97316", 8),
          txt("Dieter Rams (paraphrased)", { x: 114, y: 970, w: 600, h: 50, size: 32, weight: 500, color: "#78716c" }),
          txt("studio.app · design notes, weekly", { x: 114, y: 1230, w: 700, h: 40, size: 24, font: F.mono, weight: 400, color: "#a8a29e" }),
        ]),
      ]),
  },
  {
    slug: "promo-portrait-post",
    name: "Weekend Offer — Portrait Post (4:5)",
    category: "social",
    type: "canvas",
    tags: ["sale", "portrait", "offer"],
    width: IG,
    height: 1350,
    build: () =>
      doc("canvas", IG, 1350, solid("#fff1f2"), [
        page("Post", solid("#fff1f2"), [
          rect({ x: 0, y: 0, w: IG, h: 560, fill: "#e11d48", rotation: 0 }),
          ellipse({ x: -120, y: 380, w: 320, h: 320, fill: "#fb7185" }),
          img(asset("gift"), { x: 760, y: 330, w: 220, h: 220, rotation: 8 }),
          txt("WEEKEND\nSPECIAL", { x: 90, y: 110, w: 800, h: 360, size: 120, font: F.display, weight: 400, color: "#ffffff", lh: 1, ls: 4 }),
          txt("FREE GIFT WRAP + CARD", { x: 90, y: 630, w: 800, h: 60, size: 42, font: F.cond, weight: 600, color: "#9f1239", ls: 4 }),
          txt("on every order this saturday & sunday —\ngifts wrapped by hand, notes written in ink.", { x: 90, y: 720, w: 880, h: 140, size: 34, weight: 400, color: "#881337", lh: 1.5 }),
          ...pill("SHOP THE STORE", { x: 90, y: 910, w: 460, h: 94, fill: "#9f1239", size: 32, color: "#fff1f2" }),
          txt("Paper & Twine · orders close 9 PM sunday", { x: 90, y: 1270, w: 800, h: 42, size: 26, font: F.mono, weight: 400, color: "#be123c" }),
        ]),
      ]),
  },
  {
    slug: "x-announce-post",
    name: "Big News — X (Twitter) Post",
    category: "social",
    type: "canvas",
    tags: ["twitter", "x", "announcement", "landscape"],
    width: 1600,
    height: 900,
    build: () =>
      doc("canvas", 1600, 900, solid("#0f172a"), [
        page("Post", solid("#0f172a"), [
          ellipse({ x: 1180, y: -160, w: 520, h: 520, fill: "#1e293b" }),
          shp("star", { x: 1440, y: 620, w: 80, h: 80, fill: "#fde047", rotation: 18 }),
          txt("BIG NEWS 🎉", { x: 90, y: 160, w: 900, h: 100, size: 60, font: F.mono, weight: 700, color: "#38bdf8", ls: 4 }),
          txt("v2.0 is out — faster canvas,\nsmarter exports, zero paywalls.", { x: 88, y: 300, w: 1300, h: 260, size: 84, font: F.pop, weight: 700, color: "#f8fafc", lh: 1.25 }),
          txt("changelog: studio.app/v2 · as always, 100% free", { x: 92, y: 620, w: 1100, h: 50, size: 34, font: F.mono, weight: 400, color: "#94a3b8" }),
        ]),
      ]),
  },
  {
    slug: "x-blogcard-post",
    name: "Article Card — X (Twitter) Post",
    category: "social",
    type: "canvas",
    tags: ["twitter", "x", "blog", "landscape"],
    width: 1600,
    height: 900,
    build: () =>
      doc("canvas", 1600, 900, solid("#fafaf9"), [
        page("Post", solid("#fafaf9"), [
          rect({ x: 0, y: 0, w: 620, h: 900, fill: "#f97316", r: 0 }),
          img(asset("pencil"), { x: 170, y: 330, w: 280, h: 280, opacity: 0.9 }),
          txt("NEW ARTICLE", { x: 700, y: 150, w: 700, h: 50, size: 30, font: F.mono, weight: 700, color: "#ea580c", ls: 6 }),
          txt("Why every\nportfolio needs\na case study", { x: 696, y: 230, w: 800, h: 320, size: 72, font: F.serif, weight: 700, color: "#1c1917", lh: 1.2 }),
          txt("6 min read · process, metrics and the story clients actually buy.", { x: 700, y: 590, w: 760, h: 100, size: 30, weight: 400, color: "#57534e", lh: 1.5 }),
          txt("studio.app/journal/case-studies", { x: 700, y: 740, w: 760, h: 44, size: 26, font: F.mono, weight: 400, color: "#ea580c" }),
        ]),
      ]),
  },
  {
    slug: "fb-event-post",
    name: "Community Day — Facebook Post",
    category: "social",
    type: "canvas",
    tags: ["facebook", "event", "community"],
    width: 1200,
    height: 1200,
    build: () =>
      doc("canvas", 1200, 1200, solid("#eff6ff"), [
        page("Post", solid("#eff6ff"), [
          rect({ x: 90, y: 90, w: 1020, h: 1020, fill: "#1d4ed8", r: 36 }),
          img(asset("sunburst"), { x: 380, y: 160, w: 440, h: 440, opacity: 0.5 }),
          txt("COMMUNITY\nDAY 2026", { x: 0, y: 300, w: 1200, h: 340, size: 140, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1 }),
          txt("games · food trucks · live music · kids corner", { x: 0, y: 670, w: 1200, h: 60, size: 36, weight: 500, color: "#bfdbfe", align: "center" }),
          txt("SAT AUG 9 · 10–6 · CITY PARK", { x: 0, y: 780, w: 1200, h: 70, size: 48, font: F.cond, weight: 600, color: "#fde047", align: "center", ls: 4 }),
          ...pill("GOING? MARK INTERESTED", { x: 350, y: 900, w: 500, h: 90, fill: "#ffffff", size: 28, color: "#1d4ed8" }),
        ]),
      ]),
  },
]

export const SOCIAL_TPLS: TemplateSpec[] = [
  ...quotePosts,
  ...promoPosts,
  ...engagementPosts,
  ...contentPosts,
  ...formatPosts,
]
