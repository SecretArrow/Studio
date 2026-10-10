/**
 * Marketing templates — flyers, posters, logos, ads, certificates, merch.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  gradient,
  img,
  page,
  pill,
  qrEl,
  rect,
  rule,
  shp,
  solid,
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"

const A4W = 1240
const A4H = 1754
const INK = "#111827"

/* ------------------------------ flyers ------------------------------ */

const flyers: TemplateSpec[] = [
  {
    slug: "flyer-yoga-class",
    name: "Sunrise Yoga — Class Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "yoga", "class", "wellness"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#ecfdf5"), [
        page("Flyer", solid("#ecfdf5"), [
          ellipse({ x: 320, y: 180, w: 600, h: 600, fill: "#a7f3d0" }),
          ellipse({ x: 470, y: 330, w: 300, h: 300, fill: "#059669" }),
          txt("breath in,\nbreathe out", { x: 320, y: 400, w: 600, h: 160, size: 54, font: F.script, weight: 400, color: "#ecfdf5", align: "center", lh: 1.3 }),
          txt("SUNRISE\nYOGA", { x: 0, y: 850, w: A4W, h: 400, size: 170, font: F.serif, weight: 700, color: "#064e3b", align: "center", lh: 1.08 }),
          ...vstackRules(),
          ...pill("FIRST CLASS FREE", { x: 360, y: 1290, w: 520, h: 96, fill: "#059669", size: 32, color: "#ecfdf5" }),
          txt("every tue & thu · 6:00 AM · botanical park lawn\nmats provided · all levels · drop-in welcome", { x: 140, y: 1450, w: 960, h: 130, size: 30, weight: 400, color: "#047857", align: "center", lh: 1.7 }),
          txt("teach with us: hello@sunriseyoga.example", { x: 0, y: 1620, w: A4W, h: 44, size: 26, font: F.mono, weight: 400, color: "#059669", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "flyer-charity-run",
    name: "City 5K — Charity Run Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "charity", "run", "sports"],
    width: A4W,
    height: A4H,
    featured: true,
    build: () =>
      doc("canvas", A4W, A4H, solid("#1d4ed8"), [
        page("Flyer", solid("#1d4ed8"), [
          rect({ x: 0, y: 0, w: A4W, h: 560, fill: "#1e3a8a", r: 0 }),
          rect({ x: -100, y: 470, w: 1440, h: 140, fill: "#fde047", rotation: -4 }),
          txt("CITY 5K", { x: 0, y: 140, w: A4W, h: 240, size: 220, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 12 }),
          txt("RUN FOR REEFS · CHARITY EDITION", { x: 0, y: 390, w: A4W, h: 60, size: 40, font: F.mono, weight: 700, color: "#fde047", align: "center", ls: 6 }),
          txt("SUN · AUG 23 · 6:30 AM", { x: 0, y: 700, w: A4W, h: 90, size: 66, font: F.cond, weight: 600, color: INK, align: "center", upper: true, ls: 4 }),
          txt("start & finish at marina park · chip timed\n5K run, 3K walk, kids' dash at 8", { x: 200, y: 820, w: 840, h: 140, size: 32, weight: 400, color: "#dbeafe", align: "center", lh: 1.7 }),
          ...[["$25", "early bird"], ["$30", "race week"], ["$0", "kids dash"]].flatMap((p, i) => {
            const x = 200 + i * 290
            return [
              rect({ x, y: 1020, w: 250, h: 240, fill: "#ffffff", r: 20 }),
              txt(p[0], { x, y: 1060, w: 250, h: 110, size: 70, font: F.display, weight: 400, color: "#1d4ed8", align: "center" }),
              txt(p[1], { x, y: 1180, w: 250, h: 44, size: 26, weight: 500, color: "#6b7280", align: "center" }),
            ] as DesignElement[]
          }),
          ...pill("REGISTER: CITY5K.EXAMPLE", { x: 300, y: 1360, w: 640, h: 96, fill: "#fde047", size: 32, color: INK }),
          qrEl("https://city5k.example/register", { x: 530, y: 1500, size: 180, fg: INK, bg: "#ffffff" }),
          txt("every registration plants a coral fragment", { x: 0, y: 1690, w: A4W, h: 40, size: 24, font: F.hand, weight: 400, color: "#bfdbfe", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "flyer-garage-sale",
    name: "Big Garage Sale — Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "garage sale", "community", "local"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#fffbeb"), [
        page("Flyer", solid("#fffbeb"), [
          img(asset("checkers"), { x: 0, y: 0, w: A4W, h: A4H, opacity: 0.5 }),
          rect({ x: 100, y: 100, w: 1040, h: 1554, fill: "#fffbeb", r: 24 }),
          txt("BIG\nGARAGE\nSALE", { x: 0, y: 220, w: A4W, h: 620, size: 200, font: F.marker, weight: 400, color: "#b45309", align: "center", lh: 1.05, rotation: -2 }),
          txt("everything must go!", { x: 0, y: 880, w: A4W, h: 80, size: 56, font: F.script, weight: 400, color: "#d97706", align: "center" }),
          ...vstackRules(),
          txt("SAT 8 AM – 2 PM · 45 Maple Drive\ntools, books, records, bikes, vintage lamps", { x: 160, y: 1130, w: 920, h: 160, size: 34, weight: 500, color: "#78350f", align: "center", lh: 1.7 }),
          txt("cash preferred · no early birds please 🙏", { x: 0, y: 1330, w: A4W, h: 50, size: 30, font: F.hand, weight: 400, color: "#b45309", align: "center" }),
          txt("rain or shine — the good stuff is in the garage", { x: 0, y: 1560, w: A4W, h: 44, size: 26, font: F.mono, weight: 400, color: "#92400e", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "flyer-open-mic",
    name: "Open Mic Night — Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "open mic", "music", "night"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#0c0a09"), [
        page("Flyer", solid("#0c0a09"), [
          ellipse({ x: 370, y: 130, w: 500, h: 500, fill: "#facc15" }),
          img(asset("music-note"), { x: 480, y: 240, w: 280, h: 280 }),
          txt("OPEN MIC\nNIGHT", { x: 0, y: 700, w: A4W, h: 400, size: 150, font: F.display, weight: 400, color: "#fafaf9", align: "center", lh: 1.02, ls: 6 }),
          rule(500, 1140, 240, "#facc15", 8),
          txt("poems · songs · stories · 5 min each\nsign-ups from 7 PM · free entry", { x: 0, y: 1200, w: A4W, h: 140, size: 34, weight: 400, color: "#d6d3d1", align: "center", lh: 1.7 }),
          ...pill("EVERY WEDNESDAY · 8 PM", { x: 300, y: 1400, w: 640, h: 92, fill: "#facc15", size: 32, color: "#0c0a09" }),
          txt("The Loft, 21 Harbor Street · drink specials all night", { x: 0, y: 1560, w: A4W, h: 44, size: 26, font: F.mono, weight: 400, color: "#a8a29e", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "flyer-tutoring",
    name: "Math Tutoring — Service Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "tutoring", "education", "service"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#eff6ff"), [
        page("Flyer", solid("#eff6ff"), [
          rect({ x: 0, y: 0, w: A4W, h: 480, fill: "#1d4ed8", r: 0 }),
          img(asset("grad-cap"), { x: 520, y: 150, w: 200, h: 150 }),
          txt("MATH TUTORING", { x: 0, y: 330, w: A4W, h: 100, size: 76, font: F.cond, weight: 600, color: "#ffffff", align: "center", ls: 6 }),
          txt("grades 7–12 · patient, structured, encouraging", { x: 0, y: 540, w: A4W, h: 60, size: 36, font: F.serif, weight: 400, italic: true, color: "#1e3a8a", align: "center" }),
          ...[["Algebra & geometry", "exam prep built on practice"], ["Small groups (max 4)", "personal attention, shared cost"], ["Weekly progress notes", "parents always in the loop"]].flatMap((row, i) => {
            const y = 660 + i * 170
            return [
              shp("badge", { x: 170, y: y + 14, w: 90, h: 90, fill: "#bfdbfe" }),
              txt(String(i + 1), { x: 170, y: y + 16, w: 90, h: 88, size: 44, font: F.display, weight: 400, color: "#1e3a8a", align: "center", vAlign: "middle" }),
              txt(row[0], { x: 300, y: y, w: 760, h: 60, size: 40, font: F.pop, weight: 700, color: INK }),
              txt(row[1], { x: 302, y: y + 70, w: 760, h: 50, size: 30, weight: 400, color: "#4b5563" }),
            ] as DesignElement[]
          }),
          rect({ x: 170, y: 1220, w: 900, h: 250, fill: "#ffffff", r: 20, stroke: "#bfdbfe", sw: 3 }),
          txt("$20 / session · first trial lesson free", { x: 0, y: 1260, w: A4W, h: 70, size: 44, font: F.pop, weight: 700, color: "#1d4ed8", align: "center" }),
          txt("Mon–Fri 4–8 PM · online or library study room", { x: 0, y: 1340, w: A4W, h: 50, size: 30, weight: 400, color: "#6b7280", align: "center" }),
          txt("WA 0812-555-0199 · Ms. Ayu, 8 yrs teaching", { x: 0, y: 1580, w: A4W, h: 50, size: 28, font: F.mono, weight: 400, color: "#1e40af", align: "center" }),
          txt("references available on request", { x: 0, y: 1650, w: A4W, h: 40, size: 24, font: F.mono, weight: 400, color: "#93c5fd", align: "center" }),
        ]),
      ]),
  },
  {
    slug: "flyer-food-truck",
    name: "Food Truck Launch — Flyer",
    category: "marketing",
    type: "canvas",
    tags: ["flyer", "food truck", "launch", "restaurant"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#f97316"), [
        page("Flyer", solid("#f97316"), [
          rect({ x: 0, y: 1200, w: A4W, h: 554, fill: "#7c2d12", r: 0 }),
          img(asset("pizza"), { x: 760, y: 180, w: 380, h: 380, rotation: 10 }),
          txt("ROLLING\nYOUR WAY", { x: 90, y: 160, w: 700, h: 380, size: 120, font: F.display, weight: 400, color: "#fff7ed", lh: 1, ls: 2 }),
          txt("MAMA GEMUK KITCHEN", { x: 90, y: 600, w: 800, h: 70, size: 48, font: F.cond, weight: 600, color: "#fde047", ls: 4 }),
          txt("smash burgers · loaded fries · sambal everything", { x: 90, y: 690, w: 760, h: 100, size: 34, weight: 500, color: "#ffedd5", lh: 1.5 }),
          txt("LAUNCH WEEK\nOCT 5–11", { x: 90, y: 1300, w: 500, h: 240, size: 80, font: F.display, weight: 400, color: "#fde047", lh: 1.1 }),
          txt("follow @mamagemuk for daily spots\nfirst 50 customers get free fries", { x: 90, y: 1560, w: 620, h: 120, size: 30, weight: 400, color: "#fde68a", lh: 1.6 }),
          qrEl("https://mamagemuk.example/route", { x: 850, y: 1320, size: 260, fg: "#fff7ed", bg: "#7c2d12" }),
          txt("scan for this week's route", { x: 850, y: 1600, w: 260, h: 40, size: 22, font: F.mono, weight: 400, color: "#fde68a", align: "center" }),
        ]),
      ]),
  },
]

/** dotted separator used by flyers */
function vstackRules(): DesignElement[] {
  return [
    txt("· · · · · · · · · · · · · · · · · · · · · · · · · · · · ·", { x: 140, y: 1060, w: 960, h: 40, size: 28, color: "#d1d5db", align: "center" }),
  ]
}

/* ------------------------------ posters ------------------------------ */

const posters: TemplateSpec[] = [
  {
    slug: "poster-movie-night",
    name: "Rooftop Movie Night — Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "movie", "event", "night"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#1e1b4b"), [
        page("Poster", solid("#1e1b4b"), [
          ellipse({ x: 720, y: 140, w: 380, h: 380, fill: "#fde047" }),
          img(asset("moon"), { x: 160, y: 180, w: 180, h: 180 }),
          img(asset("planet"), { x: 240, y: 620, w: 380, h: 266 }),
          txt("ROOFTOP\nMOVIE NIGHT", { x: 0, y: 920, w: A4W, h: 340, size: 130, font: F.display, weight: 400, color: "#e0e7ff", align: "center", lh: 1.05, ls: 4 }),
          txt("double feature: retro sci-fi & silent comedy", { x: 0, y: 1280, w: A4W, h: 60, size: 36, font: F.serif, weight: 400, italic: true, color: "#c7d2fe", align: "center" }),
          ...pill("SAT · SEP 5 · SUNSET 6:40 PM", { x: 290, y: 1400, w: 660, h: 92, fill: "#fde047", size: 30, color: "#1e1b4b" }),
          txt("blankets & popcorn provided · free\nrooftop of Guild Hall, elevator to 9F", { x: 0, y: 1540, w: A4W, h: 110, size: 28, weight: 400, color: "#a5b4fc", align: "center", lh: 1.65 }),
        ]),
      ]),
  },
  {
    slug: "poster-typographic",
    name: "Hustle Quietly — Typographic Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "typography", "motivation", "minimal"],
    width: A4W,
    height: A4H,
    featured: true,
    build: () =>
      doc("canvas", A4W, A4H, solid("#fafaf9"), [
        page("Poster", solid("#fafaf9"), [
          txt("HUSTLE", { x: 0, y: 300, w: A4W, h: 320, size: 280, font: F.display, weight: 400, color: INK, align: "center", ls: 8 }),
          txt("QUIETLY.", { x: 0, y: 640, w: A4W, h: 320, size: 280, font: F.display, weight: 400, color: "#e7e5e4", align: "center", ls: 8, rotation: 0 }),
          rule(430, 1050, 380, "#f97316", 12),
          txt("let the work make the noise —\nposter no. 04 in the quiet series", { x: 0, y: 1130, w: A4W, h: 120, size: 34, font: F.serif, weight: 400, italic: true, color: "#78716c", align: "center", lh: 1.6 }),
          txt("STUDIO PRESS · 2026", { x: 0, y: 1600, w: A4W, h: 40, size: 24, font: F.mono, weight: 400, color: "#d6d3d1", align: "center", ls: 8 }),
        ]),
      ]),
  },
  {
    slug: "poster-vintage-travel",
    name: "Visit the Highlands — Vintage Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "travel", "vintage", "retro"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, gradient("#fb923c", "#fde68a", 170), [
        page("Poster", gradient("#fb923c", "#fde68a", 170), [
          ellipse({ x: 420, y: 200, w: 400, h: 400, fill: "#fff7ed", opacity: 0.9 }),
          img(asset("mountain"), { x: 120, y: 620, w: 1000, h: 600 }),
          rect({ x: 90, y: 90, w: 1060, h: 1574, fill: "transparent", stroke: "#7c2d12", sw: 10, r: 8 }),
          rect({ x: 120, y: 120, w: 1000, h: 1514, fill: "transparent", stroke: "#7c2d12", sw: 3, r: 4 }),
          txt("VISIT THE", { x: 0, y: 200, w: A4W, h: 90, size: 54, font: F.cond, weight: 500, color: "#7c2d12", align: "center", ls: 12 }),
          txt("HIGHLANDS", { x: 0, y: 290, w: A4W, h: 180, size: 120, font: F.display, weight: 400, color: "#7c2d12", align: "center", ls: 6 }),
          txt("cool air · warm tea · trails for days\ntrain from the capital, 3 hours", { x: 0, y: 1330, w: A4W, h: 120, size: 34, font: F.body, weight: 500, color: "#9a3412", align: "center", lh: 1.7 }),
          ...pill("RAILWAY BUREAU · EST. 1934", { x: 350, y: 1500, w: 540, h: 84, fill: "#7c2d12", size: 26, color: "#fff7ed" }),
        ]),
      ]),
  },
  {
    slug: "poster-gallery-show",
    name: "Paper & Ink — Gallery Exhibition Poster",
    category: "print",
    type: "canvas",
    tags: ["poster", "gallery", "art", "exhibition"],
    width: A4W,
    height: A4H,
    build: () =>
      doc("canvas", A4W, A4H, solid("#ffffff"), [
        page("Poster", solid("#ffffff"), [
          rect({ x: 140, y: 140, w: 960, h: 700, fill: "#f5f5f4", r: 0 }),
          img(asset("blob-1"), { x: 260, y: 240, w: 400, h: 400, opacity: 0.85 }),
          img(asset("triangle"), { x: 660, y: 320, w: 300, h: 300, opacity: 0.7, rotation: 12 }),
          txt("PAPER & INK", { x: 140, y: 900, w: 960, h: 130, size: 100, font: F.serif, weight: 700, color: INK, align: "center" }),
          txt("new works by junia dewi — drawings on\nfound paper from the studio archive", { x: 140, y: 1060, w: 960, h: 140, size: 32, font: F.body, weight: 400, color: "#57534e", align: "center", lh: 1.7 }),
          rule(570, 1250, 100, "#f97316", 8),
          txt("OCT 2 – NOV 14 · TUES–SUN · 11–6", { x: 0, y: 1320, w: A4W, h: 60, size: 36, font: F.mono, weight: 700, color: INK, align: "center", ls: 3 }),
          txt("Galeri Melati · Jl. Cempaka 22 · free entry", { x: 0, y: 1420, w: A4W, h: 50, size: 28, weight: 400, color: "#78716c", align: "center" }),
          txt("opening night: oct 1, 7 pm — rsvp hello@galeri.example", { x: 0, y: 1600, w: A4W, h: 44, size: 24, font: F.mono, weight: 400, color: "#a8a29e", align: "center" }),
        ]),
      ]),
  },
]

/* ------------------------------ logos (family) ------------------------------ */

interface LogoSpec {
  slug: string
  name: string
  bg: string
  word: string
  sub: string
  style: "wordmark" | "circle" | "hex" | "script" | "camera" | "bold" | "eco" | "retro"
  colors: { main: string; sub: string; accent: string }
}

const LOGO_SPECS: LogoSpec[] = [
  { slug: "logo-wordmark-lumina", name: "Lumina — Wordmark Logo", bg: "#ffffff", word: "LUMINA", sub: "LIGHTING STUDIO", style: "wordmark", colors: { main: INK, sub: "#6b7280", accent: "#f59e0b" } },
  { slug: "logo-circle-bloom", name: "Bloom — Circle Badge Logo", bg: "#fdf2f8", word: "BLOOM", sub: "FLOWER SHOP", style: "circle", colors: { main: "#db2777", sub: "#831843", accent: "#f9a8d4" } },
  { slug: "logo-hex-volt", name: "Volt — Tech Hex Logo", bg: "#0b1220", word: "VOLT", sub: "EV CHARGING", style: "hex", colors: { main: "#22d3ee", sub: "#67e8f9", accent: "#fde047" } },
  { slug: "logo-script-crumb", name: "Crumb — Bakery Script Logo", bg: "#fffbeb", word: "Crumb", sub: "ARTISAN BAKERY", style: "script", colors: { main: "#b45309", sub: "#92400e", accent: "#fbbf24" } },
  { slug: "logo-aperture-photo", name: "Aperture — Photography Logo", bg: "#1c1917", word: "APERTURE", sub: "PHOTOGRAPHY", style: "camera", colors: { main: "#fafaf9", sub: "#d6d3d1", accent: "#fbbf24" } },
  { slug: "logo-forge-fit", name: "Forge — Fitness Logo", bg: "#111827", word: "FORGE", sub: "STRENGTH CLUB", style: "bold", colors: { main: "#f9fafb", sub: "#9ca3af", accent: "#ef4444" } },
  { slug: "logo-eco-sprout", name: "Sprout — Eco Logo", bg: "#f0fdf4", word: "SPROUT", sub: "ZERO WASTE STORE", style: "eco", colors: { main: "#166534", sub: "#15803d", accent: "#4ade80" } },
  { slug: "logo-retro-diner", name: "Retro Spoon — Diner Logo", bg: "#fff7ed", word: "SPOON", sub: "DINER · EST. 1987", style: "retro", colors: { main: "#9a3412", sub: "#c2410c", accent: "#fb923c" } },
]

const logoTpls: TemplateSpec[] = LOGO_SPECS.map((s) => ({
  slug: s.slug,
  name: s.name,
  category: "marketing",
  type: "canvas" as const,
  tags: ["logo", "brand", s.style],
  width: 1000,
  height: 1000,
  build: () => {
    const els: DesignElement[] = []
    switch (s.style) {
      case "wordmark":
        els.push(rule(320, 400, 80, s.colors.accent, 14))
        els.push(txt(s.word, { x: 0, y: 440, w: 1000, h: 160, size: 130, font: F.pop, weight: 800, color: s.colors.main, align: "center", ls: 14 }))
        els.push(txt(s.sub, { x: 0, y: 630, w: 1000, h: 44, size: 28, font: F.mono, weight: 400, color: s.colors.sub, align: "center", ls: 10 }))
        break
      case "circle":
        els.push(ellipse({ x: 250, y: 170, w: 500, h: 500, fill: s.colors.main }))
        els.push(ellipse({ x: 285, y: 205, w: 430, h: 430, fill: "transparent", stroke: s.colors.accent, sw: 4, dash: [4, 14] }))
        els.push(txt(s.word, { x: 250, y: 340, w: 500, h: 130, size: 110, font: F.serif, weight: 700, color: "#ffffff", align: "center", ls: 8 }))
        els.push(img(asset("flower"), { x: 425, y: 480, w: 150, h: 150 }))
        els.push(txt(s.sub, { x: 0, y: 730, w: 1000, h: 44, size: 28, font: F.mono, weight: 700, color: s.colors.sub, align: "center", ls: 10 }))
        break
      case "hex":
        els.push(shp("hexagon", { x: 300, y: 220, w: 400, h: 440, fill: s.colors.main }))
        els.push(img(asset("lightning"), { x: 420, y: 330, w: 160, h: 160 }))
        els.push(txt(s.word, { x: 0, y: 720, w: 1000, h: 120, size: 100, font: F.display, weight: 400, color: s.colors.main, align: "center", ls: 16 }))
        els.push(txt(s.sub, { x: 0, y: 850, w: 1000, h: 40, size: 24, font: F.mono, weight: 400, color: s.colors.sub, align: "center", ls: 8 }))
        break
      case "script":
        els.push(img(asset("sunburst"), { x: 320, y: 220, w: 360, h: 360, opacity: 0.55 }))
        els.push(txt(s.word, { x: 0, y: 330, w: 1000, h: 240, size: 170, font: F.script, weight: 700, color: s.colors.main, align: "center" }))
        els.push(rule(400, 600, 200, s.colors.accent, 6))
        els.push(txt(s.sub, { x: 0, y: 640, w: 1000, h: 44, size: 28, font: F.mono, weight: 700, color: s.colors.sub, align: "center", ls: 8 }))
        els.push(txt("fresh every morning", { x: 0, y: 710, w: 1000, h: 50, size: 34, font: F.hand, weight: 400, color: s.colors.accent, align: "center" }))
        break
      case "camera":
        els.push(rect({ x: 310, y: 260, w: 380, h: 280, fill: "transparent", stroke: s.colors.main, sw: 10, r: 28 }))
        els.push(ellipse({ x: 430, y: 320, w: 140, h: 140, fill: "transparent", stroke: s.colors.main, sw: 10 }))
        els.push(ellipse({ x: 480, y: 370, w: 40, h: 40, fill: s.colors.accent }))
        els.push(txt(s.word, { x: 0, y: 600, w: 1000, h: 110, size: 88, font: F.mono, weight: 700, color: s.colors.main, align: "center", ls: 14 }))
        els.push(txt(s.sub, { x: 0, y: 730, w: 1000, h: 40, size: 26, font: F.mono, weight: 400, color: s.colors.sub, align: "center", ls: 16 }))
        break
      case "bold":
        els.push(rect({ x: 200, y: 260, w: 600, h: 240, fill: s.colors.accent, rotation: -4 }))
        els.push(txt(s.word, { x: 0, y: 300, w: 1000, h: 180, size: 150, font: F.display, weight: 400, color: s.colors.main, align: "center", ls: 10, rotation: -4 }))
        els.push(txt(s.sub, { x: 0, y: 580, w: 1000, h: 44, size: 30, font: F.mono, weight: 700, color: s.colors.sub, align: "center", ls: 10 }))
        els.push(rule(350, 660, 300, s.colors.accent, 6))
        break
      case "eco":
        els.push(img(asset("leaf"), { x: 380, y: 240, w: 240, h: 240 }))
        els.push(txt(s.word, { x: 0, y: 520, w: 1000, h: 130, size: 110, font: F.serif, weight: 700, color: s.colors.main, align: "center", ls: 12 }))
        els.push(txt(s.sub, { x: 0, y: 670, w: 1000, h: 40, size: 26, font: F.mono, weight: 400, color: s.colors.sub, align: "center", ls: 8 }))
        break
      case "retro":
        els.push(img(asset("sunburst"), { x: 280, y: 200, w: 440, h: 440, opacity: 0.9 }))
        els.push(txt(s.word, { x: 0, y: 330, w: 1000, h: 170, size: 140, font: F.script, weight: 700, color: s.colors.main, align: "center" }))
        els.push(rect({ x: 250, y: 530, w: 500, h: 90, fill: s.colors.accent, r: 45 }))
        els.push(txt(s.sub, { x: 250, y: 532, w: 500, h: 86, size: 30, font: F.mono, weight: 700, color: "#fff7ed", align: "center", vAlign: "middle", ls: 4 }))
        break
    }
    return doc("canvas", 1000, 1000, s.bg, [page("Logo", solid(s.bg), els)])
  },
}))

/* ------------------------------ ads & promos ------------------------------ */

const ads: TemplateSpec[] = [
  {
    slug: "ad-app-install",
    name: "Try Free — App Install Ad",
    category: "marketing",
    type: "canvas",
    tags: ["ad", "app", "web banner", "install"],
    width: 1200,
    height: 628,
    build: () =>
      doc("canvas", 1200, 628, gradient("#4f46e5", "#7c3aed", 120), [
        page("Ad", gradient("#4f46e5", "#7c3aed", 120), [
          img(asset("sparkle"), { x: 950, y: 80, w: 120, h: 120 }),
          img(asset("sparkle-small"), { x: 820, y: 420, w: 100, h: 100 }),
          txt("Design anything.\nPay nothing.", { x: 70, y: 130, w: 700, h: 240, size: 64, font: F.pop, weight: 800, color: "#ffffff", lh: 1.2 }),
          txt("templates · editor · exports — free forever", { x: 74, y: 390, w: 620, h: 50, size: 28, weight: 500, color: "#ddd6fe" }),
          rect({ x: 74, y: 470, w: 320, h: 84, fill: "#ffffff", r: 42 }),
          txt("TRY IT FREE", { x: 74, y: 472, w: 320, h: 80, size: 30, font: F.pop, weight: 800, color: "#4338ca", align: "center", vAlign: "middle" }),
          rect({ x: 0, y: 0, w: 1200, h: 10, fill: "#fde047", r: 0 }),
        ]),
      ]),
  },
  {
    slug: "ad-course-promo",
    name: "Enroll Now — Course Ad",
    category: "marketing",
    type: "canvas",
    tags: ["ad", "course", "education", "enroll"],
    width: 1200,
    height: 628,
    build: () =>
      doc("canvas", 1200, 628, solid("#134e4a"), [
        page("Ad", solid("#134e4a"), [
          rect({ x: 760, y: 0, w: 440, h: 628, fill: "#0d9488", r: 0 }),
          img(asset("grad-cap"), { x: 850, y: 150, w: 260, h: 195 }),
          txt("COHORT 4", { x: 70, y: 100, w: 400, h: 50, size: 28, font: F.mono, weight: 700, color: "#5eead4", ls: 6 }),
          txt("Motion Design\nFoundations", { x: 66, y: 170, w: 660, h: 220, size: 62, font: F.serif, weight: 700, color: "#f0fdfa", lh: 1.2 }),
          txt("6 weeks · live + recorded · portfolio reviews", { x: 70, y: 410, w: 640, h: 50, size: 28, weight: 400, color: "#99f6e4" }),
          txt("starts oct 12 — 30 seats", { x: 70, y: 470, w: 500, h: 44, size: 30, font: F.pop, weight: 700, color: "#fde047" }),
          ...pill("ENROLL", { x: 70, y: 540, w: 240, h: 70, fill: "#fde047", size: 26, color: "#134e4a" }),
        ]),
      ]),
  },
  {
    slug: "ad-restaurant-web",
    name: "Lunch Special — Restaurant Banner Ad",
    category: "marketing",
    type: "canvas",
    tags: ["ad", "restaurant", "lunch", "web"],
    width: 1200,
    height: 628,
    build: () =>
      doc("canvas", 1200, 628, solid("#fffbeb"), [
        page("Ad", solid("#fffbeb"), [
          rect({ x: 0, y: 0, w: 640, h: 628, fill: "#b45309", r: 0 }),
          img(asset("coffee"), { x: 180, y: 130, w: 280, h: 280 }),
          txt("NASI + KOPI = $5", { x: 0, y: 440, w: 640, h: 70, size: 44, font: F.display, weight: 400, color: "#fef3c7", align: "center", ls: 2 }),
          txt("LUNCH SPECIALS", { x: 700, y: 120, w: 440, h: 50, size: 30, font: F.mono, weight: 700, color: "#b45309", ls: 4 }),
          txt("weekday set menu 11–2:\nrice, two sides, drink.\neat in or takeaway.", { x: 700, y: 190, w: 440, h: 220, size: 30, font: F.body, weight: 400, color: "#78350f", lh: 1.6 }),
          ...pill("SEE THE MENU", { x: 700, y: 440, w: 320, h: 76, fill: "#b45309", size: 26, color: "#fffbeb" }),
          txt("Warung Nusa · 08:00–21:00 daily", { x: 700, y: 560, w: 460, h: 40, size: 22, font: F.mono, weight: 400, color: "#92400e" }),
        ]),
      ]),
  },
  {
    slug: "gift-certificate",
    name: "Gift Certificate — $50",
    category: "marketing",
    type: "canvas",
    tags: ["gift certificate", "voucher", "print"],
    width: 1400,
    height: 600,
    build: () =>
      doc("canvas", 1400, 600, solid("#fdf8f1"), [
        page("Certificate", solid("#fdf8f1"), [
          rect({ x: 30, y: 30, w: 1340, h: 540, fill: "#ffffff", stroke: "#b45309", sw: 6, r: 18 }),
          rect({ x: 50, y: 50, w: 1300, h: 500, fill: "transparent", stroke: "#fde68a", sw: 2, r: 12 }),
          img(asset("gift"), { x: 90, y: 90, w: 130, h: 130 }),
          txt("GIFT CERTIFICATE", { x: 260, y: 110, w: 700, h: 70, size: 54, font: F.serif, weight: 700, color: "#78350f", ls: 6 }),
          txt("this certificate entitles the bearer to", { x: 262, y: 200, w: 700, h: 44, size: 28, font: F.body, weight: 400, color: "#92400e" }),
          txt("$50", { x: 1060, y: 120, w: 260, h: 160, size: 110, font: F.display, weight: 400, color: "#b45309", align: "center" }),
          rule(90, 380, 700, "#fde68a", 4),
          txt("to: ________________    from: ________________    no. 00184", { x: 90, y: 410, w: 900, h: 50, size: 26, font: F.mono, weight: 400, color: "#92400e" }),
          txt("redeemable at any Bloom & Twine store · valid 12 months", { x: 90, y: 490, w: 1000, h: 40, size: 22, font: F.mono, weight: 400, color: "#d6d3d1" }),
        ]),
      ]),
  },
  {
    slug: "loyalty-card",
    name: "Coffee Loyalty Card",
    category: "marketing",
    type: "canvas",
    tags: ["loyalty", "card", "cafe", "print"],
    width: 1050,
    height: 600,
    build: () => {
      const cups: DesignElement[] = []
      for (let i = 0; i < 8; i++) {
        const x = 90 + i * 112
        cups.push(ellipse({ x, y: 380, w: 84, h: 84, fill: "transparent", stroke: i < 3 ? "#b45309" : "#e7e5e4", sw: 4 }))
        if (i < 3) cups.push(img(asset("coffee"), { x: x + 10, y: 390, w: 64, h: 64 }))
      }
      return doc("canvas", 1050, 600, solid("#fffbeb"), [
        page("Card", solid("#fffbeb"), [
          img(asset("coffee"), { x: 80, y: 80, w: 110, h: 110 }),
          txt("SUNRISE CAFÉ", { x: 220, y: 100, w: 500, h: 60, size: 44, font: F.serif, weight: 700, color: "#78350f" }),
          txt("LOYALTY CARD", { x: 222, y: 170, w: 400, h: 40, size: 24, font: F.mono, weight: 700, color: "#b45309", ls: 8 }),
          ...cups,
          txt("9th cup free — because you're a regular now", { x: 90, y: 510, w: 700, h: 44, size: 26, font: F.hand, weight: 400, color: "#92400e" }),
          txt("no. 0042", { x: 820, y: 100, w: 140, h: 40, size: 22, font: F.mono, weight: 400, color: "#d6d3d1", align: "right" }),
        ]),
      ])
    },
  },
  {
    slug: "rollup-banner",
    name: "Conference Roll-up Banner",
    category: "marketing",
    type: "canvas",
    tags: ["roll-up", "banner", "conference", "event"],
    width: 850,
    height: 2000,
    build: () =>
      doc("canvas", 850, 2000, gradient("#1e1b4b", "#4c1d95", 180), [
        page("Roll-up", gradient("#1e1b4b", "#4c1d95", 180), [
          img(asset("sunburst"), { x: 220, y: 150, w: 410, h: 410, opacity: 0.5 }),
          txt("DESIGN\nOPS 2026", { x: 60, y: 600, w: 730, h: 420, size: 130, font: F.display, weight: 400, color: "#ffffff", lh: 1.02, ls: 3 }),
          rule(70, 1080, 160, "#fde047", 10),
          txt("the conference for design systems,\nops and the people who run them", { x: 70, y: 1140, w: 700, h: 160, size: 36, font: F.body, weight: 400, color: "#ddd6fe", lh: 1.6 }),
          txt("NOV 19–20 · JAKARTA\n40 talks · 6 workshops", { x: 70, y: 1360, w: 700, h: 160, size: 40, font: F.mono, weight: 700, color: "#fde047", lh: 1.6 }),
          txt("designops.example · early bird until aug 1", { x: 70, y: 1560, w: 700, h: 90, size: 28, font: F.mono, weight: 400, color: "#a5b4fc", lh: 1.5 }),
        ]),
      ]),
  },
  {
    slug: "price-tag-set",
    name: "Sale Price Tags — Set of 3",
    category: "marketing",
    type: "canvas",
    tags: ["price tag", "retail", "sale", "print"],
    width: 1080,
    height: 1080,
    build: () => {
      const tags: [string, string, string][] = [
        ["$12", "was $18", "#0ea5e9"],
        ["$25", "was $35", "#db2777"],
        ["$40", "was $59", "#f97316"],
      ]
      const els: DesignElement[] = tags.flatMap(([price, was, color], i) => {
        const x = 90 + i * 310
        return [
          rect({ x, y: 300, w: 260, h: 420, fill: color, r: 20 }),
          ellipse({ x: x + 105, y: 320, w: 50, h: 50, fill: "#ffffff" }),
          txt(price, { x, y: 430, w: 260, h: 130, size: 90, font: F.display, weight: 400, color: "#ffffff", align: "center" }),
          txt(was, { x, y: 590, w: 260, h: 50, size: 30, font: F.mono, weight: 400, color: "#ffffff", align: "center", opacity: 0.85 }),
          txt("SALE", { x, y: 660, w: 260, h: 40, size: 22, font: F.mono, weight: 700, color: "#ffffff", align: "center", ls: 6 }),
        ] as DesignElement[]
      })
      return doc("canvas", 1080, 1080, solid("#f8fafc"), [
        page("Tags", solid("#f8fafc"), [
          txt("PRINT · CUT · STRING · DONE", { x: 0, y: 140, w: 1080, h: 60, size: 36, font: F.mono, weight: 700, color: "#64748b", align: "center", ls: 4 }),
          ...els,
          txt("swap the prices, keep the look — fits 60×110 mm holders", { x: 0, y: 830, w: 1080, h: 44, size: 26, font: F.hand, weight: 400, color: "#94a3b8", align: "center" }),
        ]),
      ])
    },
  },
  {
    slug: "merch-mockup",
    name: "Limited Merch — Mug Graphic",
    category: "marketing",
    type: "canvas",
    tags: ["merch", "mug", "mockup", "shop"],
    width: 1080,
    height: 1080,
    build: () =>
      doc("canvas", 1080, 1080, solid("#fafaf9"), [
        page("Mockup", solid("#fafaf9"), [
          ellipse({ x: 240, y: 240, w: 600, h: 600, fill: "#fef3c7" }),
          rect({ x: 330, y: 330, w: 420, h: 420, fill: "#ffffff", r: 210 }),
          txt("RUNS\nON\nTEA", { x: 330, y: 380, w: 420, h: 320, size: 80, font: F.display, weight: 400, color: "#b45309", align: "center", lh: 1.05 }),
          txt("limited mug drop · 100 pieces", { x: 0, y: 900, w: 1080, h: 50, size: 30, font: F.mono, weight: 400, color: "#78716c", align: "center" }),
          txt("THIS SIDE FOLLOWS THE HANDLE", { x: 0, y: 130, w: 1080, h: 44, size: 22, font: F.mono, weight: 400, color: "#d6d3d1", align: "center", ls: 4 }),
        ]),
      ]),
  },
  {
    slug: "newsletter-split",
    name: "Month in Review — Newsletter",
    category: "marketing",
    type: "canvas",
    tags: ["newsletter", "email", "editorial", "review"],
    width: 1080,
    height: 1350,
    build: () =>
      doc("canvas", 1080, 1350, solid("#ffffff"), [
        page("Newsletter", solid("#ffffff"), [
          rect({ x: 0, y: 0, w: 1080, h: 260, fill: "#0f172a", r: 0 }),
          txt("THE MONTHLY", { x: 90, y: 70, w: 600, h: 80, size: 60, font: F.serif, weight: 700, color: "#ffffff" }),
          txt("ISSUE 12 · OCTOBER", { x: 92, y: 165, w: 500, h: 40, size: 24, font: F.mono, weight: 400, color: "#94a3b8", ls: 4 }),
          ellipse({ x: 830, y: 60, w: 140, h: 140, fill: "#fde047" }),
          txt("3", { x: 830, y: 92, w: 140, h: 80, size: 60, font: F.display, weight: 400, color: "#0f172a", align: "center" }),
          ...[["THE BIG STORY", "We shipped the new editor: 4× faster zoom, smarter snapping and a layers panel you'll actually enjoy. Full changelog inside."], ["BY THE NUMBERS", "18,400 new users · 61,200 projects · 9 languages added. Thank you for an unforgettable quarter."], ["WHAT'S NEXT", "AI-assisted layout suggestions (opt-in, self-hosted friendly) and a mobile-first template pack."]].flatMap((row, i) => {
            const y = 330 + i * 300
            return [
              txt(row[0], { x: 90, y, w: 500, h: 50, size: 32, font: F.cond, weight: 600, color: "#7c3aed", ls: 3 }),
              rule(92, y + 60, 80, "#fde047", 6),
              txt(row[1], { x: 90, y: y + 90, w: 900, h: 160, size: 30, weight: 400, color: "#374151", lh: 1.65 }),
            ] as DesignElement[]
          }),
          rect({ x: 0, y: 1260, w: 1080, h: 90, fill: "#f5f3ff" }),
          txt("studio.app/monthly · free forever · unsubscribe anytime", { x: 0, y: 1288, w: 1080, h: 40, size: 24, font: F.mono, weight: 400, color: "#6b7280", align: "center" }),
        ]),
      ]),
  },
]

export const MARKETING_TPLS: TemplateSpec[] = [...flyers, ...posters, ...logoTpls, ...ads]
