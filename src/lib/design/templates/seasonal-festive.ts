/**
 * Seasonal pack — Festive celebrations (world & school calendar).
 * ----------------------------------------------------------------
 * 30 original editable templates: Valentine, Christmas, Halloween,
 * Teacher's Day, Back to School, Earth Day, Mother's & Father's Day.
 * Layout conventions researched from holiday-template galleries:
 * oversized hearts, twinkling trees, playful pumpkins, warm classroom art.
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
  txt,
  type DesignElement,
  type TemplateSpec,
} from "../template-builder"
import {
  A4H,
  A4W,
  BANNER_H,
  BANNER_W,
  GOLD_SOFT,
  IG,
  banner,
  cornerOrnaments,
  eventPoster,
  starScatter,
  storyTemplate,
} from "./seasonal-shared"

const CAT = "seasonal"
const STORY_W = 1080
const STORY_H = 1920

/* ============================ Valentine ============================ */

function valentineTpls(): TemplateSpec[] {
  return [
    {
      slug: "valentine-heart-rain",
      name: "Valentine — Heart Rain Post",
      category: CAT,
      type: "canvas",
      tags: ["valentine", "cinta", "14 februari", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const hearts: DesignElement[] = []
        const colors = ["#f43f5e", "#fb7185", "#fda4af", "#e11d48"]
        let seed = 41
        const rnd = (n: number) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n) }
        for (let i = 0; i < 14; i++) {
          const s = 40 + rnd(90)
          hearts.push(shp("heart", { x: rnd(IG - s), y: rnd(IG - s), w: s, h: s * 0.9, fill: colors[i % 4], opacity: 0.5 + rnd(50) / 100, rotation: rnd(40) - 20 }))
        }
        return doc("canvas", IG, IG, gradient("#4c0519", "#be123c", 160), [
          page("Valentine", gradient("#4c0519", "#be123c", 160), [
            ...hearts,
            txt("14 februari", { x: 0, y: 360, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecdd3", align: "center", upper: true, ls: 8 }),
            txt("Happy\nValentine", { x: 90, y: 430, w: IG - 180, h: 300, size: 120, font: F.serif, weight: 700, color: "#fff1f2", align: "center", lh: 1.1 }),
            txt("cinta untuk semua yang sabar\nmenemani hari-hari kita", { x: 140, y: 770, w: IG - 280, h: 100, size: 29, font: F.body, weight: 400, color: "#ffe4e6", align: "center", lh: 1.4 }),
            img(asset("heart-big"), { x: 430, y: 890, w: 220, h: 198 }),
          ]),
        ])
      },
    },
    {
      slug: "valentine-coupon-post",
      name: "Valentine — Love Coupon Post",
      category: CAT,
      type: "canvas",
      tags: ["valentine", "coupon", "keluarga", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const coupons = ["satu kopi dibuatkan", "dandanan rambut gratis", "kendali remote 1 malam", "jajan tanpa interogasi"]
        return doc("canvas", IG, IG, solid("#fff1f2"), [
          page("Coupon", solid("#fff1f2"), [
            txt("love coupons · edisi 14 februari", { x: 0, y: 130, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#be123c", align: "center", upper: true, ls: 5 }),
            txt("Kupon\nCinta", { x: 90, y: 200, w: IG - 180, h: 240, size: 110, font: F.serif, weight: 700, color: "#9f1239", align: "center", lh: 1.1 }),
            ...coupons.flatMap((c, i) => {
              const x = 100 + (i % 2) * 450
              const y = 480 + Math.floor(i / 2) * 230
              return [
                rect({ x, y, w: 430, h: 200, fill: "#ffffff", stroke: "#fda4af", sw: 3, r: 18, dash: [12, 8] }),
                ellipse({ x: x - 20, y: y + 76, w: 48, h: 48, fill: "#fff1f2" }),
                ellipse({ x: x + 402, y: y + 76, w: 48, h: 48, fill: "#fff1f2" }),
                txt(c, { x: x + 40, y, w: 350, h: 200, size: 27, font: F.hand, weight: 700, color: "#9f1239", align: "center", vAlign: "middle", lh: 1.3 }),
              ] as DesignElement[]
            }),
            txt("cetak, potong, dan sebar ke orang tersayang", { x: 0, y: 970, w: IG, h: 46, size: 25, font: F.hand, weight: 400, color: "#be123c", align: "center" }),
          ]),
        ])
      },
    },
    {
      slug: "valentine-story-card",
      name: "Valentine Story — Kartu Cinta",
      category: CAT,
      type: "canvas",
      tags: ["story", "valentine", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "valentine-story-card", bg: gradient("#be123c", "#fb7185", 155), ink: "#fff1f2", sub: "#ffe4e6", card: "#9f1239", cardInk: "#ffe4e6", accent: GOLD_SOFT },
          {
            top: "untuk yang membaca ini",
            main: "Kamu\nadalah\nkartu\nterbaik",
            sub: "selamat hari kasih sayang",
            card: "Tanpa ribuan kata —\nterima kasih sudah setia\nmenemani tiap musim.",
          },
          (d) => {
            d.push(img(asset("heart-big"), { x: 90, y: 1520, w: 240, h: 216, rotation: -8 }))
            d.push(img(asset("heart-big"), { x: 750, y: 300, w: 200, h: 180, rotation: 12 }))
            d.push(...starScatter(9, 90, 400, 900, 500, "#ffe4e6", 331))
          },
        ),
    },
    {
      slug: "valentine-galentine-post",
      name: "Galentine's — Sahabat Post",
      category: CAT,
      type: "canvas",
      tags: ["valentine", "galentine", "sahabat", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fdf4ff"), [
          page("Galentine", solid("#fdf4ff"), [
            txt("13 februari · galentine's day", { x: 0, y: 160, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#c026d3", align: "center", upper: true, ls: 6 }),
            txt("Sahabat\nadalah cinta\njuga", { x: 90, y: 250, w: IG - 180, h: 320, size: 100, font: F.pop, weight: 800, color: "#a21caf", align: "center", lh: 1.12 }),
            txt("kirim cinta ke grup chat sahabatmu —\nyang selalu menampung curhat jam 2 pagi", { x: 140, y: 620, w: IG - 280, h: 110, size: 29, font: F.body, weight: 400, color: "#d946ef", align: "center", lh: 1.4 }),
            rect({ x: 250, y: 780, w: 580, h: 110, fill: "#f0abfc", r: 55 }),
            txt("brunch bareng, yuk!", { x: 250, y: 780, w: 580, h: 110, size: 33, font: F.sans, weight: 700, color: "#701a75", align: "center", vAlign: "middle" }),
            img(asset("flower"), { x: 90, y: 830, w: 160, h: 160, rotation: -10 }),
            img(asset("flower"), { x: 830, y: 100, w: 160, h: 160, rotation: 12 }),
          ]),
        ]),
    },
    {
      slug: "valentine-promo-banner",
      name: "Banner Promo Valentine",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "valentine", "promo", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "valentine-promo-banner", bg: gradient("#be123c", "#f43f5e", 120), strip: GOLD_SOFT, ink: "#fff1f2", accent: "#ffe4e6", sub: "#fecdd3" },
          {
            left: "PROMO\n14 FEB",
            main: "Paket Pasangan\nDiskon 25%",
            sub: "Belanja berdua hemat — kue, bunga, dan hadiah kecil yang manis",
            right: "Semua cabang & online\nKode: CINTA25\nberlaku 12–15 Feb",
          },
          (els) => {
            els.push(img(asset("heart-big"), { x: 90, y: 320, w: 240, h: 216, rotation: -8 }))
            els.push(img(asset("heart-big"), { x: 1660, y: 330, w: 200, h: 180, rotation: 10 }))
            els.push(...starScatter(8, 500, 60, 900, 60, "#ffe4e6", 341))
          },
        ),
    },
  ]
}

/* ============================ Christmas ============================ */

function christmasTpls(): TemplateSpec[] {
  return [
    {
      slug: "natal-tree-night",
      name: "Natal — Pohon di Malam Post",
      category: CAT,
      type: "canvas",
      tags: ["natal", "christmas", "25 desember", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#0c1a2c"), [
          page("Natal", solid("#0c1a2c"), [
            ...starScatter(12, 80, 60, 920, 300, "#e2e8f0", 351),
            txt("25 desember", { x: 0, y: 180, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#93c5fd", align: "center", upper: true, ls: 8 }),
            txt("Merry\nChristmas", { x: 90, y: 270, w: IG - 180, h: 300, size: 120, font: F.serif, weight: 700, color: GOLD_SOFT, align: "center", lh: 1.12 }),
            txt("damai dan sukacita untuk keluarga\nkita semua", { x: 140, y: 610, w: IG - 280, h: 100, size: 29, font: F.body, weight: 400, color: "#dbeafe", align: "center", lh: 1.4 }),
            img(asset("tree-xmas"), { x: 390, y: 700, w: 300, h: 360 }),
            img(asset("bauble"), { x: 130, y: 800, w: 190, h: 228, rotation: -6 }),
            img(asset("snowflake"), { x: 800, y: 790, w: 170, h: 170, opacity: 0.9 }),
          ]),
        ]),
    },
    {
      slug: "natal-red-elegant",
      name: "Natal — Merah Elegan Post",
      category: CAT,
      type: "canvas",
      tags: ["natal", "christmas", "greeting", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#b91c1c"), [
          page("Natal merah", solid("#b91c1c"), [
            ...cornerOrnaments(56, 56, IG - 112, IG - 112, GOLD_SOFT),
            txt("selamat natal & tahun baru", { x: 0, y: 190, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Sukacita\ndunia\nitu nyata", { x: 90, y: 280, w: IG - 180, h: 330, size: 104, font: F.serif, weight: 700, color: "#fff1f2", align: "center", lh: 1.12 }),
            rule(440, 650, 200, GOLD_SOFT, 5),
            txt("mari berbagi sukacita — salam hangat dari keluarga besar kami", { x: 0, y: 700, w: IG, h: 50, size: 27, font: F.body, weight: 400, color: "#fee2e2", align: "center", italic: true }),
            img(asset("bell-xmas"), { x: 110, y: 790, w: 180, h: 198, rotation: -8 }),
            img(asset("bauble"), { x: 790, y: 790, w: 180, h: 216, rotation: 8 }),
          ]),
        ]),
    },
    {
      slug: "natal-snow-post",
      name: "Natal — Salju Lembut Post",
      category: CAT,
      type: "canvas",
      tags: ["natal", "salju", "winter", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const flakes: DesignElement[] = []
        let seed = 61
        const rnd = (n: number) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n) }
        for (let i = 0; i < 12; i++) {
          const s = 30 + rnd(50)
          flakes.push(img(asset("snowflake"), { x: rnd(IG - s), y: rnd(400), w: s, h: s, opacity: 0.5 + rnd(50) / 100 }))
        }
        return doc("canvas", IG, IG, gradient("#1e3a8a", "#3b82f6", 160), [
          page("Natal salju", gradient("#1e3a8a", "#3b82f6", 160), [
            ...flakes,
            txt("dari kami yang di ujung tropis", { x: 0, y: 430, w: IG, h: 46, size: 25, font: F.sans, weight: 600, color: "#dbeafe", align: "center", upper: true, ls: 5 }),
            txt("Merry\nChristmas", { x: 90, y: 500, w: IG - 180, h: 280, size: 120, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1.05 }),
            txt("semoga hati hangat walau udara tidak", { x: 0, y: 810, w: IG, h: 50, size: 29, font: F.hand, weight: 400, color: "#eff6ff", align: "center" }),
            img(asset("tree-xmas"), { x: 100, y: 870, w: 220, h: 264 }),
            img(asset("bell-xmas"), { x: 800, y: 880, w: 190, h: 209, rotation: 8 }),
          ]),
        ])
      },
    },
    {
      slug: "natal-story-hangout",
      name: "Natal Story — Reuni Keluarga",
      category: CAT,
      type: "canvas",
      tags: ["story", "natal", "keluarga", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "natal-story-hangout", bg: solid("#0c1a2c"), ink: GOLD_SOFT, sub: "#93c5fd", card: "#1e293b", cardInk: "#e2e8f0", accent: "#fbbf24" },
          {
            top: "25 desember · hari raya natal",
            main: "Reuni\ndi rumah\nemak",
            sub: "makan bareng & tukar kado kecil-kecilan",
            card: "Acara dimulai 10.00 WIB —\nbawa kue buatan sendiri kalau sempat.\nSukacita natal, keluarga!",
          },
          (d) => {
            d.push(img(asset("tree-xmas"), { x: 90, y: 1560, w: 260, h: 312 }))
            d.push(img(asset("bauble"), { x: 760, y: 240, w: 220, h: 264, rotation: 6 }))
            d.push(...starScatter(10, 90, 500, 900, 400, "#e2e8f0", 361))
          },
        ),
    },
    {
      slug: "natal-banner-gereja",
      name: "Spanduk Natal Gereja",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "natal", "gereja", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "natal-banner-gereja", bg: solid("#0c1a2c"), strip: GOLD_SOFT, ink: "#f8fafc", accent: "#fbbf24", sub: "#93c5fd" },
          {
            left: "GBI\nSHALOM",
            main: "Merry\nChristmas 2025",
            sub: "Ibadah perayaan natal 25 Desember 09.00 WIB — Damai di bumi, sukacita bagi manusia",
            right: "Sekolah minggu\npukul 08.00\npanggung anak-anak",
          },
          (els) => {
            els.push(img(asset("tree-xmas"), { x: 90, y: 300, w: 220, h: 264 }))
            els.push(img(asset("bell-xmas"), { x: 1680, y: 300, w: 190, h: 209, rotation: 8 }))
            els.push(...starScatter(10, 500, 50, 900, 60, "#e2e8f0", 371))
          },
        ),
    },
    {
      slug: "natal-promo-banner",
      name: "Banner Promo Natal",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "natal", "promo", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "natal-promo-banner", bg: gradient("#b91c1c", "#dc2626", 120), strip: GOLD_SOFT, ink: "#fff1f2", accent: "#fde68a", sub: "#fecaca" },
          {
            left: "SALE\nNATAL",
            main: "Diskon hingga\n50% Hari Ini",
            sub: "Kue natal, hampers, dan mainan anak — gratis bungkus kado untuk pembelian di atas Rp 200 ribu",
            right: "Toko & online\nBerlaku 15–26 Des\nstok terbatas",
          },
          (els) => {
            els.push(img(asset("tree-xmas"), { x: 1690, y: 310, w: 200, h: 240 }))
            els.push(img(asset("gift"), { x: 90, y: 330, w: 220, h: 220, rotation: -6 }))
          },
        ),
    },
    {
      slug: "natal-countdown-post",
      name: "Hitung Mundur Natal — Post",
      category: CAT,
      type: "canvas",
      tags: ["natal", "countdown", "desember", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#14532d"), [
          page("Countdown", solid("#14532d"), [
            txt("hitung mundur", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#86efac", align: "center", upper: true, ls: 8 }),
            txt("25 HARI\nLAGI", { x: 90, y: 260, w: IG - 180, h: 280, size: 130, font: F.display, weight: 400, color: "#ffffff", align: "center", lh: 1.05 }),
            rule(390, 580, 300, "#fbbf24", 6),
            txt("desember 2025 — sampai natal tiba", { x: 0, y: 620, w: IG, h: 50, size: 29, font: F.body, weight: 400, color: "#dcfce7", align: "center", italic: true }),
            txt("ganti angka sesuai hari unggahanmu —\nsimpel dan selalu relevan", { x: 140, y: 710, w: IG - 280, h: 100, size: 27, font: F.hand, weight: 400, color: "#bbf7d0", align: "center", lh: 1.4 }),
            img(asset("tree-xmas"), { x: 110, y: 830, w: 200, h: 240, rotation: -5 }),
            img(asset("bauble"), { x: 790, y: 830, w: 190, h: 228, rotation: 5 }),
          ]),
        ]),
    },
    {
      slug: "natal-santa-post",
      name: "Surat untuk Santa — Kids Post",
      category: CAT,
      type: "canvas",
      tags: ["natal", "anak", "santa", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fdf2f8"), [
          page("Santa", solid("#fdf2f8"), [
            rect({ x: 70, y: 70, w: IG - 140, h: IG - 140, fill: "transparent", stroke: "#f472b6", sw: 4, r: 24 }),
            txt("surat anak-anak · desember", { x: 0, y: 150, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#db2777", align: "center", upper: true, ls: 5 }),
            txt("Dear\nSanta…", { x: 90, y: 230, w: IG - 180, h: 240, size: 110, font: F.script, weight: 700, color: "#9d174d", align: "center", lh: 1.1 }),
            txt("“aku sudah rajin bantu ibu.\naku minta sepeda untuk adikku,\nkalau boleh dua.”", { x: 160, y: 510, w: IG - 320, h: 160, size: 32, font: F.hand, weight: 400, color: "#831843", align: "center", lh: 1.5 }),
            rect({ x: 250, y: 720, w: 580, h: 110, fill: "#fbcfe8", r: 55 }),
            txt("tulis surat versimu di komentar", { x: 250, y: 720, w: 580, h: 110, size: 30, font: F.sans, weight: 700, color: "#9d174d", align: "center", vAlign: "middle" }),
            img(asset("gift"), { x: 110, y: 850, w: 180, h: 180, rotation: -8 }),
            img(asset("tree-xmas"), { x: 780, y: 830, w: 180, h: 216, rotation: 8 }),
          ]),
        ]),
    },
  ]
}

/* ============================ Halloween ============================ */

function halloweenTpls(): TemplateSpec[] {
  return [
    {
      slug: "halloween-pumpkin-post",
      name: "Halloween — Pumpkin Night Post",
      category: CAT,
      type: "canvas",
      tags: ["halloween", "31 oktober", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#1c0a1e", "#3b0764", 160), [
          page("Halloween", gradient("#1c0a1e", "#3b0764", 160), [
            ...starScatter(10, 80, 60, 920, 250, "#c084fc", 381),
            txt("31 oktober", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#c084fc", align: "center", upper: true, ls: 8 }),
            txt("Happy\nHalloween", { x: 90, y: 260, w: IG - 180, h: 280, size: 116, font: F.display, weight: 400, color: "#f97316", align: "center", lh: 1.05 }),
            txt("trick or treat — siapkan permennya ya!", { x: 0, y: 570, w: IG, h: 50, size: 29, font: F.hand, weight: 400, color: "#e9d5ff", align: "center" }),
            img(asset("pumpkin"), { x: 330, y: 640, w: 420, h: 382 }),
            img(asset("pumpkin"), { x: 90, y: 780, w: 230, h: 209, rotation: -8 }),
            img(asset("pumpkin"), { x: 770, y: 800, w: 210, h: 191, rotation: 9 }),
          ]),
        ]),
    },
    {
      slug: "halloween-party-post",
      name: "Halloween Party — Undangan Post",
      category: CAT,
      type: "canvas",
      tags: ["halloween", "party", "undangan", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#0f0518"), [
          page("Party", solid("#0f0518"), [
            rect({ x: 60, y: 60, w: IG - 120, h: IG - 120, fill: "transparent", stroke: "#a855f7", sw: 4, r: 30, dash: [26, 18] }),
            txt("you are invited", { x: 0, y: 180, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#c084fc", align: "center", upper: true, ls: 8 }),
            txt("SPOOKY\nNIGHT\nPARTY", { x: 90, y: 260, w: IG - 180, h: 330, size: 110, font: F.display, weight: 400, color: "#a855f7", align: "center", lh: 1.08 }),
            txt("kostum terbaik = tiket gratis · lomba antar tim", { x: 0, y: 630, w: IG, h: 50, size: 28, font: F.body, weight: 400, color: "#e9d5ff", align: "center" }),
            rect({ x: 240, y: 730, w: 600, h: 110, fill: "#7e22ce", r: 20 }),
            txt("Jum'at, 31 Okt · 19.00 WIB · Rooftop Bar", { x: 240, y: 730, w: 600, h: 110, size: 27, font: F.sans, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }),
            img(asset("pumpkin"), { x: 90, y: 740, w: 150, h: 136, rotation: -8 }),
            img(asset("pumpkin"), { x: 840, y: 740, w: 150, h: 136, rotation: 8 }),
          ]),
        ]),
    },
    {
      slug: "halloween-story",
      name: "Halloween Story — Night Vibes",
      category: CAT,
      type: "canvas",
      tags: ["story", "halloween", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "halloween-story", bg: gradient("#1c0a1e", "#3b0764", 170), ink: "#f97316", sub: "#c084fc", card: "#2e1065", cardInk: "#e9d5ff", accent: "#a855f7" },
          {
            top: "31 oktober · malam terakhir oktober",
            main: "Siap-\nsiap\nhantu\nDatang",
            sub: "stok permen jangan lupa",
            card: "Kostum apa tahun ini?\nKami tim pumpkin —\nshare vibe kamu di reply!",
          },
          (d) => {
            d.push(img(asset("pumpkin"), { x: 90, y: 1580, w: 260, h: 236, rotation: -6 }))
            d.push(...starScatter(11, 90, 400, 900, 500, "#c084fc", 391))
          },
        ),
    },
    {
      slug: "halloween-cafe-banner",
      name: "Spanduk Halloween Kafe",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "halloween", "kafe", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "halloween-cafe-banner", bg: solid("#0f0518"), strip: "#f97316", ink: "#f5f3ff", accent: "#f97316", sub: "#c084fc" },
          {
            left: "KOPI\nSERAM",
            main: "Halloween Menu\nDiskon 31%",
            sub: "Es kopi labu & pastry spesial 31 Oktober — datang berkostum, dapat upgrade gratis",
            right: "31 Okt saja\n10.00–22.00 WIB\ncabang semua",
          },
          (els) => {
            els.push(img(asset("pumpkin"), { x: 90, y: 320, w: 230, h: 209, rotation: -6 }))
            els.push(img(asset("pumpkin"), { x: 1680, y: 330, w: 210, h: 191, rotation: 7 }))
          },
        ),
    },
  ]
}

/* ============================ Teacher's day & school ============================ */

function schoolTpls(): TemplateSpec[] {
  return [
    {
      slug: "guru-post-terimakasih",
      name: "Hari Guru — Terima Kasih Post",
      category: CAT,
      type: "canvas",
      tags: ["hari guru", "25 november", "sekolah", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#eff6ff"), [
          page("Guru", solid("#eff6ff"), [
            txt("25 november · hari guru nasional", { x: 0, y: 150, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#1d4ed8", align: "center", upper: true, ls: 5 }),
            txt("Terima\nKasih, Guru", { x: 90, y: 230, w: IG - 180, h: 300, size: 110, font: F.serif, weight: 700, color: "#1e3a8a", align: "center", lh: 1.12 }),
            txt("“guru adalah pahlawan tanpa tanda jasa” —\nhari ini dan setiap hari, terima kasih", { x: 140, y: 580, w: IG - 280, h: 110, size: 29, font: F.body, weight: 400, color: "#1e40af", align: "center", lh: 1.4 }),
            rect({ x: 250, y: 740, w: 580, h: 110, fill: "#3b82f6", r: 55 }),
            txt("tag gurumu yang terhebat!", { x: 250, y: 740, w: 580, h: 110, size: 31, font: F.sans, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }),
            img(asset("pencil"), { x: 110, y: 850, w: 170, h: 170, rotation: -10 }),
            img(asset("book-open"), { x: 790, y: 850, w: 190, h: 143, rotation: 8 }),
          ]),
        ]),
    },
    {
      slug: "guru-story-salim",
      name: "Hari Guru Story — Salaman",
      category: CAT,
      type: "canvas",
      tags: ["story", "hari guru", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "guru-story-salim", bg: gradient("#1e3a8a", "#3b82f6", 160), ink: "#ffffff", sub: "#bfdbfe", card: "#1e40af", cardInk: "#dbeafe", accent: GOLD_SOFT },
          {
            top: "25 november · hari guru nasional",
            main: "Satu\nguru,\nseribu mimpi",
            sub: "salam bu guru & bapak guru kita",
            card: "Kelas kita dulu sunyi bila beliau absen.\nSemoga kebaikan beliau balik berlipat.\n#HariGuruNasional",
          },
          (d) => {
            d.push(img(asset("pencil"), { x: 90, y: 1580, w: 230, h: 230, rotation: -10 }))
            d.push(img(asset("book-open"), { x: 740, y: 260, w: 250, h: 188, rotation: 6 }))
          },
        ),
    },
    {
      slug: "back-to-school-post",
      name: "Back to School — Post Semangat",
      category: CAT,
      type: "canvas",
      tags: ["back to school", "sekolah", "semester", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fefce8"), [
          page("Backschool", solid("#fefce8"), [
            rect({ x: 0, y: 0, w: IG, h: 200, fill: "#0f172a" }),
            txt("SEMESTER BARU, SEMANGAT BARU", { x: 0, y: 70, w: IG, h: 60, size: 40, font: F.pop, weight: 800, color: "#fde047", align: "center" }),
            txt("Back to\nSchool!", { x: 90, y: 260, w: IG - 180, h: 300, size: 120, font: F.display, weight: 400, color: "#0f172a", align: "center", lh: 1.05 }),
            ...[["Alat tulis lengkap", "diskon 20%"], ["Seragam & sepatu", "gratis ongkir"], ["Tas anak semua merek", "beli 2 hemat 50rb"]].flatMap(([t, d], i) => {
              const y = 620 + i * 110
              return [
                rect({ x: 110, y, w: IG - 220, h: 84, fill: "#ffffff", stroke: "#fde047", sw: 3, r: 42 }),
                txt(t, { x: 150, y, w: 400, h: 84, size: 27, font: F.sans, weight: 700, color: "#0f172a", vAlign: "middle" }),
                txt(d, { x: 600, y, w: 320, h: 84, size: 26, font: F.sans, weight: 700, color: "#ca8a04", align: "right", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("berlaku 7–20 Januari · toko buku seluruh cabang", { x: 0, y: 970, w: IG, h: 46, size: 25, font: F.sans, weight: 600, color: "#a16207", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "back-to-school-checklist",
      name: "Checklist Seragam — Story Parenting",
      category: CAT,
      type: "canvas",
      tags: ["story", "checklist", "sekolah", "9:16"],
      width: 1080,
      height: 1920,
      build: () => {
        const items = ["seragam rapi", "sepatu & kaos kaki", "alat tulis lengkap", "buku & jadwal", "bekal sehat", "botol minum"]
        return doc("canvas", 1080, 1920, solid("#f8fafc"), [
          page("Checklist", solid("#f8fafc"), [
            txt("malam sebelum hari pertama sekolah", { x: 0, y: 150, w: STORY_W, h: 46, size: 27, font: F.sans, weight: 600, color: "#64748b", align: "center", upper: true, ls: 4 }),
            txt("Checklist\nSiap Sekolah", { x: 90, y: 230, w: STORY_W - 180, h: 200, size: 88, font: F.pop, weight: 800, color: "#0f172a", align: "center", lh: 1.1 }),
            ...items.flatMap((it, i) => {
              const y = 500 + i * 170
              return [
                rect({ x: 90, y, w: STORY_W - 180, h: 140, fill: "#ffffff", stroke: "#e2e8f0", sw: 2, r: 20 }),
                rect({ x: 130, y: y + 40, w: 60, h: 60, fill: "transparent", stroke: "#f59e0b", sw: 5, r: 12 }),
                txt(it, { x: 230, y, w: 560, h: 140, size: 36, font: F.sans, weight: 600, color: "#1e293b", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("screenshot & centang satu-satu — good luck, anak hebat!", { x: 0, y: 1760, w: STORY_W, h: 50, size: 28, font: F.hand, weight: 400, color: "#64748b", align: "center" }),
          ]),
        ])
      },
    },
    {
      slug: "earth-day-post",
      name: "Earth Day — Post Hijau",
      category: CAT,
      type: "canvas",
      tags: ["earth day", "lingkungan", "22 april", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#052e16", "#166534", 160), [
          page("Earth", gradient("#052e16", "#166534", 160), [
            img(asset("earth"), { x: 290, y: 140, w: 500, h: 500 }),
            txt("22 april · earth day", { x: 0, y: 660, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#bbf7d0", align: "center", upper: true, ls: 7 }),
            txt("Satu Bumi,\nTanggung Jawab Kita", { x: 90, y: 730, w: IG - 180, h: 230, size: 76, font: F.pop, weight: 800, color: "#f0fdf4", align: "center", lh: 1.15 }),
            txt("bawa tumbler, hemat plastik, tanam satu pohon —\nkebiasaan kecil, dampak besar", { x: 140, y: 960, w: IG - 280, h: 100, size: 27, font: F.body, weight: 400, color: "#dcfce7", align: "center", lh: 1.4 }),
          ]),
        ]),
    },
    {
      slug: "mothers-day-post",
      name: "Mother's Day — Post Hangat",
      category: CAT,
      type: "canvas",
      tags: ["mothers day", "ibu", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fdf2f8"), [
          page("Mother", solid("#fdf2f8"), [
            img(asset("flower"), { x: 70, y: 120, w: 220, h: 220, rotation: -8 }),
            img(asset("flower"), { x: 790, y: 700, w: 220, h: 220, rotation: 10 }),
            txt("selamat hari ibu", { x: 0, y: 200, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#be185d", align: "center", upper: true, ls: 6 }),
            txt("Pulang\nke ibu\nselalu oke", { x: 90, y: 280, w: IG - 180, h: 330, size: 100, font: F.serif, weight: 700, color: "#9d174d", align: "center", lh: 1.14 }),
            txt("sejauh apa pun pergi, rumah tetap di masakan beliau", { x: 0, y: 660, w: IG, h: 50, size: 28, font: F.body, weight: 400, color: "#db2777", align: "center", italic: true }),
            rect({ x: 250, y: 790, w: 580, h: 110, fill: "#f9a8d4", r: 55 }),
            txt("telepon ibumu hari ini", { x: 250, y: 790, w: 580, h: 110, size: 31, font: F.sans, weight: 700, color: "#831843", align: "center", vAlign: "middle" }),
            img(asset("heart-big"), { x: 430, y: 920, w: 220, h: 198 }),
          ]),
        ]),
    },
    {
      slug: "fathers-day-banner",
      name: "Father's Day — Banner Kopi",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "fathers day", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "fathers-day-banner", bg: solid("#1c1917"), strip: "#fbbf24", ink: "#fafaf9", accent: "#fde68a", sub: "#d6d3d1" },
          {
            left: "FATHER'S\nDAY",
            main: "Kopi Berdua\nAyah-anak, Gratis Refill",
            sub: "12 November saja — bawa ayahmu, ceritakan hal-hal kecil yang jadi besar",
            right: "Kopi Senja\n08.00–21.00\nsemua cabang",
          },
          (els) => {
            els.push(img(asset("coffee"), { x: 90, y: 320, w: 230, h: 230 }))
            els.push(img(asset("coffee"), { x: 1680, y: 330, w: 200, h: 200 }))
          },
        ),
    },
  ]
}

/* ============================ export ============================ */

export const SEASONAL_FESTIVE_TPLS: TemplateSpec[] = [
  ...valentineTpls(),
  ...christmasTpls(),
  ...halloweenTpls(),
  ...schoolTpls(),
]
