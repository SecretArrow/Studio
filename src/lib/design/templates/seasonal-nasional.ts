/**
 * Seasonal pack — Hari Nasional & Keagamaan Indonesia.
 * -----------------------------------------------------
 * 35 original editable templates: 17 Agustus (Dirgahayu, lomba 17-an), Hari Kartini,
 * Sumpah Pemuda, Hari Pahlawan, Hari Batik, Maulid Nabi, Hari Santri, Pancasila.
 * Design language researched from Indonesian holiday-poster galleries: red-white
 * flags & garlands, batik accents, "MERDEKA" oversized type, green-gold Maulid art.
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
  GOLD,
  GOLD_SOFT,
  IG,
  banner,
  cornerOrnaments,
  crescentShape,
  eventPoster,
  starScatter,
  storyTemplate,
} from "./seasonal-shared"

const CAT = "seasonal"
const MERAH = "#c1121f"
const MERAH_GELAP = "#7f1d1d"

/* ============================ 17 Agustus posts ============================ */

function agustusTpls(): TemplateSpec[] {
  const specs: TemplateSpec[] = []

  const mk = (
    slug: string,
    name: string,
    bg: ReturnType<typeof solid> | ReturnType<typeof gradient>,
    els: (d: DesignElement[]) => DesignElement[],
    tags: string[] = ["17 agustus", "dirgahayu", "kemerdekaan", "instagram"],
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
      "agustus-dirgahayu-80",
      "Dirgahayu 80 — Bold Post",
      gradient(MERAH, "#ffffff", 170),
      (d) =>
        d.concat([
          rect({ x: 0, y: 0, w: IG, h: 240, fill: MERAH_GELAP }),
          txt("17 AGUSTUS 1945 — 2025", { x: 0, y: 70, w: IG, h: 60, size: 44, font: F.display, weight: 400, color: "#fff1f2", align: "center", ls: 4 }),
          txt("DIRGAHAYU", { x: 0, y: 300, w: IG, h: 110, size: 84, font: F.pop, weight: 800, color: MERAH_GELAP, align: "center", ls: 8 }),
          txt("80", { x: 0, y: 390, w: IG, h: 330, size: 330, font: F.display, weight: 400, color: MERAH, align: "center" }),
          txt("REPUBLIK INDONESIA", { x: 0, y: 740, w: IG, h: 60, size: 40, font: F.pop, weight: 800, color: MERAH_GELAP, align: "center", ls: 6 }),
          img(asset("flag-id"), { x: 90, y: 840, w: 240, h: 185, rotation: -6 }),
          img(asset("flag-id"), { x: 750, y: 840, w: 240, h: 185, rotation: 6 }),
          txt("merdeka!",
          { x: 0, y: 990, w: IG, h: 50, size: 30, font: F.hand, weight: 400, color: MERAH_GELAP, align: "center" }),
        ] as DesignElement[]),
    ),
    mk(
      "agustus-merdeka-night",
      "Merdeka — Firework Night Post",
      solid("#0b0f1e"),
      (d) =>
        d.concat([
          img(asset("firework"), { x: 70, y: 70, w: 250, h: 250 }),
          img(asset("firework-duo"), { x: 600, y: 110, w: 400, h: 267 }),
          txt("17 AGUSTUS 2025", { x: 0, y: 380, w: IG, h: 50, size: 30, font: F.sans, weight: 600, color: "#cbd5e1", align: "center", ls: 8 }),
          txt("MERDEKA", { x: 0, y: 440, w: IG, h: 190, size: 170, font: F.display, weight: 400, color: "#ffffff", align: "center", ls: 8 }),
          txt("80 tahun Indonesia merdeka — terus berkarya untuk negeri", { x: 130, y: 660, w: IG - 260, h: 90, size: 30, font: F.body, weight: 400, color: "#e2e8f0", align: "center", lh: 1.4 }),
          img(asset("city-skyline"), { x: 40, y: 900, w: 1000, h: 160, opacity: 0.95 }),
          rect({ x: 0, y: 790, w: IG, h: 8, fill: MERAH }),
          rect({ x: 0, y: 798, w: IG, h: 8, fill: "#ffffff" }),
        ] as DesignElement[]),
    ),
    mk(
      "agustus-flag-wave",
      "Sang Merah Putih — Wave Post",
      solid("#fef2f2"),
      (d) =>
        d.concat([
          txt("kibarkan dengan bangga", { x: 0, y: 150, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#ef4444", align: "center", upper: true, ls: 6 }),
          img(asset("flag-id"), { x: 140, y: 230, w: 800, h: 615 }),
          txt("Sang Merah Putih", { x: 0, y: 860, w: IG, h: 90, size: 76, font: F.serif, weight: 700, color: MERAH_GELAP, align: "center" }),
          txt("pulau suku bangsa budaya berbeda — satu Indonesia", { x: 0, y: 970, w: IG, h: 46, size: 26, font: F.sans, weight: 500, color: "#b91c1c", align: "center" }),
        ] as DesignElement[]),
    ),
    mk(
      "agustus-loomba-fun",
      "Lomba 17-an — Fun Post",
      solid("#fff7ed"),
      (d) =>
        d.concat([
          img(asset("garland-flag"), { x: 40, y: 40, w: 1000, h: 350, opacity: 0.95 }),
          txt("LOMBA 17-AN", { x: 0, y: 330, w: IG, h: 130, size: 110, font: F.display, weight: 400, color: MERAH, align: "center", ls: 4 }),
          txt("balap karung · kelereng · makan kerupuk · panjat pinang", { x: 0, y: 490, w: IG, h: 50, size: 29, font: F.sans, weight: 600, color: "#9a3412", align: "center" }),
          rect({ x: 190, y: 590, w: 700, h: 110, fill: MERAH, r: 55 }),
          txt("Ahad, 17 Agustus · 08.00 WIB", { x: 190, y: 590, w: 700, h: 110, size: 33, font: F.sans, weight: 700, color: "#fff1f2", align: "center", vAlign: "middle" }),
          txt("Lapangan Desa Sukamaju · gratis ikut semua lomba ·\njuara tiap cabang dapat sembako + piala bergilir", { x: 130, y: 740, w: IG - 260, h: 110, size: 27, font: F.body, weight: 500, color: "#7f1d1d", align: "center", lh: 1.4 }),
          img(asset("flag-id"), { x: 770, y: 760, w: 220, h: 169, rotation: 8 }),
        ] as DesignElement[]),
    ),
    mk(
      "agustus-quote-soekarno",
      "Kutipan Merah Putih — Quote Post",
      solid(MERAH_GELAP),
      (d) =>
        d.concat([
          ...cornerOrnaments(60, 60, IG - 120, IG - 120, GOLD),
          txt("giving merdeka spirit", { x: 0, y: 170, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#fca5a5", align: "center", upper: true, ls: 6 }),
          txt("“Bermimpilah setinggi langit.\nJika engkau jatuh, engkau akan jatuh\ndi antara bintang-bintang.”", { x: 100, y: 300, w: IG - 200, h: 260, size: 52, font: F.serif, weight: 700, color: "#fff1f2", align: "center", lh: 1.35 }),
          txt("— ir. soekarno", { x: 0, y: 600, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: GOLD_SOFT, align: "center", upper: true, ls: 3 }),
          rule(440, 690, 200, GOLD, 5),
          txt("dirgahayu republik indonesia — 17 agustus 2025", { x: 0, y: 730, w: IG, h: 46, size: 25, font: F.sans, weight: 500, color: "#fecaca", align: "center" }),
          img(asset("flag-id"), { x: 420, y: 810, w: 240, h: 185 }),
        ] as DesignElement[]),
    ),
    mk(
      "agustus-tug-of-war",
      "Panjat Pinang — Photo Frame Post",
      gradient("#dc2626", "#f97316", 155),
      (d) =>
        d.concat([
          img(asset("frame-polaroid"), { x: 240, y: 150, w: 600, h: 680, rotation: 2 }),
          txt("seluruh warga turun ke lapangan —\nmana tim kamu?", { x: 90, y: 850, w: IG - 180, h: 110, size: 36, font: F.pop, weight: 700, color: "#fff7ed", align: "center", lh: 1.3 }),
          txt("ganti foto bingkai dengan dokumentasi lomba RT-mu", { x: 0, y: 990, w: IG, h: 44, size: 24, font: F.hand, weight: 400, color: "#ffedd5", align: "center" }),
          img(asset("garland-flag"), { x: 60, y: 60, w: 400, h: 140, rotation: -4 }),
          img(asset("garland-flag"), { x: 620, y: 60, w: 400, h: 140, rotation: 4 }),
        ] as DesignElement[]),
    ),
    {
      slug: "agustus-story-merdeka",
      name: "Merdeka Story — Firework Flag",
      category: CAT,
      type: "canvas",
      tags: ["story", "17 agustus", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "agustus-story-merdeka", bg: solid("#0b0f1e"), ink: "#ffffff", sub: "#cbd5e1", card: MERAH_GELAP, cardInk: "#fff1f2", accent: MERAH },
          {
            top: "17 agustus 2025",
            main: "Dirga-\nhayu\nRI-80",
            sub: "merdeka bukan kata — kerja keras setiap hari",
            card: "Lomba 17-an: Ahad 08.00 WIB\nLapangan Desa. Bawa semangat,\nkami siapkan hadiah & makan bareng.",
          },
          (d) => {
            d.push(img(asset("flag-id"), { x: 90, y: 260, w: 380, h: 292, rotation: -5 }))
            d.push(img(asset("firework"), { x: 640, y: 220, w: 300, h: 300 }))
            d.push(img(asset("garland-flag"), { x: 60, y: 90, w: 560, h: 196 }))
            d.push(img(asset("city-skyline"), { x: 40, y: 1740, w: 1000, h: 160, opacity: 0.9 }))
          },
        ),
    },
    {
      slug: "agustus-story-loomba",
      name: "Lomba 17-an Story — Countdown",
      category: CAT,
      type: "canvas",
      tags: ["story", "lomba", "17 agustus", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "agustus-story-loomba", bg: gradient("#dc2626", "#f97316", 160), ink: "#fff7ed", sub: "#ffedd5", card: MERAH_GELAP, cardInk: "#fff1f2", accent: GOLD_SOFT },
          {
            top: "countdown lomba 17-an",
            main: "H-3\nsiapkan\nbadanmu",
            sub: "balap karung & panjat pinang menanti",
            card: "Daftar nama tim ke pak RT sebelum\nKamis. Semua warga boleh ikut —\npemenang dapat piala bergilir!",
          },
          (d) => {
            d.push(img(asset("garland-flag"), { x: 90, y: 100, w: 900, h: 315 }))
            d.push(img(asset("flag-id"), { x: 700, y: 1500, w: 280, h: 215, rotation: 6 }))
          },
        ),
    },
    {
      slug: "agustus-banner-rt",
      name: "Spanduk Lomba 17-an RT",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "lomba", "17 agustus", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "agustus-banner-rt", bg: solid(MERAH), strip: "#ffffff", ink: "#fff1f2", accent: GOLD_SOFT, sub: "#fecaca" },
          {
            left: "RT 04\nRW 02",
            main: "Lomba 17-an\nDirgahayu RI ke-80",
            sub: "Balap karung · kelereng · makan kerupuk · panjat pinang · bazar kuliner warga",
            right: "Ahad, 17 Agustus\n08.00 WIB\nLapangan desa — gratis!",
          },
          (els) => {
            els.push(img(asset("garland-flag"), { x: 520, y: 40, w: 800, h: 280, opacity: 0.9 }))
            els.push(img(asset("flag-id"), { x: 90, y: 330, w: 230, h: 177, rotation: -6 }))
          },
        ),
    },
    {
      slug: "agustus-banner-dirgahayu",
      name: "Spanduk Dirgahayu Kampus/Kantor",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "dirgahayu", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "agustus-banner-dirgahayu", bg: gradient(MERAH, "#ffffff", 105), strip: MERAH_GELAP, ink: MERAH_GELAP, accent: MERAH, sub: "#b91c1c" },
          {
            left: "DIRGAHAYU\nREPUBLIK\nINDONESIA",
            main: "80 Tahun\nIndonesia Merdeka",
            sub: "Satu Nusa, Satu Bangsa, Satu Bahasa — upacara & lomba kesehatan se-gedung",
            right: "Upacara: 17 Agustus\n07.30 WIB\nseragam putih-merah",
          },
          (els) => {
            els.push(img(asset("flag-id"), { x: 1640, y: 320, w: 250, h: 192 }))
            els.push(img(asset("garland-flag"), { x: 560, y: 60, w: 700, h: 245 }))
          },
        ),
    },
    {
      slug: "agustus-poster-lomba-a4",
      name: "Poster Rangkaian Lomba 17-an (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "lomba", "17 agustus", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "agustus-poster-lomba-a4", bg: solid("#fef2f2"), headerFill: MERAH, headerInk: "#fff1f2", cardFill: "#ffffff", cardInk: MERAH_GELAP, accent: "#f59e0b", ink: "#1f2937", titleSize: 70 },
          {
            kicker: "panitia hari kemerdekaan rt 04",
            title: "Rangkaian Lomba\nHUT RI ke-80",
            speakerLabel: "rangkaian lomba",
            speaker: "Balap Karung, Kelereng,\nPanjat Pinang & Bazar",
            dateLine: "Minggu, 17 Agustus 2025",
            timeLine: "07.30 upacara · 09.00 lomba",
            placeLine: "Lapangan Desa Sukamaju",
            note: "Gratis untuk seluruh warga — daftar di pos RT sebelum H-1.\nHadiah: piala bergilir + paket sembako untuk tiap juara cabang.",
            footer: "infokan ke grup RT & ajak anak-anak ikut",
          },
          (d) => {
            d.push(img(asset("garland-flag"), { x: 70, y: 40, w: 560, h: 196 }))
            d.push(img(asset("flag-id"), { x: 950, y: 60, w: 200, h: 154, rotation: 8 }))
            d.push(...starScatter(6, 150, 420, 940, 120, "#fecaca", 281))
          },
        ),
    },
    {
      slug: "agustus-poster-upacara-a4",
      name: "Poster Upacara & Makan Bareng (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "upacara", "17 agustus", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "agustus-poster-upacara-a4", bg: solid("#ffffff"), headerFill: MERAH_GELAP, headerInk: "#fff1f2", cardFill: "#fef2f2", cardInk: MERAH_GELAP, accent: "#dc2626", ink: "#1f2937", titleSize: 72 },
          {
            kicker: "warga desa sukamaju",
            title: "Upacara &\nMakan Bareng",
            speakerLabel: "inspektur upacara",
            speaker: "Kepala Desa\nH. Sutarno",
            dateLine: "Minggu, 17 Agustus 2025",
            timeLine: "07.30 WIB — selesai",
            placeLine: "Balai Desa & lapangan",
            note: "Seragam putih-merah atau pakaian adat. Setelah upacara:\nmakan bareng, lomba kelereng untuk anak, dan panggung rakyat.",
            footer: "kontribusi makanan dikoordinasi posyandu desa",
          },
          (d) => {
            d.push(img(asset("flag-id"), { x: 110, y: 50, w: 200, h: 154, rotation: -7 }))
            d.push(img(asset("flag-id"), { x: 930, y: 50, w: 200, h: 154, rotation: 7 }))
            d.push(img(asset("garland-flag"), { x: 380, y: 400, w: 480, h: 168, opacity: 0.9 }))
          },
        ),
    },
  )
  return specs
}

/* ============================ Kartini ============================ */

function kartiniTpls(): TemplateSpec[] {
  return [
    {
      slug: "kartini-floral-post",
      name: "Hari Kartini — Floral Post",
      category: CAT,
      type: "canvas",
      tags: ["kartini", "hari kartini", "wanita", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#831843", "#db2777", 150), [
          page("Kartini", gradient("#831843", "#db2777", 150), [
            img(asset("flower"), { x: 60, y: 620, w: 260, h: 260, rotation: -8 }),
            img(asset("flower"), { x: 760, y: 640, w: 220, h: 220, rotation: 10 }),
            txt("21 april · hari kartini", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fbcfe8", align: "center", upper: true, ls: 7 }),
            txt("Kartini\nKita Semua", { x: 90, y: 260, w: IG - 180, h: 300, size: 110, font: F.serif, weight: 700, color: "#fff1f2", align: "center", lh: 1.1 }),
            txt("“Habis gelap terbitlah terang.”", { x: 130, y: 600, w: IG - 260, h: 60, size: 34, font: F.body, weight: 400, color: GOLD_SOFT, align: "center", italic: true }),
            txt("semoga jendela pendidikan terbuka lebar\nuntuk semua anak negeri", { x: 140, y: 920, w: IG - 280, h: 100, size: 28, font: F.body, weight: 400, color: "#fce7f3", align: "center", lh: 1.4 }),
          ]),
        ]),
    },
    {
      slug: "kartini-quote-post",
      name: "Kutipan Kartini — Quote Post",
      category: CAT,
      type: "canvas",
      tags: ["kartini", "quote", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fdf2f8"), [
          page("Kartini quote", solid("#fdf2f8"), [
            rect({ x: 56, y: 56, w: IG - 112, h: IG - 112, fill: "transparent", stroke: "#db2777", sw: 3, r: 16 }),
            txt("21 april — hari kartini", { x: 0, y: 170, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: "#db2777", align: "center", upper: true, ls: 6 }),
            txt("“Bantulah aku, jangan dipandang ringan.\nWanita adalah lengan yang bisa\nmemperkokoh pikiran bangsa.”", { x: 110, y: 280, w: IG - 220, h: 280, size: 48, font: F.serif, weight: 700, color: "#831843", align: "center", lh: 1.4 }),
            txt("— r.a. kartini", { x: 0, y: 610, w: IG, h: 50, size: 28, font: F.sans, weight: 600, color: "#be185d", align: "center", upper: true, ls: 3 }),
            rule(440, 700, 200, "#f472b6", 5),
            txt("kirim apresiasi untuk para perempuan\nyang menyalakan terang di sekitarmu", { x: 140, y: 750, w: IG - 280, h: 110, size: 28, font: F.hand, weight: 400, color: "#9d174d", align: "center", lh: 1.4 }),
            img(asset("flower"), { x: 440, y: 880, w: 200, h: 200 }),
          ]),
        ]),
    },
    {
      slug: "kartini-story",
      name: "Kartini Story — Terbitlah Terang",
      category: CAT,
      type: "canvas",
      tags: ["story", "kartini", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "kartini-story", bg: gradient("#831843", "#be185d", 160), ink: "#fff1f2", sub: "#fbcfe8", card: "#9d174d", cardInk: "#fce7f3", accent: GOLD_SOFT },
          {
            top: "21 april · hari kartini",
            main: "Habis\nGelap\nTerbit-lah Terang",
            sub: "— r.a. kartini",
            card: "Pendidikan adalah jendela terang.\nDukung anak perempuan di sekitarmu\nuntuk terus sekolah dan bermimpi.",
          },
          (d) => {
            d.push(img(asset("flower"), { x: 90, y: 1600, w: 260, h: 260, rotation: -8 }))
            d.push(img(asset("flower"), { x: 740, y: 240, w: 240, h: 240, rotation: 12 }))
            d.push(...starScatter(8, 90, 500, 900, 400, "#fbcfe8", 291))
          },
        ),
    },
    {
      slug: "kartini-banner-sekolah",
      name: "Spanduk Hari Kartini Sekolah",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "kartini", "sekolah", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kartini-banner-sekolah", bg: solid("#9d174d"), strip: "#f9a8d4", ink: "#fff1f2", accent: GOLD_SOFT, sub: "#fbcfe8" },
          {
            left: "SDN 2\nMEKAR SARI",
            main: "Hari Kartini\n21 April",
            sub: "Lomba menulis surat & kebaya nusantara — semua siswa dipersilakan ikut serta",
            right: "Pukul 08.00 WIB\nhalaman sekolah\npakaian adat",
          },
          (els) => {
            els.push(img(asset("flower"), { x: 90, y: 300, w: 220, h: 220, rotation: -8 }))
            els.push(img(asset("flower"), { x: 1660, y: 320, w: 200, h: 200, rotation: 10 }))
          },
        ),
    },
  ]
}

/* ============================ Sumpah Pemuda & Pahlawan ============================ */

function pemudaTpls(): TemplateSpec[] {
  return [
    {
      slug: "sumpah-pemuda-post",
      name: "Sumpah Pemuda — Post 28 Oktober",
      category: CAT,
      type: "canvas",
      tags: ["sumpah pemuda", "28 oktober", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#0f172a"), [
          page("Sumpah", solid("#0f172a"), [
            img(asset("garland-flag"), { x: 40, y: 60, w: 1000, h: 350 }),
            txt("28 oktober", { x: 0, y: 380, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#94a3b8", align: "center", upper: true, ls: 8 }),
            txt("SATU NUSA\nSATU BANGSA\nSATU BAHASA", { x: 90, y: 450, w: IG - 180, h: 330, size: 84, font: F.pop, weight: 800, color: "#ffffff", align: "center", lh: 1.2 }),
            txt("Sumpah Pemuda 1928 — janji yang kita jaga dengan karya", { x: 0, y: 820, w: IG, h: 50, size: 27, font: F.body, weight: 400, color: "#cbd5e1", align: "center", italic: true }),
            rect({ x: 0, y: 920, w: IG, h: 10, fill: MERAH }),
            rect({ x: 0, y: 930, w: IG, h: 10, fill: "#ffffff" }),
          ]),
        ]),
    },
    {
      slug: "pahlawan-post",
      name: "Hari Pahlawan — Post 10 November",
      category: CAT,
      type: "canvas",
      tags: ["hari pahlawan", "10 november", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#7f1d1d", "#dc2626", 160), [
          page("Pahlawan", gradient("#7f1d1d", "#dc2626", 160), [
            ...cornerOrnaments(56, 56, IG - 112, IG - 112, GOLD_SOFT),
            txt("10 november · hari pahlawan", { x: 0, y: 180, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#fecaca", align: "center", upper: true, ls: 6 }),
            txt("Pahlawan\nMuda\nHati Besar", { x: 90, y: 270, w: IG - 180, h: 330, size: 100, font: F.serif, weight: 700, color: "#fff1f2", align: "center", lh: 1.15 }),
            txt("“Berpikir banyak, berkata sedikit, bekerja keras.”\n— bung tomo", { x: 130, y: 640, w: IG - 260, h: 120, size: 30, font: F.body, weight: 400, color: "#fee2e2", align: "center", italic: true, lh: 1.4 }),
            img(asset("flag-id"), { x: 400, y: 790, w: 280, h: 215 }),
          ]),
        ]),
    },
    {
      slug: "sumpah-pemuda-story",
      name: "Sumpah Pemuda Story — Janji",
      category: CAT,
      type: "canvas",
      tags: ["story", "sumpah pemuda", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "sumpah-pemuda-story", bg: solid("#0f172a"), ink: "#ffffff", sub: "#94a3b8", card: "#1e293b", cardInk: "#e2e8f0", accent: MERAH },
          {
            top: "28 oktober 1928 — 2026",
            main: "Janji\nkita\njaga",
            sub: "sumpah pemuda — satu nusa, satu bangsa, satu bahasa",
            card: "Generasi sekarang menepati janji\ndengan cara lain: belajar, berkarya,\ndan berpihak pada kebenaran.",
          },
          (d) => {
            d.push(img(asset("garland-flag"), { x: 60, y: 100, w: 960, h: 336 }))
            d.push(img(asset("flag-id"), { x: 90, y: 1620, w: 320, h: 246, rotation: -5 }))
            d.push(...starScatter(8, 700, 500, 300, 300, GOLD_SOFT, 301))
          },
        ),
    },
    {
      slug: "pahlawan-banner",
      name: "Spanduk Hari Pahlawan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "hari pahlawan", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "pahlawan-banner", bg: gradient("#7f1d1d", "#dc2626", 120), strip: GOLD_SOFT, ink: "#fff1f2", accent: "#fde68a", sub: "#fecaca" },
          {
            left: "10\nNOVEMBER",
            main: "Hari Pahlawan\nPahlawan Muda Hati Besar",
            sub: "Kantor kami memakmuruskan semangat juang — berbagi paket pangan untuk warga sekitar",
            right: "Baksos: 10 Nov\n08.00 WIB\nhalaman kantor",
          },
          (els) => {
            els.push(img(asset("flag-id"), { x: 90, y: 320, w: 240, h: 185, rotation: -6 }))
            els.push(img(asset("garland-flag"), { x: 560, y: 50, w: 700, h: 245 }))
          },
        ),
    },
  ]
}

/* ============================ Hari Batik ============================ */

function batikTpls(): TemplateSpec[] {
  return [
    {
      slug: "batik-day-post",
      name: "Hari Batik Nasional — Post",
      category: CAT,
      type: "canvas",
      tags: ["batik", "hari batik", "2 oktober", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const dots: DesignElement[] = []
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            dots.push(ellipse({ x: 90 + c * 150 + (r % 2) * 75, y: 700 + r * 60, w: 26, h: 26, fill: GOLD, opacity: 0.5 }))
          }
        }
        return doc("canvas", IG, IG, solid("#2e1a47"), [
          page("Batik", solid("#2e1a47"), [
            txt("2 oktober · hari batik nasional", { x: 0, y: 170, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#c4b5fd", align: "center", upper: true, ls: 6 }),
            txt("Karya\nNusantara\nKebanggaan Dunia", { x: 90, y: 260, w: IG - 180, h: 330, size: 92, font: F.serif, weight: 700, color: "#f5f3ff", align: "center", lh: 1.18 }),
            txt("batik diakui unesco sebagai warisan budaya takbenda —\nkenakan dan ceritakan maknanya", { x: 130, y: 620, w: IG - 260, h: 100, size: 28, font: F.body, weight: 400, color: "#ddd6fe", align: "center", lh: 1.4 }),
            ...dots,
            rect({ x: 0, y: 0, w: 16, h: IG, fill: GOLD }),
            rect({ x: IG - 16, y: 0, w: 16, h: IG, fill: GOLD }),
          ]),
        ])
      },
    },
    {
      slug: "batik-office-story",
      name: "Kamis Batik — Story Kantor",
      category: CAT,
      type: "canvas",
      tags: ["story", "batik", "kantor", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "batik-office-story", bg: solid("#2e1a47"), ink: "#f5f3ff", sub: "#c4b5fd", card: "#3b0764", cardInk: "#ddd6fe", accent: GOLD },
          {
            top: "kamis · pakaian nasional",
            main: "Kamis\nBatik\ndi kantor",
            sub: "pakai yang paling kamu banggakan",
            card: "Snapshot terbaik dapet voucher kopi —\nupload & tag kantor kita.\n#KamisBatik #BatikIndonesia",
          },
          (d) => {
            d.push(...starScatter(10, 90, 180, 900, 400, GOLD, 311))
            d.push(ellipse({ x: 300, y: 1480, w: 480, h: 480, fill: "#3b0764" }))
            d.push(shp("star", { x: 460, y: 1600, w: 160, h: 160, fill: GOLD }))
          },
        ),
    },
    {
      slug: "batik-banner-umkm",
      name: "Spanduk Batik UMKM",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "batik", "umkm", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "batik-banner-umkm", bg: solid("#fdf6ec"), strip: "#2e1a47", ink: "#2e1a47", accent: "#b45309", sub: "#78350f" },
          {
            left: "BATIK\nPASAR KLEWER",
            main: "Asli Tulis,\nAsli Nusantara",
            sub: "Koleksi baru setiap pekan — tulis & cap, harga langsung dari pengrajin",
            right: "Buka tiap hari\n08.00–16.00 WIB\ncash & QRIS",
          },
          (els) => {
            els.push(ellipse({ x: 100, y: 320, w: 220, h: 220, fill: "#f5f3ff", stroke: GOLD_SOFT, sw: 4 }))
            els.push(shp("star", { x: 170, y: 390, w: 80, h: 80, fill: GOLD }))
            els.push(...Array.from({ length: 5 }, (_, i) => ellipse({ x: 1500 + i * 70, y: 350 + (i % 2) * 60, w: 26, h: 26, fill: GOLD, opacity: 0.6 }) as DesignElement))
          },
        ),
    },
  ]
}

/* ============================ Maulid Nabi & Hari Santri ============================ */

function maulidTpls(): TemplateSpec[] {
  return [
    {
      slug: "maulid-emerald-post",
      name: "Maulid Nabi — Emerald Post",
      category: CAT,
      type: "canvas",
      tags: ["maulid nabi", "islamic", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#064e3b"), [
          page("Maulid", solid("#064e3b"), [
            ...cornerOrnaments(60, 60, IG - 120, IG - 120, GOLD),
            ...crescentShape(700, 110, 190, GOLD_SOFT, "#064e3b"),
            txt("12 rabiul awal 1448 h", { x: 0, y: 190, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 7 }),
            txt("Maulid\nNabi Muhammad\nSAW", { x: 90, y: 280, w: IG - 180, h: 330, size: 90, font: F.serif, weight: 700, color: GOLD_SOFT, align: "center", lh: 1.15 }),
            txt("“Aku diutus untuk menyempurnakan akhlak yang mulia.”", { x: 130, y: 650, w: IG - 260, h: 60, size: 30, font: F.body, weight: 400, color: "#d1fae5", align: "center", italic: true }),
            txt("mari teladankan akhlak beliau — dalam hal terkecil sekalipun", { x: 0, y: 940, w: IG, h: 46, size: 25, font: F.sans, weight: 500, color: "#a7f3d0", align: "center" }),
            img(asset("mosque"), { x: 140, y: 830, w: 800, h: 200, opacity: 0.4 }),
          ]),
        ]),
    },
    {
      slug: "maulid-story-barzanji",
      name: "Maulid Story — Barzanji Malam",
      category: CAT,
      type: "canvas",
      tags: ["story", "maulid", "barzanji", "9:16"],
      width: 1080,
      height: 1920,
      build: () =>
        storyTemplate(
          { slug: "maulid-story-barzanji", bg: gradient("#065f46", "#047857", 165), ink: GOLD_SOFT, sub: "#a7f3d0", card: "#064e3b", cardInk: "#d1fae5", accent: GOLD },
          {
            top: "malam maulid · rabiul awal",
            main: "Barzanji\n& makan\nbareng",
            sub: "masjid al-ikhlas mengundang",
            card: "Malam Ahad, isya 19.30 WIB.\nPembacaan barzanji, shalawat bersama,\ndan takjil maulid untuk jamaah.",
          },
          (d) => {
            d.push(...crescentShape(680, 260, 240, GOLD_SOFT, "#065f46"))
            d.push(img(asset("mosque"), { x: 90, y: 1650, w: 900, h: 225, opacity: 0.6 }))
            d.push(...starScatter(10, 90, 200, 900, 400, GOLD_SOFT, 321))
          },
        ),
    },
    {
      slug: "santri-day-post",
      name: "Hari Santri Nasional — Post",
      category: CAT,
      type: "canvas",
      tags: ["hari santri", "22 oktober", "islamic", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#1c1917"), [
          page("Santri", solid("#1c1917"), [
            ellipse({ x: 240, y: 140, w: 600, h: 600, fill: "#292524" }),
            txt("22 oktober", { x: 0, y: 200, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: "#a8a29e", align: "center", upper: true, ls: 8 }),
            txt("Hari\nSantri\nNasional", { x: 90, y: 280, w: IG - 180, h: 330, size: 100, font: F.pop, weight: 800, color: GOLD_SOFT, align: "center", lh: 1.1 }),
            txt("“Santri menjaga iman bangsa —\nmembawa cahaya dari pesantren untuk negeri.”", { x: 130, y: 660, w: IG - 260, h: 110, size: 29, font: F.body, weight: 400, color: "#d6d3d1", align: "center", italic: true, lh: 1.4 }),
            img(asset("book-open"), { x: 420, y: 800, w: 240, h: 180 }),
            txt("hormat untuk seluruh santri & kiai kita", { x: 0, y: 990, w: IG, h: 46, size: 25, font: F.hand, weight: 400, color: "#a8a29e", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "pancasila-post",
      name: "Hari Lahir Pancasila — Post",
      category: CAT,
      type: "canvas",
      tags: ["pancasila", "1 juni", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const sila: [string, string][] = [
          ["1", "Ketuhanan Yang Maha Esa"],
          ["2", "Kemanusiaan yang adil dan beradab"],
          ["3", "Persatuan Indonesia"],
          ["4", "Kerakyatan / musyawarah"],
          ["5", "Keadilan sosial"],
        ]
        return doc("canvas", IG, IG, solid("#fafaf9"), [
          page("Pancasila", solid("#fafaf9"), [
            rect({ x: 0, y: 0, w: IG, h: 220, fill: "#0f172a" }),
            txt("1 JUNI · HARI LAHIR PANCASILA", { x: 0, y: 80, w: IG, h: 60, size: 38, font: F.pop, weight: 800, color: "#fbbf24", align: "center" }),
            ...sila.flatMap(([n, t], i) => {
              const y = 280 + i * 140
              return [
                rect({ x: 90, y, w: IG - 180, h: 110, fill: "#ffffff", stroke: "#e5e7eb", sw: 2, r: 18 }),
                ellipse({ x: 120, y: y + 17, w: 76, h: 76, fill: "#0f172a" }),
                txt(n, { x: 120, y: y + 17, w: 76, h: 76, size: 38, font: F.pop, weight: 800, color: "#fbbf24", align: "center", vAlign: "middle" }),
                txt(t, { x: 230, y, w: IG - 350, h: 110, size: 29, font: F.sans, weight: 600, color: "#111827", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("garis-garis dasar negara — jaga bersama, amalkan tiap hari", { x: 0, y: 1000, w: IG, h: 46, size: 25, font: F.sans, weight: 500, color: "#6b7280", align: "center" }),
          ]),
        ])
      },
    },
  ]
}

/* ============================ export ============================ */

export const SEASONAL_NASIONAL_TPLS: TemplateSpec[] = [
  ...agustusTpls(),
  ...kartiniTpls(),
  ...pemudaTpls(),
  ...batikTpls(),
  ...maulidTpls(),
]
