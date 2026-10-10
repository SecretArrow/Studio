/**
 * Seasonal pack — Retail & sale campaigns tied to holidays.
 * -----------------------------------------------------------
 * 25 original editable templates: double-date mega sales (10.10/11.11/12.12),
 * Ramadan & THR sale, Christmas & NYE sale, back-to-school, 17-an discount,
 * payday weekend, flash midnight sale, end-of-year clearance.
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
  BANNER_H,
  BANNER_W,
  EMERALD_DEEP,
  GOLD,
  GOLD_SOFT,
  IG,
  MERAH,
  banner,
  cornerOrnaments,
  starScatter,
  storyTemplate,
} from "./seasonal-shared"

const CAT = "seasonal"
const STORY_W = 1080
const STORY_H = 1920

/* ============================ double-date mega sales ============================ */

interface DoubleDateStyle {
  slug: string
  date: string
  name: string
  bg: ReturnType<typeof solid> | ReturnType<typeof gradient>
  ink: string
  sub: string
  accent: string
  deco: (els: DesignElement[]) => void
}

const DOUBLE_DATES: DoubleDateStyle[] = [
  {
    slug: "sale-1010",
    date: "10.10",
    name: "Sale 10.10 — Oktober Gacor",
    bg: solid("#1e1b4b"),
    ink: "#fef9c3",
    sub: "#c4b5fd",
    accent: "#fbbf24",
    deco: (d) => {
      d.push(img(asset("confetti"), { x: 40, y: 60, w: 1000, h: 500, opacity: 0.7 }))
      d.push(...starScatter(9, 100, 500, 880, 300, GOLD_SOFT, 401))
    },
  },
  {
    slug: "sale-1111",
    date: "11.11",
    name: "Sale 11.11 — Belanja Singles Day",
    bg: gradient("#7f1d1d", "#dc2626", 155),
    ink: "#fff1f2",
    sub: "#fecaca",
    accent: GOLD_SOFT,
    deco: (d) => {
      d.push(rect({ x: 0, y: 0, w: 24, h: IG, fill: GOLD_SOFT }))
      d.push(rect({ x: IG - 24, y: 0, w: 24, h: IG, fill: GOLD_SOFT }))
      d.push(img(asset("firework"), { x: 760, y: 90, w: 240, h: 240, opacity: 0.9 }))
    },
  },
  {
    slug: "sale-1212",
    date: "12.12",
    name: "Sale 12.12 — Tutup Tahun Hemat",
    bg: gradient("#1e3a8a", "#3b82f6", 155),
    ink: "#eff6ff",
    sub: "#bfdbfe",
    accent: "#fde047",
    deco: (d) => {
      d.push(img(asset("confetti"), { x: 40, y: 620, w: 1000, h: 500, opacity: 0.75 }))
      d.push(...starScatter(8, 100, 100, 880, 250, "#e0f2fe", 411))
    },
  },
]

const DOUBLE_DATE_CONTENTS = [
  {
    kicker: "flash sale 24 jam",
    discount: "70%",
    title: "Mega Sale",
    detail: "semua kategori ikut — kode tambahan di keranjang",
    cta: "checkout sebelum jam 12 malam!",
  },
  {
    kicker: "diskon bertumpuk",
    discount: "50%",
    title: "Gratis Ongkir\nse-Indonesia",
    detail: "minimum belanja Rp 50 ribu — semua metode bayar",
    cta: "stok terbatas, siapa cepat dia dapat",
  },
  {
    kicker: "spesial tanggal kembar",
    discount: "45%",
    title: "Sale Berantai",
    detail: "voucher per kategori + cashback e-wallet",
    cta: "buka aplikasi jam 00.00 ya!",
  },
]

function doubleDateTpls(): TemplateSpec[] {
  const tpls: TemplateSpec[] = []
  DOUBLE_DATES.forEach((st, si) => {
    const c = DOUBLE_DATE_CONTENTS[si]
    // square post
    tpls.push({
      slug: `${st.slug}-post`,
      name: `${st.name} — Post`,
      category: CAT,
      type: "canvas",
      tags: ["sale", "promo", "diskon", "double date", "instagram"],
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
            txt(c.kicker, { x: 0, y: 150, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: st.sub, align: "center", upper: true, ls: 7 }),
            txt(st.date, { x: 0, y: 220, w: IG, h: 260, size: 300, font: F.display, weight: 400, color: st.accent, align: "center" }),
            shp("badge", { x: 640, y: 420, w: 220, h: 220, fill: MERAH, rotation: 14 }),
            txt(`- ${c.discount}`, { x: 640, y: 460, w: 220, h: 110, size: 64, font: F.display, weight: 400, color: "#ffffff", align: "center", rotation: 14 }),
            txt(c.title, { x: 90, y: 520, w: IG - 180, h: 240, size: 88, font: F.pop, weight: 800, color: st.ink, align: "center", lh: 1.1 }),
            txt(c.detail, { x: 130, y: 790, w: IG - 260, h: 50, size: 28, font: F.sans, weight: 500, color: st.sub, align: "center" }),
            rect({ x: 190, y: 880, w: 700, h: 120, fill: st.accent, r: 60 }),
            txt(c.cta, { x: 190, y: 880, w: 700, h: 120, size: 30, font: F.sans, weight: 800, color: st.slug.includes("1111") ? "#7f1d1d" : "#1e1b4b", align: "center", vAlign: "middle" }),
          ]),
        ]),
    })
    // story
    tpls.push({
      slug: `${st.slug}-story`,
      name: `${st.name} — Story`,
      category: CAT,
      type: "canvas",
      tags: ["story", "sale", "promo", "9:16"],
      width: STORY_W,
      height: STORY_H,
      build: () =>
        storyTemplate(
          { slug: st.slug, bg: st.bg, ink: st.ink, sub: st.sub, card: "rgba(0, 0, 0, 0.35)", cardInk: st.ink, accent: st.accent },
          {
            top: `${st.date} mega sale`,
            main: st.date,
            sub: `diskon sampai ${c.discount} hari ini saja`,
            card: c.detail + "\n" + c.cta,
          },
          (d) => {
            st.deco(d)
            d.push(shp("badge", { x: 360, y: 1150, w: 340, h: 340, fill: MERAH, rotation: 12 }))
            d.push(txt(`- ${c.discount}`, { x: 360, y: 1250, w: 340, h: 140, size: 100, font: F.display, weight: 400, color: "#ffffff", align: "center", rotation: 12 }))
          },
        ),
    })
  })
  return tpls
}

/* ============================ holiday sales ============================ */

function holidaySaleTpls(): TemplateSpec[] {
  return [
    {
      slug: "sale-ramadhan-post",
      name: "Sale Ramadan — Thrift & Serba Ada",
      category: CAT,
      type: "canvas",
      tags: ["sale", "ramadan", "promo", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid(EMERALD_DEEP), [
          page("Ramadan sale", solid(EMERALD_DEEP), [
            img(asset("lantern"), { x: 70, y: 70, w: 190, h: 247, rotation: -6 }),
            img(asset("lantern"), { x: 830, y: 90, w: 170, h: 221, rotation: 6 }),
            txt("ramadan sale 1447 h", { x: 0, y: 200, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 6 }),
            txt("Serba\nDiskon 30%", { x: 90, y: 290, w: IG - 180, h: 290, size: 96, font: F.pop, weight: 800, color: GOLD_SOFT, align: "center", lh: 1.1 }),
            txt("baju lebaran · kurma & takjil · perlengkapan masjid", { x: 0, y: 620, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#d1fae5", align: "center" }),
            rect({ x: 190, y: 720, w: 700, h: 110, fill: GOLD, r: 55 }),
            txt("kode: RAMADHAN30", { x: 190, y: 720, w: 700, h: 110, size: 34, font: F.sans, weight: 800, color: "#064e3b", align: "center", vAlign: "middle" }),
            txt("selama bulan suci · gratis ongkir se-Jabodetabek", { x: 0, y: 880, w: IG, h: 50, size: 26, font: F.body, weight: 400, color: "#a7f3d0", align: "center", italic: true }),
            img(asset("ketupat"), { x: 90, y: 900, w: 160, h: 192, rotation: -7 }),
            img(asset("crescent-star"), { x: 810, y: 900, w: 160, h: 160, rotation: 10 }),
          ]),
        ]),
    },
    {
      slug: "sale-thr-post",
      name: "THR Sale — Serba Serbu Post",
      category: CAT,
      type: "canvas",
      tags: ["sale", "thr", "lebaran", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#065f46", "#059669", 150), [
          page("THR sale", gradient("#065f46", "#059669", 150), [
            txt("thr turun, harga turun", { x: 0, y: 160, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#a7f3d0", align: "center", upper: true, ls: 6 }),
            txt("SERBA\nSERBU\nTHR!", { x: 90, y: 250, w: IG - 180, h: 340, size: 120, font: F.display, weight: 400, color: "#fffbeb", align: "center", lh: 1.02 }),
            ...["Baju lebaran keluarga — mulai 99rb", "Sepatu & sandal — 40% off", "Hampers & parcel — gratis kartu ucapan"].flatMap((line, i) => {
              const y = 630 + i * 100
              return [
                rect({ x: 100, y, w: IG - 200, h: 76, fill: "#064e3b", r: 38 }),
                txt(line, { x: 140, y, w: IG - 280, h: 76, size: 26, font: F.sans, weight: 600, color: "#d1fae5", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            img(asset("ketupat-duo"), { x: 100, y: 920, w: 170, h: 170, rotation: -7 }),
            img(asset("crescent-star"), { x: 800, y: 920, w: 150, h: 150, rotation: 9 }),
          ]),
        ]),
    },
    {
      slug: "sale-thr-story",
      name: "THR Sale Story — Swipe Up",
      category: CAT,
      type: "canvas",
      tags: ["story", "thr", "sale", "9:16"],
      width: STORY_W,
      height: STORY_H,
      build: () =>
        storyTemplate(
          { slug: "sale-thr-story", bg: gradient("#065f46", "#059669", 165), ink: "#fffbeb", sub: "#a7f3d0", card: "#064e3b", cardInk: "#d1fae5", accent: GOLD },
          {
            top: "thr sale · 1 minggu saja",
            main: "Diskon\nsampai\n70%",
            sub: "serba serbu sebelum mudik",
            card: "Semua kategori ikut sale.\nKetuk stiker link untuk langsung\ncheckout — jangan sampai kehabisan!",
          },
          (d) => {
            d.push(img(asset("ketupat-duo"), { x: 90, y: 1600, w: 240, h: 240, rotation: -7 }))
            d.push(...starScatter(9, 100, 300, 880, 400, GOLD_SOFT, 421))
          },
        ),
    },
    {
      slug: "sale-natal-post",
      name: "Christmas Sale — Toko Kado",
      category: CAT,
      type: "canvas",
      tags: ["sale", "natal", "kado", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#7f1d1d"), [
          page("Natal sale", solid("#7f1d1d"), [
            ...cornerOrnaments(50, 50, IG - 100, IG - 100, GOLD_SOFT),
            img(asset("tree-xmas"), { x: 90, y: 100, w: 190, h: 228 }),
            img(asset("bauble"), { x: 810, y: 110, w: 180, h: 216, rotation: 7 }),
            txt("christmas sale 2025", { x: 0, y: 200, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Kado\nDiskon 50%", { x: 90, y: 290, w: IG - 180, h: 290, size: 100, font: F.serif, weight: 700, color: GOLD_SOFT, align: "center", lh: 1.1 }),
            txt("bungkus kado gratis · kartu ucapan custom", { x: 0, y: 620, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#fee2e2", align: "center" }),
            rect({ x: 190, y: 720, w: 700, h: 110, fill: "#fff1f2", r: 55 }),
            txt("15–26 Desember · semua cabang", { x: 190, y: 720, w: 700, h: 110, size: 31, font: F.sans, weight: 800, color: "#7f1d1d", align: "center", vAlign: "middle" }),
            img(asset("gift"), { x: 110, y: 860, w: 190, h: 190, rotation: -6 }),
            img(asset("bell-xmas"), { x: 780, y: 870, w: 180, h: 198, rotation: 7 }),
          ]),
        ]),
    },
    {
      slug: "sale-natal-banner",
      name: "Spanduk Christmas Sale",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "natal", "sale", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "sale-natal-banner", bg: gradient("#7f1d1d", "#b91c1c", 120), strip: GOLD_SOFT, ink: "#fff1f2", accent: "#fde68a", sub: "#fecaca" },
          {
            left: "CHRISTMAS\nSALE",
            main: "Diskon Kado\nSampai 50%",
            sub: "Hampers, parsel, dan mainan — gratis bungkus kado & kartu ucapan custom",
            right: "15–26 Desember\nsemua cabang &\ntoko online",
          },
          (els) => {
            els.push(img(asset("tree-xmas"), { x: 90, y: 300, w: 210, h: 252 }))
            els.push(img(asset("gift"), { x: 1680, y: 320, w: 210, h: 210, rotation: 7 }))
            els.push(...starScatter(8, 500, 50, 900, 55, "#fde68a", 431))
          },
        ),
    },
    {
      slug: "sale-nye-post",
      name: "New Year Sale — Tutup Tahun Post",
      category: CAT,
      type: "canvas",
      tags: ["sale", "tahun baru", "clearance", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#0b0f1e"), [
          page("NYE sale", solid("#0b0f1e"), [
            img(asset("firework"), { x: 70, y: 70, w: 230, h: 230 }),
            img(asset("firework-duo"), { x: 620, y: 100, w: 380, h: 253 }),
            txt("new year sale", { x: 0, y: 360, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#cbd5e1", align: "center", upper: true, ls: 7 }),
            txt("Tutup Tahun\nDiskon Gede", { x: 90, y: 440, w: IG - 180, h: 280, size: 92, font: F.display, weight: 400, color: GOLD_SOFT, align: "center", lh: 1.06 }),
            txt("clearance semua gudang — stok terakhir", { x: 0, y: 750, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#e2e8f0", align: "center" }),
            rect({ x: 190, y: 860, w: 700, h: 120, fill: MERAH, r: 60 }),
            txt("26–31 Desember · online & offline", { x: 190, y: 860, w: 700, h: 120, size: 30, font: F.sans, weight: 800, color: "#ffffff", align: "center", vAlign: "middle" }),
          ]),
        ]),
    },
    {
      slug: "sale-nye-story",
      name: "New Year Sale Story — Countdown",
      category: CAT,
      type: "canvas",
      tags: ["story", "tahun baru", "sale", "9:16"],
      width: STORY_W,
      height: STORY_H,
      build: () =>
        storyTemplate(
          { slug: "sale-nye-story", bg: solid("#0b0f1e"), ink: GOLD_SOFT, sub: "#cbd5e1", card: "#111827", cardInk: "#e2e8f0", accent: MERAH },
          {
            top: "new year sale · 26–31 desember",
            main: "Terakhir\nhari ini!",
            sub: "clearance stok terakhir",
            card: "Voucher tambahan di bio.\nAwal tahun mulai rapi —\nmulai dari lemari!",
          },
          (d) => {
            d.push(img(asset("firework"), { x: 90, y: 200, w: 260, h: 260 }))
            d.push(img(asset("firework"), { x: 700, y: 300, w: 220, h: 220, opacity: 0.8 }))
            d.push(img(asset("city-skyline"), { x: 40, y: 1720, w: 1000, h: 160, opacity: 0.9 }))
          },
        ),
    },
    {
      slug: "sale-imlek-banner",
      name: "Spanduk Promo Imlek",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "imlek", "promo", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "sale-imlek-banner", bg: solid("#b91c1c"), strip: GOLD, ink: "#fff1f2", accent: GOLD_SOFT, sub: "#fecaca" },
          {
            left: "PROMO\nIMLEK",
            main: "Angpao Diskon\nSampai 37%",
            sub: "Barang keberuntungan tahun kuda: hiasan, kue keranjang, dan fashion merah",
            right: "12–20 Februari 2026\npembelian di atas 88rb\nberhadiah langsung",
          },
          (els) => {
            els.push(img(asset("angpao"), { x: 90, y: 300, w: 200, h: 240, rotation: -7 }))
            els.push(img(asset("gold-coin"), { x: 1690, y: 330, w: 190, h: 190 }))
            els.push(img(asset("lampion"), { x: 600, y: 330, w: 160, h: 192 }))
          },
        ),
    },
    {
      slug: "sale-agustus-post",
      name: "Diskon 45% — Kemerdekaan Sale",
      category: CAT,
      type: "canvas",
      tags: ["sale", "17 agustus", "kemerdekaan", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid(MERAH), [
          page("Agustus sale", solid(MERAH), [
            img(asset("garland-flag"), { x: 40, y: 40, w: 1000, h: 350, opacity: 0.9 }),
            txt("promo kemerdekaan", { x: 0, y: 330, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Diskon\n45%", { x: 90, y: 420, w: IG - 180, h: 290, size: 140, font: F.display, weight: 400, color: "#fff1f2", align: "center", lh: 1.02 }),
            txt("seperti semangat 45 — belanja berani, harga berani", { x: 0, y: 740, w: IG, h: 50, size: 28, font: F.body, weight: 400, color: "#fee2e2", align: "center", italic: true }),
            rect({ x: 190, y: 850, w: 700, h: 110, fill: "#ffffff", r: 55 }),
            txt("17–22 Agustus · kode MERDEKA45", { x: 190, y: 850, w: 700, h: 110, size: 30, font: F.sans, weight: 800, color: MERAH, align: "center", vAlign: "middle" }),
            img(asset("flag-id"), { x: 90, y: 870, w: 190, h: 146, rotation: -6 }),
            img(asset("flag-id"), { x: 800, y: 870, w: 190, h: 146, rotation: 6 }),
          ]),
        ]),
    },
    {
      slug: "sale-agustus-banner",
      name: "Spanduk Promo Kemerdekaan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "17 agustus", "promo", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "sale-agustus-banner", bg: gradient(MERAH, "#ef4444", 120), strip: "#ffffff", ink: "#fff1f2", accent: "#fde68a", sub: "#fecaca" },
          {
            left: "DIRGAHAYU\nPROMO",
            main: "Diskon 45%\n17–22 Agustus",
            sub: "Semua kategori elektronik & fashion — cicilan 0% s.d. 12 bulan",
            right: "Toko & marketplace\nkode: MERDEKA45\nsementara persediaan",
          },
          (els) => {
            els.push(img(asset("flag-id"), { x: 90, y: 320, w: 240, h: 185, rotation: -6 }))
            els.push(img(asset("garland-flag"), { x: 520, y: 50, w: 800, h: 280, opacity: 0.85 }))
          },
        ),
    },
    {
      slug: "sale-backtoschool-post",
      name: "Back to School Sale — Post",
      category: CAT,
      type: "canvas",
      tags: ["sale", "back to school", "sekolah", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#0f172a"), [
          page("BTS sale", solid("#0f172a"), [
            rect({ x: 0, y: 0, w: IG, h: 190, fill: "#f59e0b" }),
            txt("BACK TO SCHOOL SALE", { x: 0, y: 60, w: IG, h: 70, size: 48, font: F.display, weight: 400, color: "#78350f", align: "center", ls: 3 }),
            txt("Serba 25rb\n& 50rb", { x: 90, y: 260, w: IG - 180, h: 280, size: 110, font: F.pop, weight: 800, color: "#f8fafc", align: "center", lh: 1.08 }),
            ...["Alat tulis & buku tulis", "Tas anak semua ukuran", "Sepatu sekolah putih-hitam"].flatMap((t, i) => {
              const y = 600 + i * 100
              return [
                rect({ x: 110, y, w: IG - 220, h: 76, fill: "#1e293b", r: 38 }),
                txt(t, { x: 150, y, w: 520, h: 76, size: 27, font: F.sans, weight: 600, color: "#e2e8f0", vAlign: "middle" }),
                shp("badge", { x: 820, y: y + 3, w: 70, h: 70, fill: "#f59e0b" }),
              ] as DesignElement[]
            }),
            txt("7–20 Januari · toko buku & distro se-kota", { x: 0, y: 950, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#94a3b8", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "sale-payday-post",
      name: "Payday Sale — Tanggal Gajian",
      category: CAT,
      type: "canvas",
      tags: ["sale", "payday", "gajian", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#312e81", "#6d28d9", 155), [
          page("Payday", gradient("#312e81", "#6d28d9", 155), [
            txt("25–31 setiap bulan", { x: 0, y: 160, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#ddd6fe", align: "center", upper: true, ls: 7 }),
            txt("Payday\nWeek", { x: 90, y: 250, w: IG - 180, h: 290, size: 120, font: F.display, weight: 400, color: "#fde047", align: "center", lh: 1.02 }),
            txt("tanggal tua yang aman: diskon 40% + cashback", { x: 0, y: 580, w: IG, h: 50, size: 28, font: F.body, weight: 400, color: "#e9d5ff", align: "center" }),
            rect({ x: 190, y: 690, w: 700, h: 110, fill: "#fde047", r: 55 }),
            txt("voucher di aplikasi — klaim sekarang", { x: 190, y: 690, w: 700, h: 110, size: 29, font: F.sans, weight: 800, color: "#3b0764", align: "center", vAlign: "middle" }),
            ...starScatter(10, 100, 830, 880, 200, "#c4b5fd", 441),
          ]),
        ]),
    },
    {
      slug: "sale-flash-story",
      name: "Flash Sale Tengah Malam — Story",
      category: CAT,
      type: "canvas",
      tags: ["story", "flash sale", "midnight", "9:16"],
      width: STORY_W,
      height: STORY_H,
      build: () =>
        storyTemplate(
          { slug: "sale-flash-story", bg: solid("#09090b"), ink: "#22d3ee", sub: "#a1a1aa", card: "#18181b", cardInk: "#e4e4e7", accent: "#a3e635" },
          {
            top: "flash sale tengah malam",
            main: "00.00–\n02.00\nWIB",
            sub: "2 jam saja, 1× sebulan",
            card: "Diskon ganda: produk 50% +\nvoucher toko 20%.\nSetel alarm — jam 12 malam!",
          },
          (d) => {
            d.push(rect({ x: 50, y: 50, w: STORY_W - 100, h: STORY_H - 100, fill: "transparent", stroke: "#22d3ee", sw: 4, r: 44, dash: [24, 18] }))
            d.push(shp("star", { x: 800, y: 1700, w: 130, h: 130, fill: "#a3e635", rotation: 18 }))
          },
        ),
    },
    {
      slug: "sale-clearance-post",
      name: "Clearance Akhir Musim — Post",
      category: CAT,
      type: "canvas",
      tags: ["sale", "clearance", "musim", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fff7ed"), [
          page("Clearance", solid("#fff7ed"), [
            rect({ x: -60, y: 800, w: IG + 120, h: 300, fill: "#f97316", rotation: -3 }),
            shp("badge", { x: 700, y: 80, w: 210, h: 210, fill: MERAH, rotation: 12 }),
            txt("40%", { x: 700, y: 130, w: 210, h: 90, size: 62, font: F.display, weight: 400, color: "#ffffff", align: "center", rotation: 12 }),
            txt("CLEARANCE", { x: 0, y: 150, w: IG, h: 170, size: 150, font: F.display, weight: 400, color: "#9a3412", align: "center", ls: 2 }),
            txt("akhir musim — semua harus pergi", { x: 0, y: 350, w: IG, h: 60, size: 34, font: F.pop, weight: 700, color: "#c2410c", align: "center" }),
            txt("koleksi lama diskon 40% · beli 2 gratis ongkir ·\ntidak bisa retur (maklum, harga gila)", { x: 130, y: 440, w: IG - 260, h: 110, size: 28, font: F.sans, weight: 600, color: "#9a3412", align: "center", lh: 1.4 }),
            txt("kunjungi gerai terdekat — stok bervariasi tiap cabang", { x: 0, y: 870, w: IG, h: 50, size: 27, font: F.body, weight: 500, color: "#fff7ed", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "sale-mudik-banner",
      name: "Spanduk Promo Mudik",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "mudik", "promo", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "sale-mudik-banner", bg: gradient("#065f46", "#047857", 120), strip: GOLD_SOFT, ink: "#ecfdf5", accent: "#fde68a", sub: "#a7f3d0" },
          {
            left: "PROMO\nMUDIK",
            main: "Seragam Keluarga\nDiskon Bundling",
            sub: "Beli 3 hemat 35% — kaos keluarga, koper, dan perlengkapan perjalanan",
            right: "1–20 April 2026\ngratis sablon nama\nmin. pembelian 3 pcs",
          },
          (els) => {
            els.push(img(asset("ketupat-duo"), { x: 1680, y: 310, w: 210, h: 210, rotation: 8 }))
            els.push(...crescentRow(120))
          },
        ),
    },
    {
      slug: "sale-lebaran-label",
      name: "Label Diskon Lebaran — Stiker Sale",
      category: CAT,
      type: "canvas",
      tags: ["label", "sale", "lebaran", "stiker"],
      width: 800,
      height: 800,
      build: () =>
        doc("canvas", 800, 800, solid(GOLD), [
          page("Label", solid(GOLD), [
            ellipse({ x: 60, y: 60, w: 680, h: 680, fill: MERAH }),
            ellipse({ x: 90, y: 90, w: 620, h: 620, fill: "transparent", stroke: GOLD_SOFT, sw: 5, dash: [18, 12] }),
            txt("THR", { x: 0, y: 190, w: 800, h: 120, size: 100, font: F.display, weight: 400, color: GOLD_SOFT, align: "center", ls: 6 }),
            txt("SALE", { x: 0, y: 320, w: 800, h: 170, size: 150, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 6 }),
            txt("diskon s.d. 50%", { x: 0, y: 510, w: 800, h: 60, size: 40, font: F.sans, weight: 700, color: "#fef3c7", align: "center" }),
            txt("berlaku 1 minggu sebelum lebaran", { x: 0, y: 590, w: 800, h: 50, size: 26, font: F.sans, weight: 500, color: "#fde68a", align: "center" }),
          ]),
        ]),
    },
  ]
}

function crescentRow(x: number): DesignElement[] {
  return [img(asset("crescent-star"), { x, y: 300, w: 170, h: 170 })]
}

/* ============================ export ============================ */

export const SEASONAL_SALE_TPLS: TemplateSpec[] = [
  ...doubleDateTpls(),
  ...holidaySaleTpls(),
]
