/**
 * Seasonal pack — Poster Pengajian / Kajian Islam.
 * -------------------------------------------------
 * 43 original editable templates: kajian rutin posts, A4 tabligh akbar posters,
 * stories, masjid banners, hadits quote posts, weekly schedules, charity posters.
 * Layout conventions researched from live Indonesian Islamic-event poster galleries:
 * prominent speaker block, date/time/place icon rows, mosque + tasbih + arch ornaments,
 * emerald/teal/night + gold palettes, transliterated Arabic with translations.
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
  starScatter,
  storyTemplate,
} from "./seasonal-shared"

const CAT = "seasonal"
const STORY_W = 1080
const STORY_H = 1920

/* ============================ kajian post helper ============================ */

interface KajianStyle {
  slug: string
  name: string
  bg: ReturnType<typeof solid> | ReturnType<typeof gradient>
  ink: string
  sub: string
  accent: string
  speakerBg: string
  speakerInk: string
  deco: (els: DesignElement[]) => void
}

function kajianPost(
  st: KajianStyle,
  c: { majelis: string; topic: string; speaker: string; day: string; time: string; place: string; foot: string },
): TemplateSpec["build"] {
  return () =>
    doc("canvas", IG, IG, st.bg, [
      page(st.slug, st.bg, [
        ...(() => {
          const d: DesignElement[] = []
          st.deco(d)
          return d
        })(),
        txt(c.majelis, { x: 0, y: 130, w: IG, h: 46, size: 27, font: F.sans, weight: 600, color: st.sub, align: "center", upper: true, ls: 7 }),
        txt(c.topic, {
          x: 80, y: 210, w: IG - 160, h: 240, size: 84, font: F.pop, weight: 800,
          color: st.ink, align: "center", vAlign: "middle", lh: 1.12,
        }),
        rect({ x: 170, y: 480, w: IG - 340, h: 210, fill: st.speakerBg, r: 24 }),
        txt("pemateri", { x: 170, y: 510, w: IG - 340, h: 40, size: 22, font: F.sans, weight: 600, color: st.accent, align: "center", upper: true, ls: 5 }),
        txt(c.speaker, { x: 200, y: 556, w: IG - 400, h: 110, size: 46, font: F.serif, weight: 700, color: st.speakerInk, align: "center", vAlign: "middle", lh: 1.15 }),
        ...([
          [c.day, 540],
          [c.time, 460],
          [c.place, 780],
        ] as [string, number][]).flatMap(([line, w], i) => {
          const y = 730 + i * 92
          return [
            rect({ x: (IG - w) / 2, y, w, h: 70, fill: "transparent", stroke: st.accent, sw: 3, r: 35 }),
            txt(line, { x: (IG - w) / 2, y, w, h: 70, size: 28, font: F.sans, weight: 600, color: st.ink, align: "center", vAlign: "middle" }),
          ] as DesignElement[]
        }),
        txt(c.foot, { x: 0, y: 1020, w: IG, h: 44, size: 24, font: F.sans, weight: 500, color: st.sub, align: "center", italic: true }),
      ]),
    ])
}

const KAJIAN_STYLES: KajianStyle[] = [
  {
    slug: "kajian-emerald-night",
    name: "Kajian Emerald Night",
    bg: solid(EMERALD_DEEP),
    ink: "#ecfdf5",
    sub: "#6ee7b7",
    accent: GOLD_SOFT,
    speakerBg: "#052e21",
    speakerInk: GOLD_SOFT,
    deco: (d) => {
      d.push(...cornerOrnaments(56, 56, IG - 112, IG - 112, GOLD))
      d.push(...crescentShape(760, 90, 150, GOLD_SOFT, EMERALD_DEEP))
    },
  },
  {
    slug: "kajian-teal-clean",
    name: "Kajian Teal Clean",
    bg: solid("#f0fdfa"),
    ink: "#134e4a",
    sub: "#0d9488",
    accent: "#14b8a6",
    speakerBg: "#ffffff",
    speakerInk: "#0f766e",
    deco: (d) => {
      d.push(rect({ x: 44, y: 44, w: IG - 88, h: IG - 88, fill: "transparent", stroke: "#99f6e4", sw: 5, r: 24 }))
      d.push(img(asset("mosque"), { x: 90, y: 940, w: 300, h: 180, opacity: 0.4 }))
      d.push(img(asset("mosque"), { x: 690, y: 940, w: 300, h: 180, opacity: 0.4, rotation: 0 }))
    },
  },
  {
    slug: "kajian-night-mosque",
    name: "Kajian Night Mosque",
    bg: gradient("#0b1226", "#164e63", 160),
    ink: "#e0f2fe",
    sub: "#7dd3fc",
    accent: GOLD_SOFT,
    speakerBg: "#0f172a",
    speakerInk: "#fde68a",
    deco: (d) => {
      d.push(img(asset("mosque"), { x: 140, y: 850, w: 800, h: 200, opacity: 0.6 }))
      d.push(...crescentShape(120, 100, 160, "#fef9c3", "#0b1226"))
      d.push(...starScatter(9, 130, 300, 820, 220, "#e0f2fe", 61))
    },
  },
  {
    slug: "kajian-cream-gold",
    name: "Kajian Cream Gold",
    bg: solid("#fbf7ec"),
    ink: "#713f12",
    sub: "#b45309",
    accent: "#d6bd7b",
    speakerBg: "#fffbeb",
    speakerInk: "#78350f",
    deco: (d) => {
      d.push(img(asset("arch-ornament"), { x: 350, y: 30, w: 380, h: 475, opacity: 0.35 }))
      d.push(img(asset("tasbih"), { x: 60, y: 820, w: 150, h: 195, rotation: -12 }))
      d.push(img(asset("tasbih"), { x: 790, y: 820, w: 150, h: 195, rotation: 12 }))
    },
  },
  {
    slug: "kajian-forest-fresh",
    name: "Kajian Forest Fresh",
    bg: gradient("#065f46", "#059669", 150),
    ink: "#ffffff",
    sub: "#a7f3d0",
    accent: "#fde68a",
    speakerBg: "#064e3b",
    speakerInk: "#fde68a",
    deco: (d) => {
      d.push(ellipse({ x: -110, y: -110, w: 320, h: 320, fill: "#ffffff", opacity: 0.12 }))
      d.push(ellipse({ x: 860, y: 860, w: 300, h: 300, fill: "#ffffff", opacity: 0.12 }))
      d.push(...crescentShape(790, 100, 140, "#fde68a", "#065f46"))
    },
  },
  {
    slug: "kajian-navy-gold",
    name: "Kajian Navy Gold",
    bg: solid("#1e1b4b"),
    ink: "#fef9c3",
    sub: "#c4b5fd",
    accent: "#fbbf24",
    speakerBg: "#312e81",
    speakerInk: "#fef9c3",
    deco: (d) => {
      d.push(...starScatter(11, 90, 90, 900, 260, "#c4b5fd", 71))
      d.push(img(asset("lantern"), { x: 70, y: 700, w: 170, h: 221, rotation: -8 }))
      d.push(img(asset("lantern"), { x: 840, y: 700, w: 170, h: 221, rotation: 8 }))
    },
  },
  {
    slug: "kajian-sand-elegant",
    name: "Kajian Sand Elegant",
    bg: solid("#efe9dc"),
    ink: "#1c1917",
    sub: "#92703c",
    accent: "#a16207",
    speakerBg: "#faf6ed",
    speakerInk: "#422006",
    deco: (d) => {
      d.push(rect({ x: 52, y: 52, w: IG - 104, h: IG - 104, fill: "transparent", stroke: "#c8b287", sw: 3, r: 12 }))
      d.push(rect({ x: 66, y: 66, w: IG - 132, h: IG - 132, fill: "transparent", stroke: "#a16207", sw: 1.5, r: 8 }))
      d.push(shp("diamond", { x: 496, y: 60, w: 60, h: 60, fill: "#a16207" }))
      d.push(shp("diamond", { x: 496, y: 950, w: 60, h: 60, fill: "#a16207" }))
    },
  },
  {
    slug: "kajian-slate-minimal",
    name: "Kajian Slate Minimal",
    bg: solid("#f8fafc"),
    ink: "#0f172a",
    sub: "#475569",
    accent: "#0ea5e9",
    speakerBg: "#e0f2fe",
    speakerInk: "#0c4a6e",
    deco: (d) => {
      d.push(rect({ x: 0, y: 0, w: 14, h: IG, fill: "#0ea5e9" }))
      d.push(ellipse({ x: 830, y: 70, w: 200, h: 200, fill: "#e0f2fe" }))
      d.push(...crescentShape(880, 110, 110, "#0ea5e9", "#f8fafc"))
    },
  },
]

const KAJIAN_CONTENTS = [
  {
    majelis: "majelis talim al-ikhlas",
    topic: "Kajian Tafsir\nAl-Qur'an",
    speaker: "Ust. Dr. H. Fauzi\nRahman, M.Ag.",
    day: "Ahad Ba'da Subuh",
    time: "05.45 — 07.15 WIB",
    place: "Ruang Utama Masjid Al-Ikhlas",
    foot: "terbuka untuk umum — ikhwan & akhwat, tersedia tempat terpisah",
  },
  {
    majelis: "kajian rutin pekanan",
    topic: "Kajian Hadits\nArba'in\nNawawi",
    speaker: "Ust. H. Yusuf\nMaulana, Lc.",
    day: "Setiap Selasa",
    time: "Ba'da Maghrib",
    place: "Aula Masjid Baiturrahman",
    foot: "bawa kitab & alat tulis — sesi tanya jawab setiap pekan",
  },
  {
    majelis: "rumah tahfidz & majelis",
    topic: "Fiqih\nSehari-hari",
    speaker: "Ust. Ahmad\nZaki, S.H.I.",
    day: "Rabu Pekan ke-2 & ke-4",
    time: "19.30 — 21.00 WIB",
    place: "Musholla Nurul Iman",
    foot: "gratis — dipersembahkan keluarga jamaah",
  },
  {
    majelis: "majelis muslimah",
    topic: "Kajian Muslimah:\nShaligah Rabbaniyah",
    speaker: "Ustzh. Nur\nHidayati, S.Pd.I.",
    day: "Kamis Pagi",
    time: "09.00 — 11.00 WIB",
    place: "Ruang Akhwat Lantai 2",
    foot: "tersedia childminding untuk bunda yang membawa anak",
  },
  {
    majelis: "kajian anak & remaja",
    topic: "TPQ & Kajian\nRemaja Masjid",
    speaker: "Tim Pengajar\nTPQ Al-Huda",
    day: "Setiap Senin—Kamis",
    time: "16.00 — 17.30 WIB",
    place: "Kelas TPQ Masjid Al-Ikhlas",
    foot: "pendaftaran terbuka sepanjang tahun — usia 5–17 tahun",
  },
  {
    majelis: "tabligh akbar bulanan",
    topic: "Membangun\nRumah Tangga\nSakinah",
    speaker: "Ust. Dr. H. Abdul\nKarim, M.A.",
    day: "Ahad, 20 April 2026",
    time: "09.00 — 12.00 WIB",
    place: "Graha Serbaguna Desa",
    foot: "free entry — doorprize untuk 30 keluarga pertama",
  },
  {
    majelis: "kajian tematik",
    topic: "Muamalah\nKontemporer",
    speaker: "Ust. Dr. Syafiq\nHasbullah, Lc., M.E.",
    day: "Jumat Pekan ke-1",
    time: "Ba'da Isya",
    place: "Aula Kampus Mahad Al-Furqan",
    foot: "kolaborasi BEM & LDK — terbuka mahasiswa & umum",
  },
  {
    majelis: "majelis dzikir & ta'lim",
    topic: "Yasinan &\nDzikir Pekanan",
    speaker: "Dipandu\nH. Mahfudz",
    day: "Jumat Petang",
    time: "16.30 — Maghrib",
    place: "Makam Desa / Balai Warga",
    foot: "talim yasin, tahlil, dan doa bersama — silaturahmi warga",
  },
]

function kajianPostTpls(): TemplateSpec[] {
  // 8 styles × 8 contents → pick 16 spread combos + 4 single-feature specials
  const tpls: TemplateSpec[] = []
  KAJIAN_STYLES.forEach((st, si) => {
    KAJIAN_CONTENTS.forEach((c, ci) => {
      if ((si + ci) % 4 !== 0) return
      tpls.push({
        slug: `${st.slug}-${ci}`,
        name: `${st.name} · ${c.topic.split("\n")[0]}`,
        category: CAT,
        type: "canvas",
        tags: ["pengajian", "kajian", "islamic", "masjid", "majelis", "instagram"],
        width: IG,
        height: IG,
        build: kajianPost(st, c),
      })
    })
  })
  return tpls
}

/* ============================ A4 posters ============================ */

function pengajianPosterTpls(): TemplateSpec[] {
  return [
    {
      slug: "pengajian-poster-tabligh",
      name: "Poster Tabligh Akbar (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "tabligh akbar", "pengajian", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-tabligh", bg: solid(EMERALD_DEEP), headerFill: "#064e3b", headerInk: GOLD_SOFT, cardFill: "#ffffff", cardInk: "#064e3b", accent: "#d97706", ink: "#1f2937", titleSize: 78 },
          {
            kicker: "tabligh akbar se-kabupaten",
            title: "Kondisi Umat\ndi Era Digital",
            speakerLabel: "pemateri",
            speaker: "Ust. Dr. H. Abdul\nKarim, M.A.",
            dateLine: "Ahad, 20 April 2026",
            timeLine: "09.00 WIB — 12.30 WIB",
            placeLine: "Graha Serbaguna Desa Sukamaju",
            note: "Terbuka untuk umum. Kajian keluarga: bawa keluarga & tetangga.\nBersalaman & makan siang bersama setelah sesi tanya jawab.",
            footer: "panitia: Majlis Talim Al-Ikhlas · WA 0812-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 320, y: 330, w: 600, h: 300, opacity: 0.3 }))
            d.push(...crescentShape(520, 26, 140, GOLD_SOFT, "#064e3b"))
            d.push(...starScatter(7, 140, 400, 960, 130, GOLD_SOFT, 81))
          },
        ),
    },
    {
      slug: "pengajian-poster-kajian-akhirpekan",
      name: "Poster Kajian Akhir Pekan (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "kajian", "masjid", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-kajian-akhirpekan", bg: solid("#f0fdfa"), headerFill: "#0f766e", headerInk: "#ccfbf1", cardFill: "#ffffff", cardInk: "#134e4a", accent: "#d97706", ink: "#1f2937", titleSize: 74 },
          {
            kicker: "masjid baiturrahman",
            title: "Kajian Akhir\nPekan",
            speakerLabel: "pemateri",
            speaker: "Ust. H. Yusuf\nMaulana, Lc.",
            dateLine: "Sabtu & Ahad pekan ini",
            timeLine: "Ba'da Subuh — 07.30 WIB",
            placeLine: "Ruang Utama Masjid Baiturrahman",
            note: "Seri bulan ini: Thaharah & Shalat. Bawa mushaf dan catatan;\nkitab dibagikan gratis untuk jamaah baru.",
            footer: "info: sekretariat masjid · terbuka umum",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 420, y: 340, w: 400, h: 200, opacity: 0.35 }))
            d.push(...crescentShape(1000, 60, 120, "#fde68a", "#0f766e"))
          },
        ),
    },
    {
      slug: "pengajian-poster-muslimah",
      name: "Poster Kajian Muslimah (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "muslimah", "kajian", "a4"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-muslimah", bg: solid("#fdf2f8"), headerFill: "#9d174d", headerInk: "#fce7f3", cardFill: "#ffffff", cardInk: "#831843", accent: "#d97706", ink: "#1f2937", titleSize: 72 },
          {
            kicker: "majelis muslimah arrahmah",
            title: "Shalihah\nRabbaniyah",
            speakerLabel: "pemateri",
            speaker: "Ustzh. Nur\nHidayati, S.Pd.I.",
            dateLine: "Setiap Kamis pagi",
            timeLine: "09.00 — 11.00 WIB",
            placeLine: "Ruang Akhwat · Masjid Ar-Rahmah",
            note: "Kajian kitab, sharing kehidupan, dan kelas parenting islami.\nTersedia childminding — bunda bisa belajar tenang.",
            footer: "kontak: Ibu Laila 0856-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("arch-ornament"), { x: 400, y: 20, w: 440, h: 550, opacity: 0.3 }))
            d.push(...starScatter(6, 140, 420, 960, 120, "#f9a8d4", 91))
          },
        ),
    },
    {
      slug: "pengajian-poster-tpq",
      name: "Poster Pendaftaran TPQ (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "tpq", "anak", "pendaftaran"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-tpq", bg: solid("#fffbeb"), headerFill: "#b45309", headerInk: "#fef3c7", cardFill: "#ffffff", cardInk: "#78350f", accent: "#16a34a", ink: "#1f2937", titleSize: 76 },
          {
            kicker: "tpq al-huda mengajar",
            title: "Pendaftaran\nSantri Baru",
            speakerLabel: "program",
            speaker: "Iqra · Qur'an Hadits\nPraktik Ibadah",
            dateLine: "Pendaftaran: setiap hari kerja",
            timeLine: "Kelas: Senin—Kamis, 16.00 WIB",
            placeLine: "Gedung TPQ Masjid Al-Ikhlas",
            note: "Usia 5–17 tahun. Biaya sangat terjangkau — beasiswa tersedia\nuntuk yatim & dhuafa. Ujian kenaikan tiap 3 bulan.",
            footer: "pendaftaran: koordinator TPQ 0857-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("book-open"), { x: 540, y: 360, w: 220, h: 165, opacity: 0.9 }))
            d.push(...crescentShape(130, 60, 120, "#fde68a", "#b45309"))
            d.push(...crescentShape(1010, 60, 120, "#fde68a", "#b45309"))
          },
        ),
    },
    {
      slug: "pengajian-poster-yasinan",
      name: "Poster Yasinan & Tahlilan (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "yasinan", "tahlil", "warga"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-yasinan", bg: solid("#f5f5f4"), headerFill: "#44403c", headerInk: "#fde68a", cardFill: "#ffffff", cardInk: "#292524", accent: "#b45309", ink: "#44403c", titleSize: 76 },
          {
            kicker: "majelis RT 04 RW 02",
            title: "Yasinan &\nTahlilan",
            speakerLabel: "dipandu oleh",
            speaker: "H. Mahfudz &\nTetua Kampung",
            dateLine: "Setiap Jumat petang",
            timeLine: "16.30 WIB — ba'da Maghrib",
            placeLine: "Bergilir di rumah warga RT 04",
            note: "Bacaan: Yasin, Tahlil, Diba', dan doa bersama. Dilanjutkan\nsesi kekeluargaan — tuan rumah tinggal menyiapkan air minum.",
            footer: "jadwal tuan rumah pekan ini: rumah Bpk. Sarno",
          },
          (d) => {
            d.push(img(asset("tasbih"), { x: 520, y: 300, w: 200, h: 260, opacity: 0.85 }))
            d.push(...crescentShape(1010, 70, 110, "#fde68a", "#44403c"))
          },
        ),
    },
    {
      slug: "pengajian-poster-santunan",
      name: "Poster Santunan Yatim (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "santunan", "yatim", "baksos"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-santunan", bg: solid("#f0fdf4"), headerFill: "#166534", headerInk: "#dcfce7", cardFill: "#ffffff", cardInk: "#14532d", accent: "#f59e0b", ink: "#1f2937", titleSize: 76 },
          {
            kicker: "yayasan peduli umat",
            title: "Santunan 100\nAnak Yatim",
            speakerLabel: "rangkaian acara",
            speaker: "Mahaliban, Santunan,\nMakan Bersama",
            dateLine: "Ahad, 3 Mei 2026",
            timeLine: "08.00 WIB — selesai",
            placeLine: "Aula Yayasan · Jl. Kenanga No. 21",
            note: "Mari berbagi kebahagiaan dengan anak-anak yatim.\nKesempatan mengikhlaskan donasi terbuka hingga H-1.",
            footer: "donasi: resek yayasan / WA 0811-xxxx-xxxx",
          },
          (d) => {
            d.push(img(asset("gift"), { x: 520, y: 320, w: 200, h: 200, opacity: 0.9 }))
            d.push(...crescentShape(120, 50, 120, "#fde68a", "#166534"))
            d.push(...starScatter(6, 150, 430, 940, 120, "#bbf7d0", 101))
          },
        ),
    },
    {
      slug: "pengajian-poster-pesantrenkilat",
      name: "Poster Pesantren Kilat (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "pesantren kilat", "liburan", "santri"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-pesantrenkilat", bg: solid("#eff6ff"), headerFill: "#1e40af", headerInk: "#dbeafe", cardFill: "#ffffff", cardInk: "#1e3a8a", accent: "#f59e0b", ink: "#1f2937", titleSize: 74 },
          {
            kicker: "liburan semarak berguna",
            title: "Pesantren\nKilat Ramadan",
            speakerLabel: "fasilitator",
            speaker: "Tim Asatidz\nMahad Al-Furqan",
            dateLine: "3 hari 2 malam · liburan sekolah",
            timeLine: "Mulai pukul 07.00 WIB hari pertama",
            placeLine: "Kompleks Mahad Al-Furqan",
            note: "Tahfidz, praktik ibadah, keterampilan, dan outbond islami.\nUntuk anak usia 8–15 tahun — kuota 60 santri.",
            footer: "pendaftaran online & offline — kuota terbatas",
          },
          (d) => {
            d.push(img(asset("grad-cap"), { x: 510, y: 330, w: 220, h: 165, opacity: 0.9 }))
            d.push(...crescentShape(990, 60, 130, "#fde68a", "#1e40af"))
            d.push(...starScatter(6, 130, 430, 980, 120, "#bfdbfe", 111))
          },
        ),
    },
    {
      slug: "pengajian-poster-donasimasjid",
      name: "Poster Donasi Pembangunan (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "donasi", "pembangunan", "masjid"],
      width: A4W,
      height: A4H,
      build: () =>
        eventPoster(
          { slug: "pengajian-poster-donasimasjid", bg: solid(EMERALD_DEEP), headerFill: "#064e3b", headerInk: GOLD_SOFT, cardFill: "#052e21", cardInk: "#d1fae5", accent: GOLD, ink: "#a7f3d0", titleSize: 74 },
          {
            kicker: "infaq pembangunan",
            title: "Mari Menyelesaikan\nMasjid Kita",
            speakerLabel: "target tahap II",
            speaker: "Rp 850 Juta\nuntuk Atap & Menara",
            dateLine: "Berlangsung sepanjang tahun",
            timeLine: "Kotak infaq tersedia di masjid",
            placeLine: "Transfer: Bank Syariah 7012-3456-78",
            note: "“Siapa membangun masjid karena Allah, maka Allah akan\nmembangunkan rumah baginya di surga.” (HR. Bukhari & Muslim)",
            footer: "laporan bulanan terbuka — dicantumkan di papan masjid",
          },
          (d) => {
            d.push(img(asset("mosque"), { x: 320, y: 330, w: 600, h: 300, opacity: 0.45 }))
            d.push(...crescentShape(520, 20, 130, GOLD_SOFT, "#064e3b"))
          },
        ),
    },
  ]
}

/* ============================ stories ============================ */

function pengajianStoryTpls(): TemplateSpec[] {
  const specs: TemplateSpec[] = []
  const styles = [
    {
      slug: "kajian-story-tonight",
      name: "Kajian Story — Malam Ini",
      bg: solid(EMERALD_DEEP),
      ink: "#ecfdf5",
      sub: "#6ee7b7",
      card: "#052e21",
      cardInk: "#d1fae5",
      accent: GOLD_SOFT,
      decorate: (els: DesignElement[]) => {
        els.push(...crescentShape(700, 220, 240, GOLD_SOFT, EMERALD_DEEP))
        els.push(...starScatter(10, 90, 180, 900, 400, GOLD_SOFT, 121))
      },
    },
    {
      slug: "kajian-story-speaker",
      name: "Kajian Story — Speaker Spotlight",
      bg: gradient("#0b1226", "#1e1b4b", 170),
      ink: "#e0e7ff",
      sub: "#a5b4fc",
      card: "#0f172a",
      cardInk: "#e0e7ff",
      accent: "#fbbf24",
      decorate: (els: DesignElement[]) => {
        els.push(ellipse({ x: 340, y: 240, w: 400, h: 400, fill: "#312e81" }))
        els.push(txt("🎓", { x: 340, y: 240, w: 400, h: 400, size: 150, align: "center", vAlign: "middle", font: F.sans }))
        els.push(...starScatter(8, 100, 700, 880, 300, "#a5b4fc", 131))
      },
    },
    {
      slug: "kajian-story-live",
      name: "Kajian Story — Live Streaming",
      bg: solid("#18181b"),
      ink: "#fafafa",
      sub: "#a1a1aa",
      card: "#27272a",
      cardInk: "#e4e4e7",
      accent: "#ef4444",
      decorate: (els: DesignElement[]) => {
        els.push(rect({ x: 90, y: 250, w: 300, h: 90, fill: "#ef4444", r: 45 }))
        els.push(txt("● LIVE", { x: 90, y: 250, w: 300, h: 90, size: 40, font: F.sans, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }))
        els.push(ellipse({ x: 760, y: 200, w: 220, h: 220, fill: "#27272a" }))
        els.push(...crescentShape(800, 240, 130, "#fde68a", "#18181b"))
      },
    },
    {
      slug: "kajian-story-quote",
      name: "Kajian Story — Islamic Quote",
      bg: solid("#fbf7ec"),
      ink: "#713f12",
      sub: "#a16207",
      card: "#f3ead6",
      cardInk: "#78350f",
      accent: "#d6bd7b",
      decorate: (els: DesignElement[]) => {
        els.push(img(asset("arch-ornament"), { x: 300, y: 120, w: 480, h: 600, opacity: 0.4 }))
        els.push(img(asset("tasbih"), { x: 90, y: 1540, w: 190, h: 247, rotation: -10 }))
      },
    },
    {
      slug: "kajian-story-jadwal",
      name: "Kajian Story — Jadwal Pekanan",
      bg: solid("#f0fdfa"),
      ink: "#134e4a",
      sub: "#0d9488",
      card: "#ffffff",
      cardInk: "#134e4a",
      accent: "#14b8a6",
      decorate: (els: DesignElement[]) => {
        els.push(rect({ x: 40, y: 40, w: STORY_W - 80, h: STORY_H - 80, fill: "transparent", stroke: "#99f6e4", sw: 5, r: 24 }))
        els.push(img(asset("mosque"), { x: 340, y: 1620, w: 400, h: 200, opacity: 0.3 }))
      },
    },
    {
      slug: "kajian-story-countdown",
      name: "Kajian Story — Hitung Mundur",
      bg: gradient("#1e1b4b", "#4c1d95", 165),
      ink: "#fef9c3",
      sub: "#c4b5fd",
      card: "#312e81",
      cardInk: "#e0e7ff",
      accent: "#fbbf24",
      decorate: (els: DesignElement[]) => {
        els.push(...starScatter(12, 90, 150, 900, 500, "#c4b5fd", 141))
        els.push(img(asset("lantern"), { x: 80, y: 80, w: 180, h: 234, rotation: -7 }))
        els.push(img(asset("lantern"), { x: 820, y: 80, w: 180, h: 234, rotation: 7 }))
      },
    },
  ]
  const contents = [
    {
      top: "malam ini · ba'da maghrib",
      main: "Kajian\nHadits\nMalamin",
      sub: "ust. h. yusuf maulana, lc.",
      card: "Aula Masjid Baiturrahman.\nBawa kitab Arba'in —\nkajian hadits ke-13 & 14.",
    },
    {
      top: "profil pemateri",
      main: "Ust. Dr.\nFauzi\nRahman",
      sub: "guru besar tafsir, uin imam bonjol",
      card: "Menekuni tafsir tematik 25 tahun.\nMinggu ini membahas QS. Al-Hujurat —\nadab bergaul dalam keluarga.",
    },
    {
      top: "tidak bisa datang?",
      main: "Tonton\nLive\nYoutub",
      sub: "kanal majelis talim al-ikhlas",
      card: "Streaming dimulai 19.30 WIB.\nKirim pertanyaan via kolom chat —\ndijawab langsung di sesi kedua.",
    },
    {
      top: "pengingat pekanan",
      main: "“Menuntut\nilmu wajib\nbagi muslim”",
      sub: "— hr. ibnu majah",
      card: "Ayo rutinkan hadir di majelis.\nSatu majelis sepekan menyelamatkan\nsepekan kehidupan kita.",
    },
    {
      top: "jadwal majelis pekan ini",
      main: "Kajian\nPekan\nIni",
      sub: "senin — ahad",
      card: "Sen: Tahsin ba'da Maghrib\nRab: Fiqih ibadah ba'da Isya\nJum: Yasinan 16.30\nAhad: Tafsir ba'da Subuh",
    },
    {
      top: "3 hari lagi!",
      main: "Tabligh\nAkbar\n21·06",
      sub: "graha serbaguna desa",
      card: "Pemateri: Ust. Dr. H. Abdul Karim, M.A.\nTema: Keluarga Sakinah di Era Digital.\nFree entry — datang lebih awal!",
    },
  ]
  const st = styles
  for (let i = 0; i < st.length; i++) {
    specs.push({
      slug: st[i].slug,
      name: st[i].name,
      category: CAT,
      type: "canvas",
      tags: ["story", "kajian", "pengajian", "islamic", "9:16"],
      width: 1080,
      height: 1920,
      build: () => storyTemplate(st[i], contents[i], st[i].decorate),
    })
  }
  return specs
}

/* ============================ banners ============================ */

function pengajianBannerTpls(): TemplateSpec[] {
  return [
    {
      slug: "kajian-banner-rutin",
      name: "Spanduk Kajian Rutin Masjid",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "kajian", "masjid", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-rutin", bg: solid(EMERALD_DEEP), strip: GOLD, ink: "#ecfdf5", accent: GOLD_SOFT, sub: "#a7f3d0" },
          {
            left: "MAJELIS\nTALIM",
            main: "Kajian Rutin\nBa'da Maghrib",
            sub: "Setiap Ahad · kitab Riyadhus Shalihin · dipandu tetua masjid",
            right: "Terbuka umum\nbawa kitab sendiri\nbila memungkinkan",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 80, y: 320, w: 340, h: 204, opacity: 0.85 }))
            els.push(...crescentShape(1700, 70, 150, GOLD_SOFT, EMERALD_DEEP))
          },
        ),
    },
    {
      slug: "kajian-banner-tabligh",
      name: "Spanduk Tabligh Akbar",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "tabligh akbar", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-tabligh", bg: gradient("#065f46", "#047857", 120), strip: "#fde68a", ink: "#ecfdf5", accent: "#fde68a", sub: "#a7f3d0" },
          {
            left: "TABLIGH\nAKBAR",
            main: "Keluarga\nSakinah Masayarakat",
            sub: "Ahad 21 Juni 2026 · 09.00 WIB · Graha Serbaguna Desa · pemateri Ust. Dr. H. Abdul Karim, M.A.",
            right: "Free entry\nmakan siang\ngratis",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 1650, y: 360, w: 280, h: 168, opacity: 0.4 }))
            els.push(...starScatter(9, 500, 50, 900, 55, GOLD_SOFT, 151))
          },
        ),
    },
    {
      slug: "kajian-banner-tpq",
      name: "Spanduk TPQ Al-Huda",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "tpq", "anak", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-tpq", bg: solid("#fffbeb"), strip: "#16a34a", ink: "#78350f", accent: "#b45309", sub: "#92400e" },
          {
            left: "TPQ\nAL-HUDA",
            main: "Pendaftaran\nSantri Baru",
            sub: "Iqra · Qur'an · Hadits · praktik ibadah · usia 5–17 tahun",
            right: "Kelas: Senin–Kamis\n16.00–17.30 WIB\nGedung TPQ Masjid",
          },
          (els) => {
            els.push(img(asset("book-open"), { x: 120, y: 300, w: 240, h: 180 }))
            els.push(...crescentShape(1700, 90, 140, "#fde68a", "#fffbeb"))
          },
        ),
    },
    {
      slug: "kajian-banner-muslimah",
      name: "Spanduk Kajian Muslimah",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "muslimah", "kajian", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-muslimah", bg: solid("#9d174d"), strip: "#f9a8d4", ink: "#fce7f3", accent: "#fde68a", sub: "#fbcfe8" },
          {
            left: "MAJELIS\nMUSLIMAH",
            main: "Kajian Ibu\nRabu Pagi",
            sub: "Kitab Fiqih Wanita · 09.00 WIB · Ruang Akhwat Masjid Ar-Rahmah",
            right: "Tersedia\nchildminding\nuntuk anak",
          },
          (els) => {
            els.push(img(asset("flower"), { x: 1690, y: 330, w: 190, h: 190, opacity: 0.9 }))
            els.push(img(asset("arch-ornament"), { x: 90, y: 280, w: 160, h: 200, opacity: 0.5 }))
          },
        ),
    },
    {
      slug: "kajian-banner-yasinan",
      name: "Spanduk Yasinan RT",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "yasinan", "rt", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-yasinan", bg: solid("#292524"), strip: "#d6bd7b", ink: "#fafaf9", accent: "#fde68a", sub: "#d6d3d1" },
          {
            left: "RT 04\nRW 02",
            main: "Yasinan &\nTahlilan Jumat",
            sub: "Bergilir antar rumah warga · 16.30 WIB — dipandu tetua kampung",
            right: "Tuan rumah pekan\nini: Bpk. Sarno\nNo. 12 Blok C",
          },
          (els) => {
            els.push(img(asset("tasbih"), { x: 100, y: 300, w: 190, h: 247, rotation: -10 }))
            els.push(...crescentShape(1690, 80, 140, "#fde68a", "#292524"))
          },
        ),
    },
    {
      slug: "kajian-banner-donasi",
      name: "Spanduk Donasi Pembangunan",
      category: CAT,
      type: "canvas",
      tags: ["spanduk", "donasi", "masjid", "banner"],
      width: BANNER_W,
      height: BANNER_H,
      build: () =>
        banner(
          { slug: "kajian-banner-donasi", bg: solid("#0f172a"), strip: GOLD, ink: "#f8fafc", accent: GOLD_SOFT, sub: "#cbd5e1" },
          {
            left: "MASJID\nAL-IKHLAS",
            main: "Donasi\nPembangunan",
            sub: "Target tahap II Rp 850 jt — atap & menara. Setiap rupiah tercatat.",
            right: "Transfer:\nBSI 7012-3456-78\na.n. Panitia Masjid",
          },
          (els) => {
            els.push(img(asset("mosque"), { x: 60, y: 330, w: 360, h: 216, opacity: 0.9 }))
            els.push(...crescentShape(1680, 60, 160, GOLD_SOFT, "#0f172a"))
            els.push(...starScatter(8, 500, 50, 1000, 55, GOLD_SOFT, 161))
          },
        ),
    },
  ]
}

/* ============================ hadits & quote posts ============================ */

const HADITS = [
  {
    slug: "hadits-niat-amal",
    name: "Hadits Niat Amal — Quote Post",
    arab: "“Innamal a'malu binniyyat.”",
    text: "“Sesungguhnya setiap amal tergantung pada niatnya.”",
    source: "HR. Bukhari no. 1 & Muslim no. 1907",
    note: "mulyakan niatmu hari ini — mulai dari yang kecil, ikhlas karena-Nya",
    bg: solid(EMERALD_DEEP),
    ink: "#ecfdf5",
    sub: "#6ee7b7",
    accent: GOLD_SOFT,
  },
  {
    slug: "hadits-tetangga",
    name: "Hadits Tetangga — Quote Post",
    arab: "“Ma zaala yushiru Jibrilu bi washiyyatil jar.”",
    text: "“Jibril terus menasihatiku soal tetangga, hingga kupikir ia akan menjadikannya pewaris.”",
    source: "HR. Bukhari no. 6014",
    note: "sapa tetangga hari ini — titipan nabi yang sering kita lupa",
    bg: solid("#fdf6ec"),
    ink: "#78350f",
    sub: "#a16207",
    accent: "#b45309",
  },
  {
    slug: "hadits-waktu",
    name: "Hadits Waktu — Quote Post",
    arab: "“Nikatan maghbulatani: shihhatun wa faragh.”",
    text: "“Dua nikmat yang sering dilupakan manusia: sehat dan waktu luang.”",
    source: "HR. Bukhari no. 6412",
    note: "jangan biarkan hari lewat begitu saja — investasikan untuk akhirat",
    bg: gradient("#0b1226", "#1e1b4b", 160),
    ink: "#e0e7ff",
    sub: "#a5b4fc",
    accent: GOLD_SOFT,
  },
  {
    slug: "hadits-ilmu",
    name: "Hadits Menuntut Ilmu — Quote Post",
    arab: "“Man salaka thariqan yaltamisu fihi ‘ilman sahhalallahu lahu thariqan ilal jannah.”",
    text: "“Siapa menempuh jalan untuk mencari ilmu, Allah mudahkan baginya jalan ke surga.”",
    source: "HR. Muslim no. 2699",
    note: "hadir di majelis adalah langkah kecil menuju jalan itu",
    bg: solid("#f0fdfa"),
    ink: "#134e4a",
    sub: "#0d9488",
    accent: "#0f766e",
  },
  {
    slug: "hadits-sedekah",
    name: "Hadits Sedekah — Quote Post",
    arab: "“Ma naqashot shadaqatum min mal.”",
    text: "“Harta tidak berkurang karena sedekah.”",
    source: "HR. Muslim no. 2588",
    note: "gelapkan keraguan, nyalakan keberanian berbagi",
    bg: gradient("#7f1d1d", "#b45309", 150),
    ink: "#fff7ed",
    sub: "#fde68a",
    accent: "#fef3c7",
  },
  {
    slug: "hadits-doamuslim",
    name: "Hadits Doa Sahabat — Quote Post",
    arab: "“D'awatul muslimi li akhihi bin dhahir mustajabah.”",
    text: "“Doa seorang muslim untuk saudaranya tanpa sepengetahuannya dikabulkan.”",
    source: "HR. Muslim no. 2733",
    note: "sebut nama sahabatmu dalam doa malam ini",
    bg: solid("#1e1b4b"),
    ink: "#fef9c3",
    sub: "#c4b5fd",
    accent: "#fbbf24",
  },
]

function haditsTpls(): TemplateSpec[] {
  return HADITS.map((h) => ({
    slug: h.slug,
    name: h.name,
    category: CAT,
    type: "canvas",
    tags: ["hadits", "quote", "islamic", "pengajian", "instagram"],
    width: IG,
    height: IG,
    build: () =>
      doc("canvas", IG, IG, h.bg, [
        page(h.slug, h.bg, [
          ...cornerOrnaments(64, 64, IG - 128, IG - 128, h.accent),
          txt("hadits · pengingat pekanan", { x: 0, y: 160, w: IG, h: 44, size: 25, font: F.sans, weight: 600, color: h.sub, align: "center", upper: true, ls: 7 }),
          txt(h.arab, { x: 110, y: 280, w: IG - 220, h: 190, size: 44, font: F.serif, weight: 700, color: h.accent, align: "center", vAlign: "middle", italic: true, lh: 1.35 }),
          txt(h.text, { x: 130, y: 500, w: IG - 260, h: 160, size: 38, font: F.body, weight: 700, color: h.ink, align: "center", lh: 1.4 }),
          txt(h.source, { x: 0, y: 690, w: IG, h: 46, size: 26, font: F.sans, weight: 600, color: h.sub, align: "center", upper: true, ls: 2 }),
          rule(440, 770, 200, h.accent, 5),
          txt(h.note, { x: 140, y: 810, w: IG - 280, h: 110, size: 28, font: F.hand, weight: 400, color: h.sub, align: "center", lh: 1.4 }),
          img(asset("tasbih"), { x: 445, y: 900, w: 190, h: 247, opacity: 0.9 }),
        ]),
      ]),
  }))
}

/* ============================ jadwal posts ============================ */

function jadwalTpls(): TemplateSpec[] {
  const rows: [string, string][] = [
    ["Senin", "Tahsin ba'da Maghrib"],
    ["Rabu", "Fiqih ibadah ba'da Isya"],
    ["Jumat", "Yasinan 16.30"],
    ["Sabtu", "Tahfizh anak 16.00"],
    ["Ahad", "Tafsir ba'da Subuh"],
  ]
  const scheduleTable = (x: number, y: number, w: number) =>
    rows.flatMap(([day, ev], i) => {
      const ry = y + i * 108
      return [
        rect({ x, y: ry, w, h: 88, fill: i % 2 ? "#052e21" : "#064e3b", r: 14 }),
        txt(day, { x: x + 30, y: ry, w: 220, h: 88, size: 30, font: F.sans, weight: 700, color: GOLD_SOFT, vAlign: "middle" }),
        txt(ev, { x: x + 260, y: ry, w: w - 290, h: 88, size: 28, font: F.sans, weight: 500, color: "#d1fae5", vAlign: "middle" }),
      ] as DesignElement[]
    })

  return [
    {
      slug: "jadwal-majelis-mingguan",
      name: "Jadwal Majelis Mingguan — Post",
      category: CAT,
      type: "canvas",
      tags: ["jadwal", "kajian", "mingguan", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid(EMERALD_DEEP), [
          page("Jadwal", solid(EMERALD_DEEP), [
            ...cornerOrnaments(50, 50, IG - 100, IG - 100, GOLD),
            txt("masjid al-ikhlas", { x: 0, y: 110, w: IG, h: 44, size: 26, font: F.sans, weight: 600, color: "#6ee7b7", align: "center", upper: true, ls: 6 }),
            txt("Jadwal Majelis\nPekan Ini", { x: 90, y: 170, w: IG - 180, h: 190, size: 62, font: F.pop, weight: 800, color: "#ecfdf5", align: "center", lh: 1.12 }),
            ...scheduleTable(120, 400, IG - 240),
            txt("ubah sesuai jadwal masjidmu — semua elemen bisa diedit", { x: 0, y: 960, w: IG, h: 44, size: 24, font: F.hand, weight: 400, color: "#6ee7b7", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "jadwal-imam-lima-waktu",
      name: "Jadwal Imam Lima Waktu — Post",
      category: CAT,
      type: "canvas",
      tags: ["jadwal", "imam", "masjid", "instagram"],
      width: IG,
      height: IG,
      build: () => {
        const imams: [string, string][] = [
          ["Subuh", "H. Ahmad Fauzi"],
          ["Dzuhur", "H. Rahmat Hidayat"],
          ["Ashar", "H. Suparman"],
          ["Maghrib", "Ust. Bagus Prasetyo"],
          ["Isya", "Ust. Dimas Wicaksono"],
        ]
        return doc("canvas", IG, IG, solid("#fafaf9"), [
          page("Imam", solid("#fafaf9"), [
            rect({ x: 0, y: 0, w: IG, h: 240, fill: "#134e4a" }),
            txt("JADWAL IMAM & MUADZIN", { x: 0, y: 80, w: IG, h: 60, size: 44, font: F.pop, weight: 800, color: "#ccfbf1", align: "center" }),
            txt("masjid baiturrahman · pekan ini", { x: 0, y: 155, w: IG, h: 40, size: 25, font: F.sans, weight: 500, color: "#99f6e4", align: "center" }),
            ...imams.flatMap(([salat, name], i) => {
              const y = 300 + i * 120
              return [
                rect({ x: 90, y, w: IG - 180, h: 92, fill: "#ffffff", stroke: "#e2e8f0", sw: 2, r: 16 }),
                rect({ x: 90, y, w: 190, h: 92, fill: "#0d9488", r: 16 }),
                txt(salat, { x: 90, y, w: 190, h: 92, size: 30, font: F.sans, weight: 700, color: "#ffffff", align: "center", vAlign: "middle" }),
                txt(name, { x: 320, y, w: IG - 430, h: 92, size: 32, font: F.sans, weight: 600, color: "#134e4a", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("susun ulang sesuai roster masjidmu", { x: 0, y: 930, w: IG, h: 46, size: 25, font: F.hand, weight: 400, color: "#0f766e", align: "center" }),
            img(asset("crescent-star"), { x: 860, y: 70, w: 130, h: 130 }),
          ]),
        ])
      },
    },
    {
      slug: "jadwal-ramadhan-kajian",
      name: "Jadwal Kajian Ramadan — Post",
      category: CAT,
      type: "canvas",
      tags: ["jadwal", "ramadan", "kajian", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, gradient("#1e1b4b", "#312e81", 160), [
          page("Ramadhan", gradient("#1e1b4b", "#312e81", 160), [
            txt("ramadan 1447 h", { x: 0, y: 120, w: IG, h: 44, size: 26, font: F.sans, weight: 600, color: "#c4b5fd", align: "center", upper: true, ls: 6 }),
            txt("Kajian Khusus\nRamadan", { x: 90, y: 180, w: IG - 180, h: 190, size: 62, font: F.pop, weight: 800, color: "#fde68a", align: "center", lh: 1.12 }),
            ...[
              ["Ba'da Subuh", "Tafsir 3 juz per hari"],
              ["Zuhur", "Kajian fikih shaum"],
              ["Ba'da Ashar", "Tadarus kelompok"],
              ["Ba'da Tarawih", "Kultum malam"],
            ].flatMap(([t, ev], i) => {
              const y = 420 + i * 110
              return [
                rect({ x: 110, y, w: IG - 220, h: 84, fill: "#0f172a", opacity: 0.75, r: 14 }),
                txt(t, { x: 140, y, w: 300, h: 84, size: 28, font: F.sans, weight: 700, color: "#fde68a", vAlign: "middle" }),
                txt(ev, { x: 440, y, w: 480, h: 84, size: 27, font: F.sans, weight: 500, color: "#e0e7ff", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            img(asset("lantern"), { x: 80, y: 880, w: 170, h: 221, rotation: -6 }),
            img(asset("lantern"), { x: 830, y: 880, w: 170, h: 221, rotation: 6 }),
          ]),
        ]),
    },
    {
      slug: "jadwal-tpq-mingguan",
      name: "Jadwal TPQ Mingguan — Post",
      category: CAT,
      type: "canvas",
      tags: ["jadwal", "tpq", "anak", "instagram"],
      width: IG,
      height: IG,
      build: () =>
        doc("canvas", IG, IG, solid("#fffbeb"), [
          page("TPQ", solid("#fffbeb"), [
            rect({ x: 0, y: 0, w: IG, h: 200, fill: "#b45309" }),
            txt("TPQ AL-HUDA · JADWAL MINGGUAN", { x: 0, y: 70, w: IG, h: 60, size: 40, font: F.pop, weight: 800, color: "#fef3c7", align: "center" }),
            ...[
              ["Senin", "Iqra kelas 1–3"],
              ["Selasa", "Iqra kelas 4–6"],
              ["Rabu", "Qur'an & tajwid"],
              ["Kamis", "Hadits & praktik shalat"],
            ].flatMap(([d, ev], i) => {
              const y = 260 + i * 120
              return [
                rect({ x: 100, y, w: IG - 200, h: 90, fill: "#ffffff", stroke: "#fde68a", sw: 3, r: 45 }),
                ellipse({ x: 130, y: y + 15, w: 60, h: 60, fill: "#f59e0b" }),
                txt(String(i + 1), { x: 130, y: y + 15, w: 60, h: 60, size: 32, font: F.pop, weight: 800, color: "#ffffff", align: "center", vAlign: "middle" }),
                txt(d, { x: 220, y, w: 200, h: 90, size: 30, font: F.sans, weight: 700, color: "#92400e", vAlign: "middle" }),
                txt(ev, { x: 430, y, w: 500, h: 90, size: 28, font: F.sans, weight: 500, color: "#78350f", vAlign: "middle" }),
              ] as DesignElement[]
            }),
            txt("sebarkan ke grup WA orang tua ya!", { x: 0, y: 920, w: IG, h: 46, size: 26, font: F.hand, weight: 400, color: "#b45309", align: "center" }),
          ]),
        ]),
    },
    {
      slug: "pengajian-poster-majelis-map",
      name: "Poster Peta Majelis Sekitar (A4)",
      category: CAT,
      type: "canvas",
      tags: ["poster", "majelis", "peta", "info"],
      width: A4W,
      height: A4H,
      build: () => {
        const spots: [string, string, number, number][] = [
          ["Masjid Al-Ikhlas", "kajian Ahad ba'da Subuh", 140, 620],
          ["Musholla Nurul Iman", "kajian Rabu ba'da Isya", 500, 700],
          ["Gedung TPQ Al-Huda", "TPQ Senin—Kamis", 860, 640],
          ["Majelis Muslimah Ar-Rahmah", "kajian Kamis pagi", 140, 1050],
          ["Balai Warga RT 04", "Yasinan Jumat 16.30", 500, 1130],
          ["Mahad Al-Furqan", "kajian mahasiswa Jumat", 860, 1070],
        ]
        return doc("canvas", A4W, A4H, solid("#fbf7ec"), [
          page("Peta Majelis", solid("#fbf7ec"), [
            rect({ x: 0, y: 0, w: A4W, h: 420, fill: EMERALD_DEEP }),
            txt("PETA MAJELIS", { x: 0, y: 110, w: A4W, h: 80, size: 64, font: F.pop, weight: 800, color: GOLD_SOFT, align: "center", ls: 3 }),
            txt("tempat-tempat mencari ilmu di sekitar kita", { x: 0, y: 210, w: A4W, h: 50, size: 30, font: F.body, weight: 400, color: "#a7f3d0", align: "center", italic: true }),
            img(asset("mosque"), { x: 470, y: 260, w: 300, h: 150, opacity: 0.5 }),
            ...spots.flatMap(([name, info, x, y]) => [
              rect({ x, y, w: 240, h: 260, fill: "#ffffff", stroke: "#e7ddc8", sw: 3, r: 18 }),
              ellipse({ x: x + 75, y: y + 30, w: 90, h: 90, fill: "#065f46" }),
              txt("🕌", { x: x + 75, y: y + 30, w: 90, h: 90, size: 40, align: "center", vAlign: "middle", font: F.sans }),
              txt(name, { x: x + 12, y: y + 135, w: 216, h: 70, size: 22, font: F.sans, weight: 700, color: "#064e3b", align: "center", lh: 1.2 }),
              txt(info, { x: x + 12, y: y + 205, w: 216, h: 44, size: 18, font: F.sans, weight: 500, color: "#92703c", align: "center" }),
            ] as DesignElement[]),
            txt("tandai majelis favoritmu & ajak tetangga ikut hadir", { x: 0, y: 1560, w: A4W, h: 50, size: 27, font: F.hand, weight: 400, color: "#065f46", align: "center" }),
          ]),
        ])
      },
    },
  ]
}

/* ============================ export ============================ */

export const SEASONAL_PENGAJIAN_TPLS: TemplateSpec[] = [
  ...kajianPostTpls(),
  ...pengajianPosterTpls(),
  ...pengajianStoryTpls(),
  ...pengajianBannerTpls(),
  ...haditsTpls(),
  ...jadwalTpls(),
]
