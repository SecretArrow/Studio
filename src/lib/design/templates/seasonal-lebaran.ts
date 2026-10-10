/**
 * Seasonal pack — Ramadan & Lebaran (Idulfitri / Iduladha).
 * ----------------------------------------------------------
 * 50 original editable templates: greeting posts, Ramadan posts, takbir/Eid posts,
 * stories, spanduk banners, A4 open-house posters, hampers labels.
 * Design language follows Indonesian Ramadan/Lebaran poster conventions researched
 * from live template galleries: ketupat, mosque silhouettes, lanterns, crescent moons,
 * emerald + gold + night-blue palettes, transliterated Arabic greetings.
 */
import {
  asset,
  doc,
  ellipse,
  F,
  img,
  page,
  rect,
  rule,
  shp,
  solid,
  gradient,
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
  EMERALD_DEEP,
  GOLD,
  GOLD_SOFT,
  IG,
  NIGHT,
  banner,
  cornerOrnaments,
  crescentShape,
  eventPoster,
  greetingPost,
  hangingKetupat,
  starScatter,
  storyTemplate,
  type GreetStyle,
} from "./seasonal-shared"

const CAT = "seasonal"
const STORY_W = 1080
const STORY_H = 1920

/* ============================ 1. Lebaran greeting posts ============================ */

const LEBA_POST_STYLES: GreetStyle[] = [
  {
    slug: "leba-emerald-gold-post",
    name: "Emerald Gold — Lebaran Post",
    bg: solid(EMERALD_DEEP),
    band: "#052e21",
    titleColor: GOLD_SOFT,
    subColor: "#a7f3d0",
    detailColor: "#d1fae5",
    titleFont: F.serif,
    titleSize: 108,
    decorate: (els) => {
      els.push(...cornerOrnaments(70, 70, IG - 140, IG - 140, GOLD))
      els.push(...crescentShape(700, 120, 190, GOLD_SOFT, EMERALD_DEEP))
      els.push(shp("star", { x: 640, y: 150, w: 46, h: 46, fill: GOLD_SOFT, rotation: 12 }))
      els.push(img(asset("ketupat-duo"), { x: 90, y: 800, w: 210, h: 210, rotation: -8 }))
      els.push(img(asset("ketupat-duo"), { x: 790, y: 810, w: 190, h: 190, rotation: 7 }))
    },
  },
  {
    slug: "leba-night-mosque-post",
    name: "Night Mosque — Lebaran Post",
    bg: gradient("#0b1226", "#1e1b4b", 165),
    band: "#0b1226",
    titleColor: "#fef9c3",
    subColor: "#c7d2fe",
    detailColor: "#e0e7ff",
    titleFont: F.display,
    titleSize: 150,
    upper: true,
    ls: 4,
    decorate: (els) => {
      els.push(img(asset("mosque"), { x: 40, y: 830, w: 1000, h: 250, opacity: 0.9 }))
      els.push(img(asset("lantern"), { x: 60, y: 60, w: 190, h: 247, rotation: -6 }))
      els.push(img(asset("lantern"), { x: 830, y: 90, w: 170, h: 221, rotation: 6 }))
      els.push(...crescentShape(770, 130, 150, "#fef9c3", "#0b1226"))
    },
  },
  {
    slug: "leba-cream-teal-post",
    name: "Cream Elegant — Lebaran Post",
    bg: solid("#fbf7ec"),
    band: "#0f766e",
    titleColor: "#115e59",
    subColor: "#0f766e",
    detailColor: "#ecfdf5",
    titleFont: F.serif,
    titleSize: 112,
    decorate: (els) => {
      els.push(...cornerOrnaments(60, 60, IG - 120, IG - 120, "#d6bd7b"))
      els.push(img(asset("arch-ornament"), { x: 330, y: 96, w: 420, h: 525, opacity: 0.5 }))
      els.push(img(asset("tasbih"), { x: 840, y: 100, w: 150, h: 195, rotation: 14 }))
    },
  },
  {
    slug: "leba-violet-lantern-post",
    name: "Violet Lantern — Lebaran Post",
    bg: gradient("#4c1d95", "#7e22ce", 150),
    band: "#3b0764",
    titleColor: "#fde68a",
    subColor: "#e9d5ff",
    detailColor: "#f3e8ff",
    titleFont: F.pop,
    titleSize: 118,
    decorate: (els) => {
      els.push(img(asset("lantern"), { x: 110, y: 70, w: 180, h: 234, rotation: -8 }))
      els.push(img(asset("lantern"), { x: 780, y: 110, w: 160, h: 208, rotation: 9 }))
      els.push(...starScatter(9, 80, 80, 920, 320, "#fde68a", 11))
      els.push(ellipse({ x: -110, y: 740, w: 300, h: 300, fill: "#8b5cf6", opacity: 0.35 }))
    },
  },
  {
    slug: "leba-ivory-maroon-post",
    name: "Ivory Maroon — Lebaran Post",
    bg: solid("#fdf6ec"),
    band: "#7f1d1d",
    titleColor: "#7f1d1d",
    subColor: "#a16207",
    detailColor: "#fef3c7",
    titleFont: F.body,
    titleSize: 104,
    decorate: (els) => {
      els.push(rect({ x: 56, y: 56, w: IG - 112, h: IG - 112, fill: "transparent", stroke: "#b45309", sw: 4, r: 18 }))
      els.push(rect({ x: 72, y: 72, w: IG - 144, h: IG - 144, fill: "transparent", stroke: "#d6bd7b", sw: 2, r: 12 }))
      els.push(img(asset("crescent-star"), { x: 80, y: 84, w: 150, h: 150, rotation: -10 }))
      els.push(img(asset("crescent-star"), { x: 850, y: 830, w: 150, h: 150, rotation: 170 }))
    },
  },
  {
    slug: "leba-mint-fresh-post",
    name: "Mint Fresh — Lebaran Post",
    bg: gradient("#d1fae5", "#a7f3d0", 145),
    band: "#065f46",
    titleColor: EMERALD_DEEP,
    subColor: EMERALD,
    detailColor: "#ecfdf5",
    titleFont: F.pop,
    titleSize: 122,
    decorate: (els) => {
      els.push(img(asset("ketupat"), { x: 96, y: 96, w: 190, h: 228, rotation: -10 }))
      els.push(img(asset("ketupat"), { x: 806, y: 120, w: 170, h: 204, rotation: 9 }))
      els.push(...starScatter(7, 120, 120, 840, 260, "#ffffff", 21))
    },
  },
  {
    slug: "leba-gold-frame-post",
    name: "Gold Frame — Lebaran Post",
    bg: solid("#101d16"),
    band: "#0a130e",
    titleColor: GOLD,
    subColor: "#d1d5db",
    detailColor: GOLD_SOFT,
    titleFont: F.serif,
    titleSize: 114,
    decorate: (els) => {
      els.push(rect({ x: 48, y: 48, w: IG - 96, h: IG - 96, fill: "transparent", stroke: GOLD, sw: 6, r: 6 }))
      els.push(shp("diamond", { x: 496, y: 130, w: 88, h: 88, fill: GOLD, rotation: 0 }))
      els.push(shp("diamond", { x: 496, y: 796, w: 88, h: 88, fill: GOLD, rotation: 0 }))
      els.push(...starScatter(8, 100, 100, 880, 300, GOLD_SOFT, 5))
    },
  },
  {
    slug: "leba-sunrise-post",
    name: "Sunrise Takbir — Lebaran Post",
    bg: gradient("#f59e0b", "#dc2626", 160),
    band: "#7f1d1d",
    titleColor: "#fffbeb",
    subColor: "#fef3c7",
    detailColor: "#fef3c7",
    titleFont: F.display,
    titleSize: 150,
    upper: true,
    decorate: (els) => {
      els.push(img(asset("sunburst"), { x: 290, y: 210, w: 500, h: 500, opacity: 0.5 }))
      els.push(img(asset("mosque"), { x: 90, y: 812, w: 900, h: 225, opacity: 0.25 }))
      els.push(img(asset("bedug"), { x: 76, y: 90, w: 180, h: 164, rotation: -7 }))
    },
  },
]

const LEBA_GREETINGS = [
  {
    kicker: "1447 H · Eid al-Fitr",
    title: "Selamat\nHari Raya\nIdulfitri",
    sub: "Minal Aidin wal Faizin",
    detail: "Mohon maaf lahir dan batin —\nsemoga kita kembali fitri",
  },
  {
    kicker: "Taqabbalallahu minna wa minkum",
    title: "Eid\nMubarak",
    sub: "Semoga barokah untuk kita semua",
    detail: "From our family to yours —\nselamat hari raya, maaf lahir batin",
  },
  {
    kicker: "1 Syawal 1447 H",
    title: "Mohon Maaf\nLahir &\nBatin",
    sub: "Semoga silaturahmi semakin erat",
    detail: "Open house — silakan mampir,\nada ketupat dan rendang menunggu",
  },
]

function lebaGreetingTpls(): TemplateSpec[] {
  const tpls: TemplateSpec[] = []
  LEBA_POST_STYLES.forEach((style, si) => {
    LEBA_GREETINGS.forEach((c, ci) => {
      if ((si + ci) % 2 !== 0) return // 8 styles × 3 greetings → 12 curated combos
      tpls.push({
        slug: `${style.slug.replace("-post", "")}-${["fitri", "eid", "maaf"][ci]}`,
        name: `${style.name.split("—")[1].trim()} · ${["Selamat Idulfitri", "Eid Mubarak", "Mohon Maaf"][ci]}`,
        category: CAT,
        type: "canvas",
        tags: ["lebaran", "idulfitri", "eid", "ramadan", "greeting", "instagram", "islamic"],
        width: IG,
        height: IG,
        build: () => greetingPost(style, c),
      })
    })
  })
  return tpls
}

/* ============================ 2. Ramadan Kareem posts ============================ */

function ramadanKareemTpls(): TemplateSpec[] {
  const specs: TemplateSpec[] = []

  const mk = (
    slug: string,
    name: string,
    bg: ReturnType<typeof solid> | ReturnType<typeof gradient>,
    els: (d: DesignElement[]) => DesignElement[],
    tags: string[] = ["ramadan", "kareem", "islamic", "instagram"],
  ): TemplateSpec => ({
    slug,
    name,
    category: CAT,
    type: "canvas",
    tags,
    width: IG,
    height: IG,
    build: () => doc("canvas", IG, IG, bg, [page(slug, bg, els([]))]),
  })

  specs.push(
    mk(
      "ramadan-kareem-lantern",
      "Marhaban Ya Ramadan — Lantern Post",
      gradient("#1e1b4b", "#312e81", 155),
      (d) =>
        d.concat([
          txt("marhaban ya ramadan", { x: 0, y: 200, w: IG, h: 50, size: 30, font: F.sans, weight: 600, color: "#c4b5fd", align: "center", upper: true, ls: 8 }),
          txt("Ramadan\nKareem", { x: 90, y: 300, w: IG - 180, h: 330, size: 150, font: F.display, weight: 400, color: "#fde68a", align: "center", lh: 1.0 }),
          txt("Selamat menunaikan ibadah shaum —\nsemoga bulan penuh berkah ini membawa keberkahan", { x: 130, y: 680, w: IG - 260, h: 110, size: 30, font: F.body, weight: 400, color: "#e0e7ff", align: "center", lh: 1.4 }),
          img(asset("lantern"), { x: 100, y: 830, w: 220, h: 286, rotation: -5 }),
          img(asset("lantern"), { x: 760, y: 850, w: 200, h: 260, rotation: 6 }),
          ...starScatter(8, 120, 100, 840, 180, "#c4b5fd", 9),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-imamsak-schedule",
      "Jadwal Imsakiyah — Minimal Post",
      solid("#f8fafc"),
      (d) =>
        d.concat([
          rect({ x: 60, y: 60, w: IG - 120, h: IG - 120, fill: "#ffffff", stroke: "#0f766e", sw: 3, r: 20 }),
          txt("JADWAL IMSAKIYAH", { x: 0, y: 130, w: IG, h: 60, size: 44, font: F.pop, weight: 800, color: EMERALD_DEEP, align: "center", ls: 3 }),
          txt("Ramadan 1447 H · wilayah Jakarta & sekitarnya", { x: 0, y: 200, w: IG, h: 40, size: 24, font: F.sans, weight: 500, color: "#64748b", align: "center" }),
          ...[
            ["1 Ramadan", "04:32", "18:12"],
            ["10 Ramadan", "04:28", "18:14"],
            ["20 Ramadan", "04:22", "18:16"],
            ["29 Ramadan", "04:18", "18:18"],
          ].flatMap(([day, imsak, maghrib], i) => {
            const y = 300 + i * 130
            return [
              rect({ x: 120, y, w: IG - 240, h: 96, fill: i % 2 ? "#f0fdfa" : "#ffffff", r: 14 }),
              txt(day, { x: 150, y, w: 300, h: 96, size: 32, font: F.sans, weight: 700, color: "#134e4a", vAlign: "middle" }),
              txt(`Imsak ${imsak}`, { x: 460, y, w: 260, h: 96, size: 28, font: F.mono, weight: 700, color: EMERALD, vAlign: "middle" }),
              txt(`Maghrib ${maghrib}`, { x: 700, y, w: 300, h: 96, size: 28, font: F.mono, weight: 700, color: "#0f766e", align: "right", vAlign: "middle" }),
            ] as DesignElement[]
          }),
          txt("simpan jadwal ini — bagikan ke keluarga & sahabat", { x: 0, y: 880, w: IG, h: 44, size: 26, font: F.hand, weight: 400, color: "#0f766e", align: "center" }),
          img(asset("crescent-star"), { x: 850, y: 92, w: 130, h: 130, rotation: 12 }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-sahur-story-card",
      "Sahur Reminder — Bold Post",
      solid(NIGHT),
      (d) =>
        d.concat([
          txt("pengingat", { x: 0, y: 190, w: IG, h: 44, size: 28, font: F.sans, weight: 600, color: "#94a3b8", align: "center", upper: true, ls: 8 }),
          txt("SAHUR!", { x: 0, y: 280, w: IG, h: 200, size: 210, font: F.display, weight: 400, color: "#fef9c3", align: "center" }),
          txt("bangun sahabat — sebelum imsak", { x: 0, y: 520, w: IG, h: 60, size: 34, font: F.hand, weight: 400, color: "#a7f3d0", align: "center" }),
          rect({ x: 240, y: 640, w: 600, h: 150, fill: "#1e293b", r: 24 }),
          txt("04:15 WIB", { x: 240, y: 640, w: 600, h: 150, size: 76, font: F.mono, weight: 700, color: "#4ade80", align: "center", vAlign: "middle" }),
          txt("setel alarm, minum air yang cukup,\ndan jangan lupa sahur — sahur itu berkah", { x: 140, y: 840, w: IG - 280, h: 110, size: 27, font: F.body, weight: 400, color: "#cbd5e1", align: "center", lh: 1.45 }),
          img(asset("lantern"), { x: 70, y: 700, w: 170, h: 221, rotation: -9 }),
          img(asset("lantern"), { x: 846, y: 700, w: 164, h: 213, rotation: 9 }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-buka-bareng",
      "Buka Bersama — Warm Post",
      solid("#fff7ed"),
      (d) =>
        d.concat([
          txt("buka bersama", { x: 0, y: 170, w: IG, h: 46, size: 28, font: F.sans, weight: 600, color: "#c2410c", align: "center", upper: true, ls: 7 }),
          txt("BukBer\ntime!", { x: 90, y: 240, w: IG - 180, h: 280, size: 130, font: F.pop, weight: 800, color: "#9a3412", align: "center", lh: 1.05 }),
          rect({ x: 200, y: 570, w: 680, h: 120, fill: "#fed7aa", r: 60 }),
          txt("Minggu, 10 Ramadan · 17.30 WIB", { x: 200, y: 570, w: 680, h: 120, size: 34, font: F.sans, weight: 700, color: "#7c2d12", align: "center", vAlign: "middle" }),
          txt("Kedai Kopi Generasi · Jl. Melati No. 10", { x: 0, y: 720, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#9a3412", align: "center" }),
          txt("datang ya! takjil gratis untuk 30 orang pertama", { x: 0, y: 800, w: IG, h: 50, size: 27, font: F.hand, weight: 400, color: "#c2410c", align: "center" }),
          img(asset("ketupat"), { x: 90, y: 860, w: 160, h: 192, rotation: -8 }),
          img(asset("ketupat"), { x: 830, y: 860, w: 160, h: 192, rotation: 8 }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-dua-quote",
      "Doa Ramadan — Quote Post",
      gradient("#052e21", "#065f46", 160),
      (d) =>
        d.concat([
          ...cornerOrnaments(70, 70, IG - 140, IG - 140, GOLD),
          txt("doa hari pertama", { x: 0, y: 190, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 6 }),
          txt("“Allahumma innaka ‘afuwwun\ntuhibbul ‘afwa fa’fu ‘anni.”", { x: 90, y: 320, w: IG - 180, h: 220, size: 48, font: F.serif, weight: 700, color: "#ecfdf5", align: "center", lh: 1.35 }),
          txt("“Ya Allah, sesungguhnya Engkau Maha Pemaaf,\nEngkau mencintai maaf — maafkanlah aku.”", { x: 110, y: 570, w: IG - 220, h: 140, size: 30, font: F.body, weight: 400, color: "#a7f3d0", align: "center", italic: true, lh: 1.45 }),
          rule(440, 760, 200, GOLD, 5),
          txt("bagikan — siapa tahu menjadi amal jariyah", { x: 0, y: 810, w: IG, h: 46, size: 25, font: F.sans, weight: 500, color: "#6ee7b7", align: "center" }),
          img(asset("tasbih"), { x: 440, y: 860, w: 200, h: 260 }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-last-ten",
      "10 Hari Terakhir — Night Post",
      solid("#111827"),
      (d) =>
        d.concat([
          ellipse({ x: 640, y: 90, w: 340, h: 340, fill: "#1f2937" }),
          ...crescentShape(700, 130, 220, GOLD_SOFT, "#111827"),
          txt("10 HARI TERAKHIR", { x: 0, y: 250, w: 560, h: 60, size: 40, font: F.pop, weight: 800, color: GOLD_SOFT, ls: 3 }),
          txt("perbanyak\nibadah,\nsedekah,\ndan i’tikaf", { x: 90, y: 350, w: 560, h: 340, size: 72, font: F.pop, weight: 800, color: "#ffffff", lh: 1.15 }),
          txt("malam lailatul qadar lebih baik\ndari 1000 bulan — raih di 10 malam ganjil", { x: 90, y: 720, w: 520, h: 120, size: 28, font: F.body, weight: 400, color: "#9ca3af", lh: 1.45 }),
          ...starScatter(10, 600, 500, 420, 420, GOLD_SOFT, 17),
          rect({ x: 90, y: 880, w: 520, h: 90, fill: GOLD, r: 45 }),
          txt(" praktik sunnah: 2 rakaat shalat tarawih & witir", { x: 90, y: 880, w: 520, h: 90, size: 24, font: F.sans, weight: 600, color: "#111827", align: "center", vAlign: "middle" }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-takjil-free",
      "Takjil Gratis — Cheerful Post",
      solid("#fef9c3"),
      (d) =>
        d.concat([
          rect({ x: -60, y: 780, w: IG + 120, h: 320, fill: "#f59e0b", rotation: -3 }),
          shp("badge", { x: 720, y: 90, w: 180, h: 180, fill: "#dc2626", rotation: 15 }),
          txt("GRATIS", { x: 720, y: 130, w: 180, h: 70, size: 40, font: F.display, weight: 400, color: "#ffffff", align: "center", rotation: 15 }),
          txt("TAKJIL", { x: 0, y: 160, w: IG, h: 180, size: 190, font: F.display, weight: 400, color: "#92400e", align: "center", ls: 6 }),
          txt("bagi-bagi takjil setiap hari Ramadan", { x: 0, y: 370, w: IG, h: 60, size: 36, font: F.pop, weight: 700, color: "#78350f", align: "center" }),
          txt("pukul 15.30 WIB · depan masjid Al-Ikhlas\n100 paket per hari — selama ada", { x: 0, y: 460, w: IG, h: 100, size: 30, font: F.sans, weight: 600, color: "#92400e", align: "center", lh: 1.4 }),
          txt("mau ikut berbagi? kontribusi via panitia —\nberbagi takjil pahalanya besar", { x: 0, y: 830, w: IG, h: 100, size: 28, font: F.body, weight: 500, color: "#fffbeb", align: "center", lh: 1.4 }),
        ] as DesignElement[]),
    ),
    mk(
      "ramadan-genuine-hijri",
      "1447 H — Typographic Post",
      solid("#0c4a6e"),
      (d) =>
        d.concat([
          txt("1447", { x: 0, y: 150, w: IG, h: 340, size: 320, font: F.display, weight: 400, color: "#7dd3fc", align: "center" }),
          txt("H I J R I A H", { x: 0, y: 520, w: IG, h: 70, size: 56, font: F.sans, weight: 600, color: "#e0f2fe", align: "center", ls: 22 }),
          rule(390, 640, 300, "#38bdf8", 6),
          txt("marhaban ya ramadan —\nsemoga menjadi bulan kemenangan kita", { x: 0, y: 690, w: IG, h: 110, size: 31, font: F.body, weight: 400, color: "#bae6fd", align: "center", lh: 1.4 }),
          img(asset("crescent-star"), { x: 120, y: 100, w: 170, h: 170, rotation: -12 }),
          img(asset("mosque"), { x: 240, y: 840, w: 600, h: 150, opacity: 0.45 }),
        ] as DesignElement[]),
    ),
  )
  return specs
}

/* ============================ 3. Idul Adha / takbir posts ============================ */

function adhaTpls(): TemplateSpec[] {
  return [
    {
      slug: "adha-emerald-kurban",
      name: "Iduladha — Kurban Emerald Post",
      category: CAT,
      type: "canvas",
      tags: ["iduladha", "kurban", "haji", "takbir", "islamic", "lebaran"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid(EMERALD_DEEP), [
          page("Adha", solid(EMERALD_DEEP), [
            ...cornerOrnaments(64, 64, IG - 128, IG - 128, GOLD),
            txt("10 Dzulhijjah 1447 H", { x: 0, y: 190, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 7 }),
            txt("Selamat Hari\nRaya Iduladha", { x: 90, y: 280, w: IG - 180, h: 260, size: 108, font: F.serif, weight: 700, color: GOLD_SOFT, align: "center", lh: 1.1 }),
            txt("Taqabbalallahu minna wa minkum —\nsemoga ibadah kurban kita diterima", { x: 130, y: 580, w: IG - 260, h: 110, size: 30, font: F.body, weight: 400, color: "#d1fae5", align: "center", italic: true, lh: 1.4 }),
            img(asset("mosque"), { x: 140, y: 700, w: 800, h: 200, opacity: 0.85 }),
            ...starScatter(8, 100, 100, 880, 220, GOLD_SOFT, 13),
          ]),
        ]),
    },
    {
      slug: "adha-takbir-sunburst",
      name: "Takbir — Sunburst Post",
      category: CAT,
      type: "canvas",
      tags: ["takbir", "iduladha", "eid", "islamic", "lebaran"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#b45309", "#7f1d1d", 150), [
          page("Takbir", gradient("#b45309", "#7f1d1d", 150), [
            img(asset("sunburst"), { x: 240, y: 130, w: 600, h: 600, opacity: 0.45 }),
            txt("allahu akbar, allahu akbar", { x: 0, y: 260, w: IG, h: 60, size: 36, font: F.body, weight: 700, color: "#fef3c7", align: "center", italic: true }),
            txt("TAKBIR", { x: 0, y: 340, w: IG, h: 220, size: 230, font: F.display, weight: 400, color: "#fffbeb", align: "center", ls: 10 }),
            txt("laa ilaaha illallah — walillahil hamd", { x: 0, y: 590, w: IG, h: 60, size: 34, font: F.serif, weight: 700, color: "#fde68a", align: "center" }),
            txt("hidupkan malam takbir —\ndari maghrib 9 Dzulhijjah hingga salat Id", { x: 0, y: 700, w: IG, h: 100, size: 29, font: F.sans, weight: 500, color: "#fef3c7", align: "center", lh: 1.4 }),
            img(asset("bedug"), { x: 90, y: 840, w: 200, h: 182, rotation: -6 }),
            img(asset("ketupat"), { x: 790, y: 830, w: 190, h: 228, rotation: 7 }),
          ]),
        ]),
    },
    {
      slug: "adha-kurban-info",
      name: "Kurban 1447 H — Info Post",
      category: CAT,
      type: "canvas",
      tags: ["kurban", "iduladha", "panitia", "islamic"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fafaf9"), [
          page("Kurban", solid("#fafaf9"), [
            rect({ x: 0, y: 0, w: IG, h: 250, fill: EMERALD }),
            txt("PROGRAM KURBAN 1447 H", { x: 0, y: 80, w: IG, h: 70, size: 52, font: F.pop, weight: 800, color: "#ffffff", align: "center" }),
            txt("Masjid Baiturrahman × Panitia Kurban", { x: 0, y: 160, w: IG, h: 46, size: 26, font: F.sans, weight: 500, color: "#a7f3d0", align: "center" }),
            ...[
              ["Sapi / 7 bagian", "Rp 4.200.000 / bagian"],
              ["Kambing utuh", "Rp 3.100.000"],
              ["Tenggat pembayaran", "5 Dzulhijjah 1447 H"],
            ].flatMap(([k, v], i) => {
              const y = 320 + i * 140
              return [
                rect({ x: 80, y, w: IG - 160, h: 110, fill: i % 2 ? "#f0fdf4" : "#ffffff", stroke: "#d1d5db", sw: 2, r: 16 }),
                txt(k, { x: 120, y, w: 420, h: 110, size: 32, font: F.sans, weight: 700, color: "#134e4a", vAlign: "middle" }),
                txt(v, { x: 520, y, w: 480, h: 110, size: 32, font: F.mono, weight: 700, color: EMERALD, align: "right", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            rect({ x: 80, y: 760, w: IG - 160, h: 130, fill: "#fef3c7", r: 16 }),
            txt("pemotongan dilaksanakan 10 Dzulhijjah setelah salat Id ·\ndaging dibagikan ke mustahik & jamaah", { x: 120, y: 776, w: IG - 240, h: 100, size: 26, font: F.sans, weight: 500, color: "#78350f", lh: 1.4 }),
            txt("informasi & pendaftaran: sekretariat masjid / WA 0812-xxxx-xxxx", { x: 0, y: 930, w: IG, h: 50, size: 27, font: F.sans, weight: 600, color: EMERALD_DEEP, align: "center" }),
            img(asset("mosque"), { x: 340, y: 990, w: 400, h: 100, opacity: 0.3 }),
          ]),
        ]),
    },
    {
      slug: "adha-eid-quote-duotone",
      name: "Eid al-Adha — Duotone Quote",
      category: CAT,
      type: "canvas",
      tags: ["iduladha", "quote", "islamic", "eid"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#7c2d12", "#f97316", 155), [
          page("Adha quote", gradient("#7c2d12", "#f97316", 155), [
            ellipse({ x: -130, y: -130, w: 380, h: 380, fill: "#ffffff", opacity: 0.12 }),
            ellipse({ x: 830, y: 830, w: 340, h: 340, fill: "#ffffff", opacity: 0.12 }),
            txt("“Wa lillahi ‘ala an-naasi hijjul baiti”", { x: 90, y: 300, w: IG - 180, h: 200, size: 52, font: F.serif, weight: 700, color: "#fff7ed", align: "center", lh: 1.3 }),
            txt("“Kewajiban manusia kepada Allah adalah\nmenunaikan ibadah haji ke Baitullah…”", { x: 120, y: 540, w: IG - 240, h: 130, size: 30, font: F.body, weight: 400, color: "#ffedd5", align: "center", italic: true, lh: 1.4 }),
            txt("— QS. Ali Imran: 97", { x: 0, y: 700, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#fde68a", align: "center" }),
            rule(440, 790, 200, "#fde68a", 5),
            txt("selamat hari raya iduladha — taqabbalallahu minna wa minkum", { x: 0, y: 830, w: IG, h: 50, size: 26, font: F.sans, weight: 500, color: "#fff7ed", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "adha-mudik-free",
      name: "Mudik & Qurban — Homecoming Post",
      category: CAT,
      type: "canvas",
      tags: ["mudik", "iduladha", "family", "islamic"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#ecfdf5"), [
          page("Mudik", solid("#ecfdf5"), [
            txt("balik kampung mode:", { x: 0, y: 170, w: IG, h: 50, size: 30, font: F.sans, weight: 600, color: EMERALD, align: "center", upper: true, ls: 5 }),
            txt("IDULADHA\ndi rumah", { x: 90, y: 250, w: IG - 180, h: 300, size: 130, font: F.pop, weight: 800, color: "#064e3b", align: "center", lh: 1.05 }),
            txt("salam-salaman, makan bersama,\ndan cerita di beranda seperti dulu", { x: 130, y: 590, w: IG - 260, h: 110, size: 31, font: F.body, weight: 400, color: "#047857", align: "center", lh: 1.4 }),
            img(asset("ketupat-duo"), { x: 340, y: 730, w: 400, h: 400, opacity: 0.95 }),
            ...starScatter(6, 90, 100, 300, 300, "#34d399", 3),
          ]),
        ]),
    },
  ]
}

/* ============================ 4. Stories ============================ */

function lebaStoryTpls(): TemplateSpec[] {
  const specs: TemplateSpec[] = []
  const styles = [
    {
      slug: "leba-story-emerald",
      name: "Lebaran Story — Emerald Gold",
      bg: solid(EMERALD_DEEP),
      ink: GOLD_SOFT,
      sub: "#a7f3d0",
      card: "#052e21",
      cardInk: "#d1fae5",
      accent: GOLD,
      decorate: (els: DesignElement[]) => {
        els.push(...hangingKetupat(90, 60, 3, 1))
        els.push(...crescentShape(740, 300, 210, GOLD_SOFT, EMERALD_DEEP))
        els.push(...starScatter(10, 100, 260, 880, 400, GOLD_SOFT, 7))
      },
    },
    {
      slug: "leba-story-night",
      name: "Lebaran Story — Night Mosque",
      bg: gradient("#0b1226", "#1e1b4b", 170),
      ink: "#fef9c3",
      sub: "#c7d2fe",
      card: "#0b1226",
      cardInk: "#e0e7ff",
      accent: GOLD_SOFT,
      decorate: (els: DesignElement[]) => {
        els.push(img(asset("mosque"), { x: 40, y: 1650, w: 1000, h: 250, opacity: 0.9 }))
        els.push(img(asset("lantern"), { x: 70, y: 60, w: 200, h: 260, rotation: -6 }))
        els.push(img(asset("lantern"), { x: 810, y: 60, w: 200, h: 260, rotation: 6 }))
        els.push(...starScatter(12, 90, 250, 900, 500, "#fef9c3", 15))
      },
    },
    {
      slug: "ramadan-story-kareem",
      name: "Ramadan Story — Kareem Lantern",
      bg: solid("#1e1b4b"),
      ink: "#fde68a",
      sub: "#c4b5fd",
      card: "#312e81",
      cardInk: "#e0e7ff",
      accent: GOLD_SOFT,
      decorate: (els: DesignElement[]) => {
        els.push(img(asset("lantern"), { x: 90, y: 100, w: 190, h: 247, rotation: -7 }))
        els.push(img(asset("lantern"), { x: 800, y: 100, w: 190, h: 247, rotation: 7 }))
        els.push(img(asset("lantern"), { x: 445, y: 80, w: 190, h: 247 }))
        els.push(...starScatter(9, 100, 240, 880, 420, "#c4b5fd", 23))
      },
    },
    {
      slug: "ramadan-story-imsak",
      name: "Ramadan Story — Imsak Reminder",
      bg: gradient("#0f172a", "#155e75", 165),
      ink: "#e0f2fe",
      sub: "#7dd3fc",
      card: "#0c4a6e",
      cardInk: "#e0f2fe",
      accent: "#38bdf8",
      decorate: (els: DesignElement[]) => {
        els.push(img(asset("crescent-star"), { x: 380, y: 260, w: 320, h: 320, opacity: 0.9 }))
        els.push(...starScatter(11, 100, 200, 880, 500, "#bae6fd", 31))
      },
    },
    {
      slug: "leba-story-maaf",
      name: "Lebaran Story — Mohon Maaf",
      bg: solid("#fdf6ec"),
      ink: "#7f1d1d",
      sub: "#a16207",
      card: "#7f1d1d",
      cardInk: "#fef3c7",
      accent: "#b45309",
      decorate: (els: DesignElement[]) => {
        els.push(rect({ x: 50, y: 50, w: STORY_W - 100, h: STORY_H - 100, fill: "transparent", stroke: "#b45309", sw: 4, r: 24 }))
        els.push(img(asset("ketupat-duo"), { x: 90, y: 1600, w: 260, h: 260, rotation: -7 }))
        els.push(img(asset("crescent-star"), { x: 760, y: 200, w: 220, h: 220, rotation: 12 }))
      },
    },
    {
      slug: "adha-story-takbir",
      name: "Iduladha Story — Takbir Sunset",
      bg: gradient("#7f1d1d", "#f59e0b", 160),
      ink: "#fffbeb",
      sub: "#fde68a",
      card: "#7f1d1d",
      cardInk: "#fef3c7",
      accent: GOLD_SOFT,
      decorate: (els: DesignElement[]) => {
        els.push(img(asset("sunburst"), { x: 290, y: 380, w: 500, h: 500, opacity: 0.4 }))
        els.push(img(asset("mosque"), { x: 90, y: 1660, w: 900, h: 225, opacity: 0.35 }))
        els.push(img(asset("bedug"), { x: 80, y: 80, w: 190, h: 173, rotation: -8 }))
      },
    },
  ]
  const contents = [
    {
      top: "1447 H · 1 Syawal",
      main: "Selamat\nIdul-\nfitri",
      sub: "minal aidin wal faizin",
      card: "Mohon maaf lahir dan batin.\nSemoga taubat kita diterima —\nfitri sejati: menang dari maksiat.",
    },
    {
      top: "Eid al-Fitr · Lebaran",
      main: "Maaf\nLahir\n&Batin",
      sub: "jaga silaturahmi, sebar bahagia",
      card: "Open house keluarga besar:\nMinggu, 2 Syawal · 09.00–15.00 WIB\nJl. Cendana No. 7 — semua dipersilakan.",
    },
    {
      top: "Bulan Suci Ramadan",
      main: "Ramadan\nKareem",
      sub: "marhaban ya ramadan",
      card: "Target bulan ini:\n· Khatam 30 juz\n· Shaum & tarawih rutin\n· Sedekah harian — sekecil apa pun.",
    },
    {
      top: "Pengingat · Ramadan",
      main: "Imsak\n04:16",
      sub: "hentikan sahur, niat shaum",
      card: "Niat shaum Ramadan:\nNawaitu shauman ghadan ‘an adaa’i\nfardhi syahri Ramadhaana haadzihis\nsanatil ‘aamati fardhal lillaahi ta’aalaa.",
    },
    {
      top: "1 Syawal 1447 H",
      main: "Mohon\nMaaf",
      sub: "lahir dan batin ya teman-teman",
      card: "Maafin semua salah, jatuh bangun,\nkata-kata, dan tingkah —\nsemoga tahun ini lebih baik.",
    },
    {
      top: "10 Dzulhijjah 1447 H",
      main: "Allahu\nAkbar",
      sub: "takbir mengagungkan Allah",
      card: "Selamat Hari Raya Iduladha.\nSemoga kurban kita diterima dan\ncita-cita qurban tercapai.",
    },
  ]
  for (let i = 0; i < styles.length; i++) {
    const st = styles[i]
    const c = contents[i]
    specs.push({
      slug: st.slug,
      name: st.name,
      category: CAT,
      type: "canvas",
      tags: ["story", "lebaran", "ramadan", "islamic", "9:16"],
      width: 1080,
      height: 1920,
      build: () => storyTemplate(st, c, st.decorate),
    })
  }
  return specs
}

/* ============================ 5. Banners (spanduk) ============================ */

function lebaBannerTpls(): TemplateSpec[] {
  return [
    {
      slug: "leba-banner-openhouse",
      name: "Spanduk Open House Lebaran",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "banner", "open house", "lebaran"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "leba-banner-openhouse", bg: solid(EMERALD_DEEP), strip: GOLD, ink: "#fffbeb", accent: GOLD_SOFT, sub: "#a7f3d0" },
          {
            left: "OPEN\nHOUSE",
            main: "Selamat Idulfitri\n1447 H",
            sub: "Mohon maaf lahir & batin — mampir, makan bareng!",
            right: "Minggu, 2 Syawal\n09.00–15.00 WIB\nJl. Cendana No. 7",
          },
          (els) => {
            els.push(img(asset("ketupat-duo"), { x: 90, y: 300, w: 250, h: 250, rotation: -8 }))
            els.push(img(asset("mosque"), { x: 1580, y: 400, w: 320, h: 192, opacity: 0.4 }))
            els.push(...starScatter(8, 500, 40, 1000, 60, GOLD_SOFT, 9))
          },
        ),
    },
    {
      slug: "leba-banner-masjid",
      name: "Spanduk Salam Lebaran Masjid",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "masjid", "lebaran", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "leba-banner-masjid", bg: solid("#0b1226"), strip: GOLD_SOFT, ink: "#fef9c3", accent: "#fbbf24", sub: "#c7d2fe" },
          {
            left: "MASJID\nAL-IKHLAS",
            main: "Minal Aidin\nwal Faizin",
            sub: "Taqabbalallahu minna wa minkum — selamat hari raya 1 Syawal 1447 H",
            right: "Salat Id: 06.30 WIB\ndi Lapangan Masjid\nbawa sajadah sendiri",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 60, y: 330, w: 380, h: 228, opacity: 0.9 }))
            els.push(...crescentShape(1660, 70, 170, "#fef9c3", "#0b1226"))
          },
        ),
    },
    {
      slug: "ramadan-banner-marhaban",
      name: "Spanduk Marhaban Ya Ramadan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "ramadan", "banner", "masjid"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "ramadan-banner-marhaban", bg: gradient("#312e81", "#1e1b4b", 120), strip: "#fde68a", ink: "#fef9c3", accent: "#c4b5fd", sub: "#e0e7ff" },
          {
            left: "SELAMAT\nMENUNAIKAN\nIBADAH SHAUM",
            main: "Marhaban\nYa Ramadan",
            sub: "Jadwal tarawih ba'da Isya 19.30 · witir 21.00 · tadarus ba'da Subuh",
            right: "RT 04 RW 02\nKelurahan Sukamaju\nRamadan 1447 H",
          },
          (els) => {
            els.push(img(asset("lantern"), { x: 1690, y: 300, w: 200, h: 260 }))
            els.push(...crescentShape(1500, 120, 140, "#fde68a", "#312e81"))
          },
        ),
    },
    {
      slug: "adha-banner-kurban",
      name: "Spanduk Panitia Kurban",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "kurban", "iduladha", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "adha-banner-kurban", bg: solid("#064e3b"), strip: "#fbbf24", ink: "#ecfdf5", accent: GOLD_SOFT, sub: "#a7f3d0" },
          {
            left: "PANITIA\nKURBAN",
            main: "Iduladha 1447 H\n— Qurban Center —",
            sub: "Sapi Rp 4,2 jt/bagian · Kambing Rp 3,1 jt · daftar sebelum 5 Dzulhijjah",
            right: "Sekretariat:\nMasjid Baiturrahman\nWA 0812-xxxx-xxxx",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 1650, y: 380, w: 260, h: 156, opacity: 0.45 }))
            els.push(img(asset("tasbih"), { x: 120, y: 320, w: 180, h: 234, rotation: -10 }))
          },
        ),
    },
    {
      slug: "leba-banner-safari",
      name: "Spanduk Safari Ramadan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "safari", "ramadan", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "leba-banner-safari", bg: solid("#1e1b4b"), strip: "#c4b5fd", ink: "#f3e8ff", accent: "#fde68a", sub: "#c7d2fe" },
          {
            left: "SAFARI\nRAMADAN",
            main: "Tadarus\nKeliling",
            sub: "Setiap malam ba'da tarawih — bertamu ke 30 rumah warga se-RT 05",
            right: "Start: Rumah Pak RT\n19.45 WIB\nbawa mushaf masing-masing",
          },
          (els) => {
            els.push(img(asset("lantern"), { x: 100, y: 320, w: 180, h: 234, rotation: -8 }))
            els.push(...starScatter(10, 600, 60, 900, 60, "#e9d5ff", 19))
          },
        ),
    },
    {
      slug: "leba-banner-homecoming",
      name: "Spanduk Salam Pulang Kampung",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "mudik", "lebaran", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "leba-banner-homecoming", bg: gradient("#065f46", "#047857", 120), strip: "#fde68a", ink: "#ecfdf5", accent: "#fde68a", sub: "#a7f3d0" },
          {
            left: "SELAMAT\nMUDIK &\nSUNGKEMAN",
            main: "Home Sweet\nHome — Lebaran",
            sub: "Desa Sukamaju menyambut putra-putri pulang — selamat mudik, hati-hati di jalan",
            right: "Lomba & panggung\nrakyat: 2–6 Syawal\ndaftar di balai desa",
          },
          (els) => {
            els.push(img(asset("ketupat-duo"), { x: 1680, y: 310, w: 220, h: 220, rotation: 8 }))
            els.push(...crescentShape(120, 260, 150, "#fde68a", "#065f46"))
          },
        ),
    },
  ]
}

/* ============================ 6. A4 posters ============================ */

function lebaPosterTpls(): TemplateSpec[] {
  const baseInfo = {
    speakerLabel: "penerima tamu",
    speaker: "Keluarga Besar\nBpk. H. Ahmad Suryana",
    footer: "diselenggarakan dengan penuh kekeluargaan — semua dipersilakan",
  }
  return [
    {
      slug: "leba-poster-openhouse",
      name: "Poster Open House Idulfitri (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "open house", "lebaran", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "leba-poster-openhouse", bg: solid("#fbf7ec"), headerFill: EMERALD_DEEP, headerInk: GOLD_SOFT, cardFill: "#ffffff", cardInk: "#064e3b", accent: "#b45309", ink: "#1f2937" },
          {
            ...baseInfo,
            kicker: "undangan open house",
            title: "Open House\nLebaran 1447 H",
            dateLine: "Minggu, 2 Syawal 1447 H",
            timeLine: "09.00 WIB — selesai",
            placeLine: "Kediaman: Jl. Cendana No. 7, Sukamaju",
            note: "Ketupat, opor, rendang, dan kue lebaran menanti.\nDatanglah dengan keluarga — sungguh kebersamaan itu Lebaran sejati.",
          },
          (d) => {
            d.push(img(asset("ketupat-duo"), { x: 90, y: 60, w: 190, h: 190, rotation: -8 }))
            d.push(img(asset("ketupat-duo"), { x: 960, y: 60, w: 190, h: 190, rotation: 8 }))
            d.push(...crescentShape(530, 40, 130, GOLD_SOFT, EMERALD_DEEP))
            d.push(...starScatter(6, 100, 380, 1040, 140, GOLD_SOFT, 25))
          },
        ),
    },
    {
      slug: "leba-poster-halalbihalal",
      name: "Poster Halal Bihalal Organisasi (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "halal bihalal", "organisasi", "lebaran"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "leba-poster-halalbihalal", bg: solid("#f0fdf4"), headerFill: "#065f46", headerInk: "#ecfdf5", cardFill: "#ffffff", cardInk: "#064e3b", accent: "#d97706", ink: "#1f2937", titleSize: 70 },
          {
            speakerLabel: "diselenggarakan oleh",
            speaker: "Ikatan Warga\nDesa Sukamaju",
            kicker: "halal bihalal silaturahmi",
            title: "Halal Bihalal\n& Reuni Akbar",
            dateLine: "Ahad, 8 Syawal 1447 H",
            timeLine: "08.00 WIB — 13.00 WIB",
            placeLine: "Balai Desa Sukamaju",
            note: "Rangkaian: tadarus bersama, sambutan ketua, salim-saliman,\nmakan siang keluarga, dan doorprize untuk 50 orang pertama.",
            footer: "informasi panitia: Bpk. Udin 0813-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 420, y: 340, w: 400, h: 200, opacity: 0.28 }))
            d.push(img(asset("garland-flag"), { x: 60, y: 30, w: 500, h: 175, opacity: 0.9 }))
            d.push(...crescentShape(1000, 60, 120, "#fde68a", "#065f46"))
          },
        ),
    },
    {
      slug: "leba-poster-salatid",
      name: "Poster Salat Id & Takbir (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "salat id", "takbir", "masjid"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "leba-poster-salatid", bg: solid("#0b1226"), headerFill: "#1e1b4b", headerInk: "#fef9c3", cardFill: "#0b1226", cardInk: "#e0e7ff", accent: "#fbbf24", ink: "#cbd5e1" },
          {
            speakerLabel: "khatib",
            speaker: "Ust. H. Muhammad\nRidwan, Lc.",
            kicker: "masjid al-ikhlas mengundang",
            title: "Salat Idulfitri\n1447 H",
            dateLine: "1 Syawal 1447 H (sesuai hisab)",
            timeLine: "06.30 WIB — di lapangan masjid",
            placeLine: "Lapangan Masjid Al-Ikhlas",
            note: "Bawa sajadah & wudhu di rumah. Takbir keliling\nba'da Maghrib malam takbiran — mari hidupkan suasana.",
            footer: "bendahara infaq: Bpk. Hasan — seikhlasnya",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 320, y: 320, w: 600, h: 300, opacity: 0.55 }))
            d.push(...crescentShape(520, 30, 150, "#fef9c3", "#1e1b4b"))
            d.push(...starScatter(8, 120, 400, 1000, 130, "#fde68a", 33))
          },
        ),
    },
    {
      slug: "leba-poster-takjil",
      name: "Poster Berbagi Takjil (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "takjil", "berbagi", "ramadan"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "leba-poster-takjil", bg: solid("#fffbeb"), headerFill: "#b45309", headerInk: "#fffbeb", cardFill: "#ffffff", cardInk: "#78350f", accent: "#f59e0b", ink: "#1f2937" },
          {
            speakerLabel: "digagas oleh",
            speaker: "Remaja Masjid\nAl-Ikhlas",
            kicker: "gerakan berbagi di bulan suci",
            title: "Takjil Gratis\nSetiap Hari",
            dateLine: "Setiap hari Ramadan 1447 H",
            timeLine: "15.30 WIB — selama ada",
            placeLine: "Pos takjil · depan Masjid Al-Ikhlas",
            note: "100 paket takjil per hari untuk pemulung, sopir, dan pengguna jalan.\nMau ikut berbagi? Donasi berupa makanan minuman atau uang seikhlasnya.",
            footer: "melapor & donasi: Rizky 0857-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("ketupat"), { x: 100, y: 50, w: 170, h: 204, rotation: -9 }))
            d.push(img(asset("ketupat"), { x: 970, y: 50, w: 170, h: 204, rotation: 9 }))
            d.push(...crescentShape(520, 30, 140, "#fde68a", "#b45309"))
          },
        ),
    },
    {
      slug: "adha-poster-qurban",
      name: "Poster Qurban Makmur (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "qurban", "kurban", "iduladha"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "adha-poster-qurban", bg: solid("#f0fdfa"), headerFill: "#115e59", headerInk: "#ccfbf1", cardFill: "#ffffff", cardInk: "#134e4a", accent: "#d97706", ink: "#1f2937", titleSize: 72 },
          {
            speakerLabel: "diselenggarakan oleh",
            speaker: "Qurban Center\nMasjid Al-Ikhlas",
            kicker: "mari meraih keutamaan kurban",
            title: "Program Kurban\n1447 H",
            dateLine: "Pendaftaran: 1–25 Dzulqaidah",
            timeLine: "Pemotongan: 10 Dzulhijjah, ba'da salat Id",
            placeLine: "Halaman Masjid Al-Ikhlas",
            note: "Harga bagian sapi Rp 4,2 jt · kambing Rp 3,1 jt.\nHasil kurban dibagikan kepada fakir miskin di 5 desa sekitar.",
            footer: "sekretariat: Bpk. Rahmat 0821-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 420, y: 330, w: 400, h: 200, opacity: 0.3 }))
            d.push(...crescentShape(990, 70, 130, "#fde68a", "#115e59"))
            d.push(...starScatter(6, 100, 400, 1000, 130, "#99f6e4", 41))
          },
        ),
    },
    {
      slug: "leba-poster-sungkeman",
      name: "Poster Sungkeman Keluarga (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "sungkeman", "keluarga", "lebaran"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "leba-poster-sungkeman", bg: solid("#fdf6ec"), headerFill: "#7f1d1d", headerInk: "#fef3c7", cardFill: "#ffffff", cardInk: "#7f1d1d", accent: "#b45309", ink: "#1f2937", titleFont: F.serif, titleSize: 68 },
          {
            speakerLabel: "hari kebersamaan",
            speaker: "Keluarga Besar\nSuryana",
            kicker: "tradisi lebaran pagi raya",
            title: "Sungkeman &\nSalam Tempel",
            dateLine: "1 Syawal 1447 H",
            timeLine: "06.00 WIB — setelah salat Id",
            placeLine: "Rumah Ki Ayah · Cendana No. 7",
            note: "Sungkeman berurutan dari yang paling tua. Angpao untuk anak cucu\ndan jangan lupa foto keluarga besar sebelum makan siang.",
            footer: "coordinator: Mbak Nur 0819-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("crescent-star"), { x: 100, y: 60, w: 160, h: 160, rotation: -10 }))
            d.push(img(asset("crescent-star"), { x: 980, y: 60, w: 160, h: 160, rotation: 170 }))
            d.push(...starScatter(7, 120, 400, 1000, 130, "#fde68a", 47))
          },
        ),
    },
  ]
}

/* ============================ 7. Hampers labels ============================ */

function lebaLabelTpls(): TemplateSpec[] {
  const mk = (slug: string, name: string, bg: string, ink: string, accent: string, brand: string, from: string, tags: string[], deco: (d: DesignElement[]) => void): TemplateSpec => ({
    slug,
    name,
    category: CAT,
    type: "canvas",
    tags,
    width: 900,
    height: 600,
    build: () =>
      doc("canvas", 900, 600, solid(bg), [
        page(slug, solid(bg), [
          rect({ x: 30, y: 30, w: 840, h: 540, fill: "transparent", stroke: accent, sw: 4, r: 20 }),
          ...(() => { const d: DesignElement[] = []; deco(d); return d })(),
          txt(brand, { x: 60, y: 130, w: 780, h: 110, size: 66, font: F.serif, weight: 700, color: ink, align: "center" }),
          rule(320, 260, 260, accent, 4),
          txt("hampers lebaran 1447 H", { x: 60, y: 286, w: 780, h: 46, size: 26, font: F.sans, weight: 600, color: accent, align: "center", upper: true, ls: 5 }),
          txt(from, { x: 60, y: 360, w: 780, h: 110, size: 30, font: F.body, weight: 400, color: ink, align: "center", italic: true, lh: 1.4 }),
          txt("mohon maaf lahir & batin", { x: 60, y: 480, w: 780, h: 46, size: 24, font: F.hand, weight: 400, color: accent, align: "center" }),
        ]),
      ]),
  })
  return [
    mk(
      "leba-label-emerald",
      "Label Hampers — Emerald Elegan",
      EMERALD_DEEP, GOLD_SOFT, "#d6bd7b", "Kurma & Kopi,\nCokelat & Sukade",
      "dari keluarga Suryana\nuntuk sahabat sejati",
      ["label", "hampers", "lebaran", "parcel"],
      (d) => {
        d.push(img(asset("ketupat"), { x: 40, y: 40, w: 110, h: 132, rotation: -10 }))
        d.push(img(asset("ketupat"), { x: 750, y: 40, w: 110, h: 132, rotation: 10 }))
      },
    ),
    mk(
      "leba-label-cream",
      "Label Hampers — Cream Manis",
      "#fdf6ec", "#7f1d1d", "#b45309", "Kue Kering\nLebaran",
      "homemade dengan sayang\n— Rina & Ibu —",
      ["label", "hampers", "kue", "lebaran"],
      (d) => {
        d.push(img(asset("crescent-star"), { x: 40, y: 40, w: 100, h: 100, rotation: -8 }))
        d.push(img(asset("crescent-star"), { x: 760, y: 40, w: 100, h: 100, rotation: 8 }))
      },
    ),
    mk(
      "leba-label-night",
      "Label Hampers — Night Luxe",
      "#0b1226", "#fef9c3", "#fbbf24", "Premium Lebaran\nSelection",
      "for our valued partners\n— PT Cahaya Abadi —",
      ["label", "hampers", "corporate", "lebaran"],
      (d) => {
        d.push(img(asset("lantern"), { x: 40, y: 40, w: 96, h: 125, rotation: -8 }))
        d.push(img(asset("lantern"), { x: 764, y: 40, w: 96, h: 125, rotation: 8 }))
        d.push(...starScatter(6, 200, 40, 500, 70, "#fde68a", 51))
      },
    ),
  ]
}

/* ============================ export ============================ */

export const SEASONAL_LEBARAN_TPLS: TemplateSpec[] = [
  ...lebaGreetingTpls(),
  ...ramadanKareemTpls(),
  ...adhaTpls(),
  ...lebaStoryTpls(),
  ...lebaBannerTpls(),
  ...lebaPosterTpls(),
  ...lebaLabelTpls(),
]
