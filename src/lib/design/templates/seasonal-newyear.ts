/**
 * Seasonal pack — Tahun Baru (New Year Masehi, Imlek, Hijriah) + resolusi + kalender.
 * ------------------------------------------------------------------------------------
 * 45 original editable templates researched from holiday-poster galleries:
 * fireworks nights, oversized "2026" numerals, neon celebration, red-gold Imlek
 * with lanterns & angpao, Hijriah green-gold, resolution checklists, wall calendars.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  gradient,
  img,
  page,
  rect,
  rule,
  shp,
  solid,
  tbl,
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"
import {
  A4H,
  A4W,
  BANNER_H,
  BANNER_W,
  EMERALD,
  GOLD,
  GOLD_SOFT,
  IG,
  NIGHT,
  banner,
  cornerOrnaments,
  crescentShape,
  starScatter,
  storyTemplate,
} from "./seasonal-shared"

const CAT = "seasonal"

/* ============================ NYE greeting posts (family) ============================ */

interface NYStyle {
  slug: string
  name: string
  bg: ReturnType<typeof solid> | ReturnType<typeof gradient>
  yearColor: string
  ink: string
  sub: string
  detail: string
  font: string
  deco: (els: DesignElement[]) => void
}

const NY_STYLES: NYStyle[] = [
  {
    slug: "ny-firework-night",
    name: "Firework Night — New Year Post",
    bg: solid("#0b0f1e"),
    yearColor: GOLD_SOFT,
    ink: "#fefce8",
    sub: "#cbd5e1",
    detail: "#94a3b8",
    font: F.display,
    deco: (d) => {
      d.push(img(asset("firework"), { x: 60, y: 60, w: 260, h: 260, opacity: 0.95 }))
      d.push(img(asset("firework-duo"), { x: 620, y: 100, w: 380, h: 253 }))
      d.push(img(asset("firework"), { x: 770, y: 560, w: 190, h: 190, opacity: 0.8 }))
      d.push(img(asset("firework"), { x: 130, y: 600, w: 150, h: 150, opacity: 0.6 }))
      d.push(img(asset("city-skyline"), { x: 0, y: 900, w: IG, h: 160, opacity: 0.85 }))
    },
  },
  {
    slug: "ny-gold-2026",
    name: "Gold Numbers — New Year Post",
    bg: solid("#111110"),
    yearColor: GOLD,
    ink: "#fafaf9",
    sub: "#d6d3d1",
    detail: "#a8a29e",
    font: F.serif,
    deco: (d) => {
      d.push(...cornerOrnaments(60, 60, IG - 120, IG - 120, GOLD))
      d.push(shp("star", { x: 470, y: 700, w: 60, h: 60, fill: GOLD, rotation: 15 }))
      d.push(...starScatter(9, 100, 80, 880, 240, GOLD_SOFT, 211))
    },
  },
  {
    slug: "ny-neon-celebrate",
    name: "Neon Celebration — New Year Post",
    bg: solid("#09090b"),
    yearColor: "#22d3ee",
    ink: "#fafafa",
    sub: "#a3e635",
    detail: "#71717a",
    font: F.display,
    deco: (d) => {
      d.push(rect({ x: 70, y: 70, w: IG - 140, h: IG - 140, fill: "transparent", stroke: "#22d3ee", sw: 4, r: 40, dash: [24, 18] }))
      d.push(shp("star", { x: 830, y: 110, w: 80, h: 80, fill: "#a3e635", rotation: 18 }))
      d.push(ellipse({ x: 120, y: 810, w: 110, h: 110, fill: "#db2777", opacity: 0.85 }))
      d.push(img(asset("firework"), { x: 400, y: 130, w: 280, h: 280, opacity: 0.55 }))
    },
  },
  {
    slug: "ny-sunset-glow",
    name: "Sunset Glow — New Year Post",
    bg: gradient("#f97316", "#be185d", 160),
    yearColor: "#fff7ed",
    ink: "#fff1e2",
    sub: "#ffe4e6",
    detail: "#fecdd3",
    font: F.pop,
    deco: (d) => {
      d.push(ellipse({ x: 290, y: 130, w: 500, h: 500, fill: "#ffffff", opacity: 0.14 }))
      d.push(ellipse({ x: 420, y: 260, w: 240, h: 240, fill: "#ffffff", opacity: 0.2 }))
      d.push(img(asset("firework-duo"), { x: 90, y: 700, w: 380, h: 253, opacity: 0.8 }))
      d.push(img(asset("firework"), { x: 740, y: 730, w: 220, h: 220, opacity: 0.8 }))
    },
  },
  {
    slug: "ny-pastel-sparkle",
    name: "Pastel Sparkle — New Year Post",
    bg: gradient("#c7d2fe", "#fbcfe8", 150),
    yearColor: "#4338ca",
    ink: "#312e81",
    sub: "#6d28d9",
    detail: "#7c3aed",
    font: F.pop,
    deco: (d) => {
      d.push(...starScatter(12, 90, 90, 900, 500, "#ffffff", 221))
      d.push(img(asset("sparkle"), { x: 90, y: 120, w: 170, h: 170 }))
      d.push(img(asset("sparkle-small"), { x: 820, y: 700, w: 160, h: 160 }))
    },
  },
  {
    slug: "ny-retro-cheers",
    name: "Retro Cheers — New Year Post",
    bg: solid("#fff7ed"),
    yearColor: "#9a3412",
    ink: "#1c1917",
    sub: "#c2410c",
    detail: "#78716c",
    font: F.display,
    deco: (d) => {
      d.push(img(asset("stripes-diag"), { x: 0, y: 0, w: IG, h: 260, opacity: 0.5 }))
      d.push(img(asset("stripes-diag"), { x: 0, y: 830, w: IG, h: 250, opacity: 0.5 }))
      d.push(shp("star", { x: 120, y: 330, w: 90, h: 90, fill: "#f59e0b", rotation: 12 }))
      d.push(shp("star", { x: 870, y: 330, w: 90, h: 90, fill: "#f59e0b", rotation: -12 }))
    },
  },
]

const NY_CONTENTS = [
  {
    year: "2026",
    kicker: "selamat tahun baru",
    main: "Happy New\nYear",
    sub: "sampai jumpa di babak yang lebih baik",
    detail: "terima kasih 2025 — hello 2026!",
  },
  {
    year: "2026",
    kicker: "countdown selesai",
    main: "3 · 2 · 1\nProspero Año!",
    sub: "kembang api melintas, mimpi baru dimulai",
    detail: "selamat menikmati malam tahun baru",
  },
  {
    year: "2026",
    kicker: "prolog baru dimulai",
    main: "Bab Baru,\nCerita Baru",
    sub: "365 halaman kosong menantimu",
    detail: "selamat tahun baru 2026 — dari kami untuk kamu",
  },
]

function nyGreetingTpls(): TemplateSpec[] {
  const tpls: TemplateSpec[] = []
  NY_STYLES.forEach((st, si) => {
    NY_CONTENTS.forEach((c, ci) => {
      if ((si + ci) % 2 !== 0) return
      tpls.push({
        slug: `${st.slug}-${ci}`,
        name: `${st.name} · ${ci === 0 ? "Happy New Year" : ci === 1 ? "Countdown" : "Bab Baru"}`,
        category: CAT,
        type: "canvas",
        tags: ["tahun baru", "new year", "2026", "greeting", "instagram"],
        width: IG,
        height: IG,
        build: () =>
          doc("canvas", IG, IG, st.bg, [
            page(st.slug, st.bg, [
              ...(() => {
                const d: DesignElement[] = []
                st.deco(d)
                return d
              })(),
              txt(c.kicker, { x: 0, y: 400, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: st.sub, align: "center", upper: true, ls: 7 }),
              txt(c.year, { x: 0, y: 190, w: IG, h: 210, size: 260, font: F.display, weight: 400, color: st.yearColor, align: "center" }),
              txt(c.main, { x: 90, y: 470, w: IG - 180, h: 250, size: 96, font: st.font, weight: 800, color: st.ink, align: "center", lh: 1.08 }),
              txt(c.sub, { x: 140, y: 750, w: IG - 280, h: 90, size: 30, font: F.body, weight: 400, color: st.sub, align: "center", italic: true, lh: 1.35 }),
              txt(c.detail, { x: 0, y: 960, w: IG, h: 46, size: 25, font: F.sans, weight: 600, color: st.detail, align: "center" }),
            ]),
          ]),
      })
    })
  })
  return tpls
}

/* ============================ NY stories ============================ */

function nyStoryTpls(): TemplateSpec[] {
  const specs: TemplateSpec[] = []
  const styles = [
    {
      slug: "ny-story-firework",
      name: "NY Story — Firework Sky",
      bg: solid("#0b0f1e"),
      ink: GOLD_SOFT,
      sub: "#cbd5e1",
      card: "#111827",
      cardInk: "#e2e8f0",
      accent: GOLD,
      decorate: (d: DesignElement[]) => {
        d.push(img(asset("firework"), { x: 80, y: 100, w: 280, h: 280 }))
        d.push(img(asset("firework-duo"), { x: 560, y: 180, w: 440, h: 293 }))
        d.push(img(asset("firework"), { x: 640, y: 620, w: 220, h: 220, opacity: 0.8 }))
        d.push(img(asset("firework"), { x: 180, y: 660, w: 170, h: 170, opacity: 0.65 }))
        d.push(img(asset("city-skyline"), { x: 0, y: 1720, w: STORY_W, h: 180, opacity: 0.9 }))
      },
    },
    {
      slug: "ny-story-gold",
      name: "NY Story — Gold Luxe",
      bg: solid("#111110"),
      ink: GOLD,
      sub: "#d6d3d1",
      card: "#1c1917",
      cardInk: "#fafaf9",
      accent: GOLD_SOFT,
      decorate: (d: DesignElement[]) => {
        d.push(...cornerOrnaments(50, 50, STORY_W - 100, STORY_H - 100, GOLD))
        d.push(...starScatter(12, 100, 300, 880, 600, GOLD_SOFT, 231))
      },
    },
    {
      slug: "ny-story-neon",
      name: "NY Story — Neon Countdown",
      bg: solid("#09090b"),
      ink: "#22d3ee",
      sub: "#a3e635",
      card: "#18181b",
      cardInk: "#e4e4e7",
      accent: "#db2777",
      decorate: (d: DesignElement[]) => {
        d.push(rect({ x: 50, y: 50, w: STORY_W - 100, h: STORY_H - 100, fill: "transparent", stroke: "#22d3ee", sw: 4, r: 48, dash: [26, 20] }))
        d.push(img(asset("firework"), { x: 380, y: 320, w: 320, h: 320, opacity: 0.5 }))
      },
    },
    {
      slug: "ny-story-pastel",
      name: "NY Story — Pastel Balloons",
      bg: gradient("#c7d2fe", "#fbcfe8", 155),
      ink: "#312e81",
      sub: "#6d28d9",
      card: "#ffffff",
      cardInk: "#4338ca",
      accent: "#7c3aed",
      decorate: (d: DesignElement[]) => {
        d.push(...starScatter(14, 80, 200, 920, 800, "#ffffff", 241))
        d.push(img(asset("confetti"), { x: 90, y: 130, w: 900, h: 450, opacity: 0.85 }))
      },
    },
    {
      slug: "ny-story-sunset",
      name: "NY Story — Sunset Send-off",
      bg: gradient("#f97316", "#be185d", 170),
      ink: "#fff7ed",
      sub: "#ffe4e6",
      card: "#9f1239",
      cardInk: "#ffe4e6",
      accent: "#fde047",
      decorate: (d: DesignElement[]) => {
        d.push(ellipse({ x: 340, y: 420, w: 400, h: 400, fill: "#ffffff", opacity: 0.16 }))
        d.push(img(asset("firework-duo"), { x: 100, y: 900, w: 400, h: 267, opacity: 0.85 }))
        d.push(img(asset("firework"), { x: 700, y: 940, w: 230, h: 230, opacity: 0.85 }))
      },
    },
  ]
  const contents = [
    {
      top: "malam tahun baru",
      main: "2026\nkami\nsiap!",
      sub: "3 · 2 · 1 … selamat tahun baru",
      card: "Nyalakan kembang api, kirim cinta:\nselamat tahun baru untuk semua\nyang pernah jadi bagian cerita kita.",
    },
    {
      top: "prolog baru",
      main: "Happy\nNew\nYear",
      sub: "sampai jumpa di babak yang lebih baik",
      card: "Terima kasih 2025 atas semua pelajaran.\n2026 — mari tulis cerita yang lebih hangat,\nlebih berani, dan lebih ikhlas.",
    },
    {
      top: "hitung mundur",
      main: "10 · 9\n8 · 7\n6 …",
      sub: "siapkan kembang api & angan-angan",
      card: "Kumpul di satu layar, satu jiwa.\nResolusi boleh ditunda, harapan jangan.\nSelamat tahun baru!",
    },
    {
      top: "halaman 1 dari 365",
      main: "Bab\nbaru,\ncerita baru",
      sub: "kita tulis pelan-pelan saja",
      card: "Kata kunci tahun ini: istiqamah.\nSedikit-sedikit tapi terus, ya.\nSelamat tahun baru 2026!",
    },
    {
      top: "salam perpisahan",
      main: "Sampai\njumpa,\n2025",
      sub: "terima kasih sudah jadi guru yang sabar",
      card: "Tahun yang panjang, pelajaran yang besar.\nKita lanjut ke 2026 dengan hati yang lebih\nrindu belajar.",
    },
  ]
  for (let i = 0; i < styles.length; i++) {
    specs.push({
      slug: styles[i].slug,
      name: styles[i].name,
      category: CAT,
      type: "canvas",
      tags: ["story", "tahun baru", "new year", "9:16"],
      width: 1080,
      height: 1920,
      build: () => storyTemplate(styles[i], contents[i], styles[i].decorate),
    })
  }
  return specs
}

const STORY_W = 1080
const STORY_H = 1920

/* ============================ Imlek ============================ */

function imlekTpls(): TemplateSpec[] {
  return [
    {
      slug: "imlek-gongxi-red",
      name: "Imlek — Gong Xi Fa Cai Merah",
      category: CAT,
      type: "canvas",
      tags: ["imlek", "gong xi fa cai", "tahun baru imlek", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#b91c1c"), [
          page("Imlek", solid("#b91c1c"), [
            ellipse({ x: -130, y: -130, w: 400, h: 400, fill: "#dc2626", opacity: 0.9 }),
            ellipse({ x: 810, y: 810, w: 380, h: 380, fill: "#991b1b", opacity: 0.9 }),
            txt("selamat tahun baru imlek 2577", { x: 0, y: 160, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Gong Xi\nFa Cai", { x: 90, y: 260, w: IG - 180, h: 320, size: 150, font: F.pop, weight: 800, color: "#fde68a", align: "center", lh: 1.1 }),
            txt("tahun kuda api — semangat, cepat, dan setia pada tujuan", { x: 130, y: 620, w: IG - 260, h: 90, size: 30, font: F.body, weight: 400, color: "#fee2e2", align: "center", lh: 1.4 }),
            img(asset("lampion"), { x: 80, y: 60, w: 210, h: 252, rotation: -7 }),
            img(asset("lampion"), { x: 790, y: 60, w: 210, h: 252, rotation: 7 }),
            img(asset("firecracker"), { x: 100, y: 750, w: 200, h: 220, rotation: -6 }),
            img(asset("angpao"), { x: 790, y: 750, w: 170, h: 204, rotation: 8 }),
            txt("kesehatan, rezeki, dan kebersamaan — gong xi!", { x: 0, y: 960, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "imlek-gold-lantern",
      name: "Imlek — Gold Lantern Elegant",
      category: CAT,
      type: "canvas",
      tags: ["imlek", "gong xi fa cai", "lampion", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#7f1d1d", "#dc2626", 155), [
          page("Imlek gold", gradient("#7f1d1d", "#dc2626", 155), [
            ...cornerOrnaments(56, 56, IG - 112, IG - 112, GOLD),
            txt("imlek 2577 · tahun kuda", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 7 }),
            txt("Gong\nXi Fa Cai", { x: 90, y: 250, w: IG - 180, h: 300, size: 130, font: F.serif, weight: 700, color: GOLD_SOFT, align: "center", lh: 1.12 }),
            rule(390, 590, 300, GOLD, 6),
            txt("mohon maaf bila ada salah kata dan tingkah —\nselamat menyambut tahun baru imlek", { x: 130, y: 640, w: IG - 260, h: 110, size: 29, font: F.body, weight: 400, color: "#fee2e2", align: "center", lh: 1.4 }),
            img(asset("lampion"), { x: 120, y: 790, w: 190, h: 228 }),
            img(asset("angpao"), { x: 460, y: 800, w: 160, h: 192 }),
            img(asset("gold-coin"), { x: 750, y: 800, w: 190, h: 190 }),
          ]),
        ]),
    },
    {
      slug: "imlek-horse-year",
      name: "Imlek — Tahun Kuda Api Post",
      category: CAT,
      type: "canvas",
      tags: ["imlek", "shio kuda", "2026", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fef2f2"), [
          page("Kuda", solid("#fef2f2"), [
            ellipse({ x: 290, y: 120, w: 500, h: 500, fill: "#fecaca", opacity: 0.7 }),
            txt("馬", { x: 330, y: 140, w: 420, h: 460, size: 330, font: F.serif, weight: 700, color: "#b91c1c", align: "center", vAlign: "middle" }),
            txt("TAHUN KUDA API", { x: 0, y: 640, w: IG, h: 60, size: 44, font: F.pop, weight: 800, color: "#b91c1c", align: "center", ls: 6 }),
            txt("energi, keberanian, dan loyalitas pada tujuan —\nsemoga semua yang dimulai tahun ini sampai", { x: 130, y: 730, w: IG - 260, h: 110, size: 29, font: F.body, weight: 400, color: "#7f1d1d", align: "center", lh: 1.4 }),
            txt("GONG XI FA CAI · 17 FEBRUARI 2026", { x: 0, y: 880, w: IG, h: 50, size: 28, font: F.sans, weight: 700, color: "#dc2626", align: "center", ls: 3 }),
            img(asset("lampion"), { x: 90, y: 90, w: 170, h: 204, rotation: -8 }),
            img(asset("lampion"), { x: 820, y: 90, w: 170, h: 204, rotation: 8 }),
          ]),
        ]),
    },
    {
      slug: "imlek-openhouse-post",
      name: "Imlek — Open House Post",
      category: CAT,
      type: "canvas",
      tags: ["imlek", "open house", "keluarga", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#dc2626"), [
          page("Openhouse", solid("#dc2626"), [
            txt("open house imlek", { x: 0, y: 150, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Makan\nBareng\nImlek", { x: 90, y: 240, w: IG - 180, h: 320, size: 130, font: F.pop, weight: 800, color: "#fde68a", align: "center", lh: 1.08 }),
            rect({ x: 200, y: 610, w: 680, h: 110, fill: "#991b1b", r: 55 }),
            txt("Ahad, 22 Feb 2026 · 11.00 WIB", { x: 200, y: 610, w: 680, h: 110, size: 33, font: F.sans, weight: 700, color: "#fff1f2", align: "center", vAlign: "middle" }),
            txt("Rumah Keluarga Tan · Jl. Pagoda No. 8", { x: 0, y: 750, w: IG, h: 50, size: 29, font: F.sans, weight: 600, color: "#fee2e2", align: "center" }),
            txt("angpao untuk anak-anak, kue keranjang & teh panas untuk semua —\nseluruh tetangga dipersilakan hadir", { x: 130, y: 830, w: IG - 260, h: 110, size: 27, font: F.body, weight: 400, color: "#fecaca", align: "center", lh: 1.4 }),
            img(asset("angpao"), { x: 90, y: 850, w: 170, h: 204, rotation: -8 }),
            img(asset("lampion"), { x: 800, y: 40, w: 190, h: 228, rotation: 8 }),
          ]),
        ]),
    },
    {
      slug: "imlek-story-lampion",
      name: "Imlek Story — Lampion Merah",
      category: CAT,
      type: "canvas",
      tags: ["story", "imlek", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "imlek-story-lampion", bg: solid("#b91c1c"), ink: "#fde68a", sub: "#fecaca", card: "#7f1d1d", cardInk: "#fee2e2", accent: GOLD_SOFT },
          {
            top: "selamat tahun baru imlek 2577",
            main: "Gong\nXi\nFa Cai",
            sub: "tahun kuda api — berlari menuju mimpi",
            card: "Kumpul keluarga, makan bersama,\ndan angpao kecil yang penuh doa.\nGong xi fa cai, salam hangat!",
          },
          (d) => {
            d.push(img(asset("lampion"), { x: 90, y: 100, w: 210, h: 252, rotation: -6 }))
            d.push(img(asset("lampion"), { x: 445, y: 80, w: 210, h: 252 }))
            d.push(img(asset("lampion"), { x: 790, y: 100, w: 210, h: 252, rotation: 6 }))
            d.push(img(asset("firecracker"), { x: 90, y: 1640, w: 210, h: 231 }))
            d.push(img(asset("angpao"), { x: 790, y: 1640, w: 180, h: 216, rotation: 7 }))
          },
        ),
    },
    {
      slug: "imlek-story-angpao",
      name: "Imlek Story — Angpao Promo",
      category: CAT,
      type: "canvas",
      tags: ["story", "imlek", "angpao", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "imlek-story-angpao", bg: gradient("#7f1d1d", "#b91c1c", 165), ink: GOLD_SOFT, sub: "#fecaca", card: "#991b1b", cardInk: "#fee2e2", accent: "#fde047" },
          {
            top: "angpao waktu terbatas",
            main: "Angpao\nKasih\nTerus",
            sub: "belanja pakai kode GONGXI — potongan langsung",
            card: "Berlaku 15–20 Februari 2026\nsemua cabang & online shop.\nSekali lagi: gong xi fa cai!",
          },
          (d) => {
            d.push(img(asset("angpao"), { x: 330, y: 260, w: 420, h: 504, rotation: -4 }))
            d.push(img(asset("gold-coin"), { x: 130, y: 520, w: 180, h: 180 }))
            d.push(img(asset("gold-coin"), { x: 770, y: 480, w: 160, h: 160 }))
          },
        ),
    },
    {
      slug: "imlek-banner-klenteng",
      name: "Spanduk Imlek Kelurahan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "imlek", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "imlek-banner-klenteng", bg: solid("#b91c1c"), strip: GOLD, ink: "#fff1f2", accent: GOLD_SOFT, sub: "#fecaca" },
          {
            left: "SELAMAT\nTAHUN BARU\nIMLEK 2577",
            main: "Gong Xi\nFa Cai",
            sub: "Keluarga besar Kelurahan Pagoda Sari menyucapkan selamat tahun baru — semoga tahun kuda membawa kemakmuran",
            right: "Puncak perayaan:\n17 Feb 2026 · pagelaran\nalun-alun 19.00 WIB",
          },
          (els) => {
            els.push(img(asset("lampion"), { x: 90, y: 300, w: 200, h: 240, rotation: -7 }))
            els.push(img(asset("lampion"), { x: 1690, y: 300, w: 200, h: 240, rotation: 7 }))
            els.push(img(asset("firecracker"), { x: 500, y: 360, w: 180, h: 198 }))
          },
        ),
    },
    {
      slug: "imlek-banner-vihara",
      name: "Spanduk Salam Vihara & Keluarga",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "imlek", "keluarga", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "imlek-banner-vihara", bg: gradient("#7f1d1d", "#dc2626", 120), strip: "#fde68a", ink: "#fff7ed", accent: "#fde68a", sub: "#fecaca" },
          {
            left: "KELUARGA\nBESAR TAN",
            main: "Open House\nImlek 2577",
            sub: "Ahad, 22 Februari 2026 · 11.00 WIB — Jl. Pagoda No. 8 · seluruh warga dipersilakan",
            right: "Makan bareng,\nangpao anak,\nbarang antik pameran",
          },
          (els) => {
            els.push(img(asset("angpao"), { x: 90, y: 300, w: 190, h: 228, rotation: -8 }))
            els.push(img(asset("gold-coin"), { x: 1700, y: 330, w: 190, h: 190 }))
          },
        ),
    },
  ]
}

/* ============================ Hijriah new year ============================ */

function hijriTpls(): TemplateSpec[] {
  return [
    {
      slug: "hijri-1448-emerald",
      name: "Tahun Baru Hijriah 1448 H — Post",
      category: CAT,
      type: "canvas",
      tags: ["tahun baru hijriah", "muharram", "islamic", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid(EMERALD_DEEP2), [
          page("Hijriah", solid(EMERALD_DEEP2), [
            ...cornerOrnaments(60, 60, IG - 120, IG - 120, GOLD),
            txt("1 muharram 1448 h", { x: 0, y: 180, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 7 }),
            txt("1448", { x: 0, y: 260, w: IG, h: 260, size: 300, font: F.display, weight: 400, color: GOLD_SOFT, align: "center" }),
            txt("Selamat Tahun Baru Hijriah", { x: 0, y: 560, w: IG, h: 60, size: 40, font: F.pop, weight: 700, color: "#ecfdf5", align: "center" }),
            txt("“Sesungguhnya penghitungan waktu di sisi Allah\nadalah 12 bulan.” — QS. At-Taubah: 36", { x: 130, y: 650, w: IG - 260, h: 110, size: 28, font: F.body, weight: 400, color: "#a7f3d0", align: "center", italic: true, lh: 1.4 }),
            img(asset("mosque"), { x: 240, y: 800, w: 600, h: 300, opacity: 0.5 }),
            ...crescentShape(90, 90, 140, GOLD_SOFT, EMERALD_DEEP2),
          ]),
        ]),
    },
    {
      slug: "hijri-muharram-asyura",
      name: "Muharram & Asyura — Info Post",
      category: CAT,
      type: "canvas",
      tags: ["muharram", "asyura", "puasa sunnah", "islamic"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#f0fdf4"), [
          page("Muharram", solid("#f0fdf4"), [
            rect({ x: 0, y: 0, w: IG, h: 230, fill: EMERALD }),
            txt("AMAL PEMBUKA TAHUN", { x: 0, y: 70, w: IG, h: 60, size: 42, font: F.pop, weight: 800, color: "#ecfdf5", align: "center" }),
            txt("bulan muharram 1448 h", { x: 0, y: 145, w: IG, h: 40, size: 25, font: F.sans, weight: 500, color: "#a7f3d0", align: "center" }),
            ...[
              ["1 Muharram", "Tahun baru hijriah — mari muhasabah"],
              ["9 Muharram", "Puasa Tasu'a (sunnah)"],
              ["10 Muharram", "Puasa Asyura — menghapus dosa setahun lalu"],
              ["Sebulan", "Rutin sedekah — amal paling dicintai di bulan ini"],
            ].flatMap(([t, dsc], i) => {
              const y = 290 + i * 140
              return [
                rect({ x: 80, y, w: IG - 160, h: 110, fill: i % 2 ? "#dcfce7" : "#ffffff", stroke: "#bbf7d0", sw: 2, r: 16 }),
                txt(t, { x: 115, y, w: 260, h: 110, size: 30, font: F.sans, weight: 700, color: EMERALD_DEEP2, vAlign: "middle" }),
                txt(dsc, { x: 385, y, w: IG - 500, h: 110, size: 25, font: F.sans, weight: 500, color: "#166534", vAlign: "middle", lh: 1.3 }),
              ] as DesignElement[]
            }),
            txt("“Sebaik-baik shaum setelah Ramadan adalah shaum di bulan Allah, Muharram.”", { x: 100, y: 880, w: IG - 200, h: 100, size: 26, font: F.body, weight: 400, color: "#166534", align: "center", italic: true, lh: 1.4 }),
          ]),
        ]),
    },
    {
      slug: "hijri-story-1448",
      name: "Hijriah Story — 1448 H",
      category: CAT,
      type: "canvas",
      tags: ["story", "hijriah", "muharram", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "hijri-story-1448", bg: solid(EMERALD_DEEP2), ink: GOLD_SOFT, sub: "#6ee7b7", card: "#052e21", cardInk: "#d1fae5", accent: GOLD },
          {
            top: "1 muharram 1448 h",
            main: "Tahun\nBaru\nHijriah",
            sub: "semoga lebih baik dari tahun lalu",
            card: "Pembuka tahun: muhasabah, tobat, dan\npuasa Tasu'a–Asyura.\nSemoga 1448 H jadi tahun kebangkitan kita.",
          },
          (d) => {
            d.push(...crescentShape(690, 240, 240, GOLD_SOFT, EMERALD_DEEP2))
            d.push(img(asset("mosque"), { x: 90, y: 1660, w: 900, h: 225, opacity: 0.75 }))
            d.push(...starScatter(10, 90, 200, 900, 400, GOLD_SOFT, 251))
          },
        ),
    },
    {
      slug: "hijri-banner-masjid",
      name: "Spanduk Tahun Baru Hijriah",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "hijriah", "masjid", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "hijri-banner-masjid", bg: solid(EMERALD_DEEP2), strip: GOLD, ink: "#ecfdf5", accent: GOLD_SOFT, sub: "#a7f3d0" },
          {
            left: "MASJID\nAL-IKHLAS",
            main: "Tahun Baru\nHijriah 1448 H",
            sub: "Selamat menyambut 1 Muharram — mari mulai dengan muhasabah dan amal kebaikan",
            right: "Kajian pembuka:\nAhad ba'da Maghrib\nkitab sejarah hijrah",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 70, y: 320, w: 350, h: 210, opacity: 0.85 }))
            els.push(...crescentShape(1690, 70, 150, GOLD_SOFT, EMERALD_DEEP2))
          },
        ),
    },
  ]
}

const EMERALD_DEEP2 = "#064e3b"

/* ============================ resolusi & refleksi ============================ */

function resolutionTpls(): TemplateSpec[] {
  return [
    {
      slug: "resolusi-checklist",
      name: "Resolusi 2026 — Checklist Post",
      category: CAT,
      type: "canvas",
      tags: ["resolusi", "2026", "target", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fffbeb"), [
          page("Resolusi", solid("#fffbeb"), [
            rect({ x: 0, y: 0, w: IG, h: 210, fill: "#f59e0b" }),
            txt("RESOLUSI 2026", { x: 0, y: 60, w: IG, h: 70, size: 56, font: F.display, weight: 400, color: "#78350f", align: "center", ls: 5 }),
            txt("coret satu-satu, jangan cuma jadi wishful thinking", { x: 0, y: 250, w: IG, h: 44, size: 25, font: F.hand, weight: 400, color: "#92400e", align: "center" }),
            ...[
              "Baca 12 buku (1 sebulan aja, realistis)",
              "Tidur sebelum 23.00 di hari kerja",
              "Olahraga 3× seminggu — yang ringan pun jadi",
              "Nabung 20% dari tiap pemasukan",
              "Rajin mengaji & jaga shalat lima waktu",
              "Video call emak minimal seminggu sekali",
            ].flatMap((item, i) => {
              const y = 330 + i * 108
              return [
                rect({ x: 100, y, w: IG - 200, h: 84, fill: "#ffffff", stroke: "#fde68a", sw: 3, r: 16 }),
                rect({ x: 130, y: y + 20, w: 44, h: 44, fill: "transparent", stroke: "#f59e0b", sw: 4, r: 8 }),
                txt(item, { x: 210, y, w: IG - 340, h: 84, size: 27, font: F.sans, weight: 500, color: "#78350f", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("salin, edit, dan isi resolusimu sendiri!", { x: 0, y: 1000, w: IG, h: 44, size: 25, font: F.hand, weight: 400, color: "#b45309", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "resolusi-word-of-year",
      name: "Kata Kunci Tahun Ini — Post",
      category: CAT,
      type: "canvas",
      tags: ["resolusi", "word of the year", "refleksi", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#111827"), [
          page("Word", solid("#111827"), [
            txt("kata kunci 2026", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#9ca3af", align: "center", upper: true, ls: 8 }),
            txt("ISTIQAMAH", { x: 0, y: 300, w: IG, h: 180, size: 150, font: F.display, weight: 400, color: GOLD_SOFT, align: "center", ls: 4 }),
            rule(440, 530, 200, GOLD, 5),
            txt("bukan mulai yang hebat,\ntapi terus-terusan dalam yang sederhana.", { x: 140, y: 580, w: IG - 280, h: 130, size: 36, font: F.body, weight: 400, color: "#e5e7eb", align: "center", italic: true, lh: 1.45 }),
            ...starScatter(9, 120, 120, 840, 300, "#fde68a", 261),
            txt("apa kata kuncimu tahun ini? tulis di komentar", { x: 0, y: 940, w: IG, h: 46, size: 26, font: F.hand, weight: 400, color: "#9ca3af", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "resolusi-goal-grid",
      name: "Target 2026 — 6 Kotak Post",
      category: CAT,
      type: "canvas",
      tags: ["target", "goal", "2026", "planning", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const goals: [string, string][] = [
          ["Kesehatan", "172 jam olahraga"],
          ["Keuangan", "dana darurat 6 bulan"],
          ["Ilmu", "12 buku & 4 kursus"],
          ["Keluarga", "1 trip bareng tahun ini"],
          ["Rohani", "khatam 1× + rutin sedekah"],
          ["Karier", "portofolio baru, naik kelas"],
        ]
        return doc("canvas", IG, IG, solid("#f8fafc"), [
          page("Goals", solid("#f8fafc"), [
            txt("TARGET 2026", { x: 0, y: 90, w: IG, h: 90, size: 80, font: F.display, weight: 400, color: "#0f172a", align: "center", ls: 4 }),
            txt("enam bidang, enam target, satu tahun", { x: 0, y: 200, w: IG, h: 44, size: 25, font: F.sans, weight: 500, color: "#64748b", align: "center" }),
            ...goals.flatMap(([title, detail], i) => {
              const x = 90 + (i % 2) * 460
              const y = 290 + Math.floor(i / 2) * 240
              return [
                rect({ x, y, w: 440, h: 210, fill: "#ffffff", stroke: "#e2e8f0", sw: 2, r: 20 }),
                ellipse({ x: x + 30, y: y + 28, w: 56, h: 56, fill: ["#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"][i] }),
                txt(String(i + 1), { x: x + 30, y: y + 28, w: 56, h: 56, size: 30, font: F.pop, weight: 800, color: "#ffffff", align: "center", vAlign: "middle" }),
                txt(title, { x: x + 30, y: y + 100, w: 380, h: 50, size: 30, font: F.sans, weight: 700, color: "#0f172a" }),
                txt(detail, { x: x + 30, y: y + 150, w: 380, h: 44, size: 23, font: F.sans, weight: 500, color: "#64748b" }),
              ] as DesignElement[]
            }),
            txt("revisi targetmu — semua kotak bisa diedit", { x: 0, y: 1030, w: IG, h: 44, size: 24, font: F.hand, weight: 400, color: "#94a3b8", align: "center" }),
          ]),
        ])
      },
    },
    {
      slug: "resolusi-gratitude",
      name: "Terima Kasih 2025 — Gratitude Post",
      category: CAT,
      type: "canvas",
      tags: ["gratitude", "refleksi", "2025", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#fbbf24", "#f97316", 160), [
          page("Gratitude", gradient("#fbbf24", "#f97316", 160), [
            ellipse({ x: -110, y: 700, w: 320, h: 320, fill: "#ffffff", opacity: 0.2 }),
            ellipse({ x: 850, y: -100, w: 300, h: 300, fill: "#ffffff", opacity: 0.2 }),
            txt("sebelum pamit", { x: 0, y: 180, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: "#fffbeb", align: "center", upper: true, ls: 6 }),
            txt("Terima\nKasih 2025", { x: 90, y: 280, w: IG - 180, h: 300, size: 120, font: F.serif, weight: 700, color: "#7c2d12", align: "center", lh: 1.12 }),
            txt("untuk semua yang bertahan, memaafkan,\ndan tetap berbagi — kamu hebat.", { x: 140, y: 620, w: IG - 280, h: 110, size: 30, font: F.body, weight: 400, color: "#fff7ed", align: "center", lh: 1.4 }),
            txt("sepuluh hal yang disyukuri tahun ini:", { x: 140, y: 760, w: IG - 280, h: 46, size: 26, font: F.sans, weight: 600, color: "#7c2d12", align: "center" }),
            txt("napas, keluarga, sahabat, rezeki, kesehatan,\nrumah, pekerjaan, doa yang dikabulkan,\nkesempatan kedua, dan cinta yang tumbuh.", { x: 160, y: 820, w: IG - 320, h: 150, size: 27, font: F.hand, weight: 400, color: "#fffbeb", align: "center", lh: 1.5 }),
          ]),
        ]),
    },
    {
      slug: "resolusi-letter-story",
      name: "Surat untuk Diriku — Story",
      category: CAT,
      type: "canvas",
      tags: ["story", "refleksi", "surat", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "resolusi-letter-story", bg: solid("#fdf6ec"), ink: "#78350f", sub: "#b45309", card: "#fffbeb", cardInk: "#92400e", accent: "#d6bd7b" },
          {
            top: "31 desember, 23.47 wib",
            main: "Surat\nuntuk\nDiriku",
            sub: "tahun depan pasti lebih lembut",
            card: "Hei, kamu yang membaca ini di 2026:\nterima kasih sudah bertahan.\nTahun ini kita pelan-pelan saja —\nyang penting tetap jalan.",
          },
          (d) => {
            d.push(rect({ x: 40, y: 40, w: STORY_W - 80, h: STORY_H - 80, fill: "transparent", stroke: "#d6bd7b", sw: 3, r: 18 }))
            d.push(img(asset("frame-tape"), { x: 290, y: 200, w: 500, h: 500, opacity: 0.9, rotation: 3 }))
            d.push(...starScatter(7, 120, 1400, 840, 220, "#fde68a", 271))
          },
        ),
    },
    {
      slug: "resolusi-habits-story",
      name: "Kebiasaan Baru — Story Tracker",
      category: CAT,
      type: "canvas",
      tags: ["story", "habits", "tracker", "9:16"],
      width: 1080,
      height: 1920,
      build: () => {
        const habits = ["bangun 05.00", "baca 10 halaman", "olahraga", "jurnal syukur", "tanpa doomscroll", "sedekah harian"]
        return doc("canvas", 1080, 1920, solid("#0f172a"), [
          page("Habits", solid("#0f172a"), [
            txt("kebiasaan baru, pekan 1", { x: 0, y: 150, w: STORY_W, h: 46, size: 27, font: F.sans, weight: 600, color: "#94a3b8", align: "center", upper: true, ls: 5 }),
            txt("Tracker\nHarian", { x: 90, y: 230, w: STORY_W - 180, h: 190, size: 96, font: F.display, weight: 400, color: "#f8fafc", align: "center", lh: 1.05 }),
            ...habits.flatMap((h, i) => {
              const y = 480 + i * 150
              return [
                rect({ x: 90, y, w: STORY_W - 180, h: 120, fill: "#1e293b", r: 18 }),
                txt(h, { x: 130, y, w: 420, h: 120, size: 32, font: F.sans, weight: 600, color: "#e2e8f0", vAlign: "middle" }),
                ...Array.from({ length: 7 }, (_, d) => ellipse({ x: 590 + d * 62, y: y + 38, w: 44, h: 44, fill: "transparent", stroke: "#475569", sw: 3 })),
              ] as DesignElement[]
            }),
            txt("centang tiap hari — tangkapan layar & tulis progresmu", { x: 0, y: 1760, w: STORY_W, h: 50, size: 27, font: F.hand, weight: 400, color: "#64748b", align: "center" }),
          ]),
        ])
      },
    },
  ]
}

/* ============================ kalender ============================ */

function calendarTpls(): TemplateSpec[] {
  const months: [string, number, number][] = [
    ["Januari", 31, 3], ["Februari", 28, 6], ["Maret", 31, 6],
    ["April", 30, 2], ["Mei", 31, 4], ["Juni", 30, 0],
    ["Juli", 31, 2], ["Agustus", 31, 5], ["September", 30, 1],
    ["Oktober", 31, 3], ["November", 30, 6], ["Desember", 31, 1],
  ]
  const monthCard = (m: [string, number, number], x: number, y: number): DesignElement[] => {
    const [name, days, firstDay] = m
    const els: DesignElement[] = [
      rect({ x, y, w: 260, h: 330, fill: "#ffffff", stroke: "#e2e8f0", sw: 2, r: 14 }),
      txt(name, { x: x + 16, y: y + 14, w: 230, h: 40, size: 26, font: F.pop, weight: 700, color: "#0f172a" }),
      rule(x + 16, y + 62, 228, "#e2e8f0", 2),
    ]
    const cw = 34
    const dows = ["S", "S", "R", "K", "J", "S", "M"]
    dows.forEach((dw, i) => {
      els.push(txt(dw, { x: x + 16 + i * cw, y: y + 72, w: cw, h: 26, size: 17, font: F.sans, weight: 700, color: "#94a3b8", align: "center" }))
    })
    for (let d = 1; d <= Number(days); d++) {
      const idx = Number(firstDay) + d - 1
      const row = Math.floor(idx / 7)
      const col = idx % 7
      els.push(
        txt(String(d), {
          x: x + 16 + col * cw, y: y + 104 + row * 32, w: cw, h: 28,
          size: 17, font: F.sans, weight: 400, color: "#334155", align: "center",
        }),
      )
    }
    return els
  }
  return [
    {
      slug: "kalender-2026-a4",
      name: "Kalender Dinding 2026 (A4)",
      category: CAT,
      type: "canvas",
      tags: ["kalender", "2026", "a4", "print"],
      width: A4W,
      height: A4H,
      build: () =>
        doc("canvas", A4W, A4H, solid("#f8fafc"), [
          page("Kalender 2026", solid("#f8fafc"), [
            txt("2026", { x: 0, y: 70, w: A4W, h: 150, size: 140, font: F.display, weight: 400, color: "#0f172a", align: "center" }),
            txt("kalender dinding keluarga — tandai tanggal pentingmu", { x: 0, y: 230, w: A4W, h: 44, size: 26, font: F.sans, weight: 500, color: "#64748b", align: "center" }),
            ...months.flatMap((m, i) => monthCard(m, 90 + (i % 4) * 280, 330 + Math.floor(i / 4) * 370)),
            txt("cetak & tempel di lemari es — kalender paling jujur di rumah", { x: 0, y: 1520, w: A4W, h: 46, size: 25, font: F.hand, weight: 400, color: "#94a3b8", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "kalender-januari-post",
      name: "Kalender Januari 2026 — Post",
      category: CAT,
      type: "canvas",
      tags: ["kalender", "januari", "2026", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#1e293b"), [
          page("Januari", solid("#1e293b"), [
            txt("JANUARI", { x: 0, y: 80, w: IG, h: 90, size: 90, font: F.display, weight: 400, color: "#f8fafc", align: "center", ls: 6 }),
            txt("2026", { x: 0, y: 180, w: IG, h: 60, size: 40, font: F.sans, weight: 600, color: GOLD_SOFT, align: "center", ls: 10 }),
            ...Array.from({ length: 6 }, (_, r) =>
              Array.from({ length: 7 }, (_, c) => {
                const d = (r - 1) * 7 + c - 2
                return { r, c, d }
              }),
            ).flat().flatMap(({ r, c, d }) => {
              const els: DesignElement[] = []
              const x = 120 + c * 122
              const y = 280 + r * 110
              if (r === 0) {
                els.push(txt(["M", "S", "S", "R", "K", "J", "S"][c], { x, y, w: 100, h: 40, size: 26, font: F.sans, weight: 700, color: "#94a3b8", align: "center" }))
              } else if (d >= 1 && d <= 31) {
                els.push(rect({ x, y: y + 8, w: 100, h: 86, fill: d === 1 ? "#f59e0b" : "transparent", r: 14 }))
                els.push(txt(String(d), { x, y: y + 8, w: 100, h: 86, size: 32, font: F.sans, weight: d === 1 ? 700 : 400, color: d === 1 ? "#78350f" : "#e2e8f0", align: "center", vAlign: "middle" }))
              }
              return els
            }),
            txt("1 Januari — awal yang lembut. selamat tahun baru!", { x: 0, y: 950, w: IG, h: 46, size: 26, font: F.hand, weight: 400, color: "#94a3b8", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "kalender-meja-desk",
      name: "Kalender Meja 2026 — Deska pad",
      category: CAT,
      type: "canvas",
      tags: ["kalender", "meja", "2026", "print"],
      width: 1600,
      height: 900,
      build: () =>
        doc("canvas", 1600, 900, solid("#fffbeb"), [
          page("Desk", solid("#fffbeb"), [
            rect({ x: 0, y: 0, w: 560, h: 900, fill: "#f59e0b" }),
            txt("2026", { x: 60, y: 300, w: 440, h: 170, size: 150, font: F.display, weight: 400, color: "#78350f", align: "center" }),
            txt("kalender meja", { x: 60, y: 500, w: 440, h: 50, size: 30, font: F.sans, weight: 600, color: "#fffbeb", align: "center", upper: true, ls: 6 }),
            txt("tulis target & batalkan yang selesai —\ntahun ini jadi arsip kebanggaan", { x: 60, y: 600, w: 440, h: 110, size: 24, font: F.hand, weight: 400, color: "#fffbeb", align: "center", lh: 1.45 }),
            ...["Jan–Mar", "Apr–Jun", "Jul–Sep", "Okt–Des"].flatMap((q, i) => [
              rect({ x: 640 + (i % 2) * 470, y: 90 + Math.floor(i / 2) * 360, w: 440, h: 320, fill: "#ffffff", stroke: "#fde68a", sw: 3, r: 18 }),
              txt(q, { x: 680 + (i % 2) * 470, y: 130 + Math.floor(i / 2) * 360, w: 360, h: 60, size: 34, font: F.pop, weight: 700, color: "#92400e" }),
              txt("• ………………\n• ………………\n• ………………", { x: 680 + (i % 2) * 470, y: 210 + Math.floor(i / 2) * 360, w: 360, h: 160, size: 26, font: F.mono, weight: 400, color: "#b45309", lh: 1.5 }),
            ] as DesignElement[]),
          ]),
        ]),
    },
  ]
}

/* ============================ banners ============================ */

function nyBannerTpls(): TemplateSpec[] {
  return [
    {
      slug: "ny-banner-happy",
      name: "Spanduk Happy New Year 2026",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "tahun baru", "2026", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "ny-banner-happy", bg: solid("#0b0f1e"), strip: GOLD, ink: "#fffbeb", accent: GOLD_SOFT, sub: "#cbd5e1" },
          {
            left: "SELAMAT\nTAHUN BARU",
            main: "2026 —\nMulai Lagi, Lebih Baik",
            sub: "Warga Perumahan Griya Asri menyucapkan selamat tahun baru — malam ini: mercon dari atap & doa dari hati",
            right: "Karnaval titik nol\n31 Des · 21.00 WIB\npanggung terbuka",
          },
          (els) => {
            els.push(img(asset("firework"), { x: 90, y: 320, w: 230, h: 230 }))
            els.push(img(asset("firework-duo"), { x: 1520, y: 90, w: 380, h: 253 }))
            els.push(img(asset("city-skyline"), { x: 560, y: 470, w: 800, h: 160, opacity: 0.6 }))
          },
        ),
    },
    {
      slug: "ny-banner-neighborhood",
      name: "Spanduk Karnaval Tahun Baru",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "karnaval", "tahun baru", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "ny-banner-neighborhood", bg: gradient("#312e81", "#1e1b4b", 120), strip: "#fde047", ink: "#fef9c3", accent: "#c4b5fd", sub: "#e0e7ff" },
          {
            left: "KARNAVAL\nTITIK NOL",
            main: "Countdown\n31 Desember",
            sub: "21.00 WIB — panggung hiburan, kuliner jajanan warga, dan kembang api penutup tahun",
            right: "Alun-alun kota\nacara gratis\nbawa keluarga",
          },
          (els) => {
            els.push(img(asset("confetti"), { x: 550, y: 60, w: 700, h: 350, opacity: 0.8 }))
            els.push(img(asset("firework"), { x: 1650, y: 330, w: 220, h: 220 }))
          },
        ),
    },
    {
      slug: "imlek-banner-tahun-kuda",
      name: "Spanduk Imlek Tahun Kuda",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "imlek", "kuda", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "imlek-banner-tahun-kuda", bg: solid("#dc2626"), strip: GOLD, ink: "#fff1f2", accent: GOLD_SOFT, sub: "#fecaca" },
          {
            left: "GONG XI\nFA CAI",
            main: "Imlek 2577\nTahun Kuda Api",
            sub: "Pasar malam imlek: kuliner, panggung barongsai, dan bagi-bagi angpao — seluruh warga dipersilakan",
            right: "Alun-alun Pagoda\n14–16 Feb 2026\nmulai 17.00 WIB",
          },
          (els) => {
            els.push(img(asset("lampion"), { x: 90, y: 300, w: 210, h: 252, rotation: -6 }))
            els.push(img(asset("lampion"), { x: 1660, y: 300, w: 210, h: 252, rotation: 6 }))
            els.push(img(asset("firecracker"), { x: 560, y: 370, w: 170, h: 187 }))
          },
        ),
    },
    {
      slug: "ny-banner-closing-year",
      name: "Spanduk Tutup Tahun Sekolah",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "tutup tahun", "sekolah", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "ny-banner-closing-year", bg: solid("#f8fafc"), strip: "#0f172a", ink: "#0f172a", accent: "#7c3aed", sub: "#475569" },
          {
            left: "SMA N 1\nHARAPAN",
            main: "Sampai Jumpa\nTahun Depan!",
            sub: "Pengumuman nilai: 20 Desember · Awal semester baru: 5 Januari 2026 — jaga diri ya semua",
            right: "Kelas dibuka\n05 Jan 2026\n07.00 WIB upacara",
          },
          (els) => {
            els.push(img(asset("confetti"), { x: 1300, y: 60, w: 560, h: 280, opacity: 0.9 }))
            els.push(img(asset("pencil"), { x: 100, y: 320, w: 200, h: 200, rotation: -10 }))
          },
        ),
    },
  ]
}

/* ============================ export ============================ */

export const SEASONAL_NEWYEAR_TPLS: TemplateSpec[] = [
  ...nyGreetingTpls(),
  ...nyStoryTpls(),
  ...imlekTpls(),
  ...hijriTpls(),
  ...resolutionTpls(),
  ...calendarTpls(),
  ...nyBannerTpls(),
]
