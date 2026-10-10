/**
 * Asset library — original vector graphics (CC0) served as data-URL SVGs.
 * Used by the editor Elements panel and the template builder.
 * Categories: shapes, frames, badges, decorations, patterns, stickers.
 */

export interface AssetDef {
  id: string
  label: string
  category: string
  svg: string
}

function svg(body: string, w = 200, h = 200): string {
  return `data:image/svg+xml;base64,${typeof btoa !== "undefined" ? btoa(body) : Buffer.from(body, "binary").toString("base64")}`
    .replace("data:image/svg+xml;base64,data:", "data:image/svg+xml;base64,") // safety
}

function enc(body: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(body)}`
}

export const SHAPE_ASSETS: AssetDef[] = [
  { id: "blob-1", label: "Blob", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M46 32C69 12 108 8 138 22C168 36 190 68 184 100C178 132 148 162 112 170C76 178 34 162 20 130C6 98 23 52 46 32Z" fill="#8b5cf6"/></svg>`) },
  { id: "blob-2", label: "Blob 2", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M60 20C90 4 140 10 165 40C190 70 190 120 165 150C140 180 90 196 60 180C30 164 10 120 15 90C20 60 30 36 60 20Z" fill="#f59e0b"/></svg>`) },
  { id: "ring", label: "Ring", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="80" fill="none" stroke="#111827" stroke-width="22"/></svg>`) },
  { id: "triangle", label: "Triangle", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 20L185 175H15L100 20Z" fill="#10b981"/></svg>`) },
  { id: "half-circle", label: "Half Circle", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M0 100A100 100 0 0 1 200 100Z" fill="#ec4899"/></svg>`) },
  { id: "quarter", label: "Quarter", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M0 0H200A200 200 0 0 1 0 0Z" fill="#06b6d4" transform="rotate(0)"/></svg>`) },
  { id: "cross", label: "Plus", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M70 0H130V70H200V130H130V200H70V130H0V70H70V0Z" fill="#f97316"/></svg>`) },
  { id: "wave", label: "Wave", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 60C50 10 100 10 150 60C200 110 250 110 300 60C350 10 400 10 400 60V120H0V60Z" fill="#6366f1"/></svg>`) },
  { id: "sun", label: "Sun", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="46" fill="#fbbf24"/><g stroke="#fbbf24" stroke-width="12" stroke-linecap="round"><path d="M100 12v22M100 166v22M12 100h22M166 100h22M37 37l16 16M147 147l16 16M163 37l-16 16M53 147l-16 16"/></g></svg>`) },
  { id: "moon", label: "Crescent Moon", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M130 20a80 80 0 1 0 0 160 84 84 0 0 1 0-160Z" fill="#a78bfa"/></svg>`) },
  { id: "cloud", label: "Cloud", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130"><path d="M50 110a34 34 0 0 1-4-67 44 44 0 0 1 84-14 36 36 0 0 1 20 81Z" fill="#93c5fd"/></svg>`) },
  { id: "lightning", label: "Lightning", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M115 10 45 115h45l-15 75 80-115h-45Z" fill="#facc15"/></svg>`) },
  { id: "heart-big", label: "Heart", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 180"><path d="M100 170S10 112 10 55A48 48 0 0 1 100 30 48 48 0 0 1 190 55c0 57-90 115-90 115Z" fill="#f43f5e"/></svg>`) },
  { id: "leaf", label: "Leaf", category: "shapes", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M30 170C30 80 90 25 175 20c5 85-50 150-140 150Z" fill="#4ade80"/><path d="M40 165C70 120 105 85 165 35" stroke="#166534" stroke-width="8" fill="none" stroke-linecap="round"/></svg>`) },
  { id: "mountain", label: "Mountains", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><path d="M0 240 110 70l70 100 60-90 160 160Z" fill="#34d399"/><path d="M96 92l14-22 14 22-14 10Z" fill="#ffffff"/><path d="M226 96l14-20 14 20-14 10Z" fill="#ffffff"/><circle cx="330" cy="46" r="26" fill="#fbbf24"/></svg>`) },
  { id: "coffee", label: "Coffee Cup", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M45 85h95v55a35 35 0 0 1-35 35H80a35 35 0 0 1-35-35Z" fill="#b45309"/><path d="M140 95h14a20 20 0 0 1 0 40h-14" fill="none" stroke="#b45309" stroke-width="10"/><path d="M70 60c0-12 10-12 10-24M100 60c0-12 10-12 10-24" stroke="#d1d5db" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="92" cy="85" rx="48" ry="10" fill="#fde68a"/></svg>`) },
  { id: "cake", label: "Cake", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="40" y="110" width="120" height="60" rx="10" fill="#f9a8d4"/><rect x="55" y="80" width="90" height="34" rx="8" fill="#fb7185"/><path d="M100 40v28" stroke="#78350f" stroke-width="6" stroke-linecap="round"/><ellipse cx="100" cy="38" rx="6" ry="9" fill="#fbbf24"/><path d="M55 110c15-12 30 12 45 0s30 12 45 0" stroke="#ffffff" stroke-width="8" fill="none"/></svg>`) },
  { id: "gift", label: "Gift", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="35" y="80" width="130" height="95" rx="10" fill="#8b5cf6"/><rect x="85" y="80" width="30" height="95" fill="#fde047"/><rect x="28" y="58" width="144" height="30" rx="8" fill="#a78bfa"/><path d="M100 56C88 30 60 24 56 40s22 22 44 16ZM100 56c12-26 40-32 44-16s-22 22-44 16Z" fill="#fde047"/></svg>`) },
  { id: "camera", label: "Camera", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect x="20" y="40" width="160" height="95" rx="14" fill="#334155"/><rect x="70" y="22" width="60" height="26" rx="8" fill="#334155"/><circle cx="100" cy="88" r="34" fill="#94a3b8"/><circle cx="100" cy="88" r="22" fill="#0ea5e9"/><circle cx="158" cy="58" r="7" fill="#fbbf24"/></svg>`) },
  { id: "music-note", label: "Music Note", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M78 150V40l80-18v112" stroke="#7c3aed" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="58" cy="152" rx="24" ry="19" fill="#7c3aed"/><ellipse cx="138" cy="134" rx="24" ry="19" fill="#7c3aed"/></svg>`) },
  { id: "trophy", label: "Trophy", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M60 30h80v50a40 40 0 0 1-80 0Z" fill="#fbbf24"/><path d="M60 42H36a26 26 0 0 0 26 34M140 42h24a26 26 0 0 1-26 34" fill="none" stroke="#d97706" stroke-width="10"/><path d="M92 118h16v26h16v14H76v-14h16Z" fill="#d97706"/><rect x="60" y="158" width="80" height="14" rx="6" fill="#92400e"/></svg>`) },
  { id: "grad-cap", label: "Graduation Cap", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><path d="M100 20 190 62l-90 42L10 62Z" fill="#1e293b"/><path d="M52 84v34c0 12 96 12 96 0V84l-48 22Z" fill="#334155"/><path d="M182 66v34" stroke="#fbbf24" stroke-width="7" stroke-linecap="round"/><circle cx="182" cy="106" r="7" fill="#fbbf24"/></svg>`) },
  { id: "rocket", label: "Rocket", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 12c30 22 44 58 44 92l-14 30H70l-14-30c0-34 14-70 44-92Z" fill="#e2e8f0"/><circle cx="100" cy="82" r="18" fill="#0ea5e9"/><path d="M70 134 44 164l30-8M130 134l26 30-30-8" fill="#f97316"/><path d="M88 158h24l-12 30Z" fill="#fbbf24"/></svg>`) },
  { id: "crown", label: "Crown", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><path d="M30 110 20 44l40 26 40-46 40 46 40-26-10 66Z" fill="#fbbf24"/><rect x="30" y="112" width="140" height="18" rx="6" fill="#d97706"/><circle cx="100" cy="86" r="8" fill="#ef4444"/></svg>`) },
  { id: "planet", label: "Planet", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140"><circle cx="100" cy="70" r="48" fill="#a78bfa"/><path d="M64 52c10 14 60 20 74 8M58 84c16 12 68 16 84 4" stroke="#7c3aed" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="70" rx="86" ry="22" fill="none" stroke="#fbbf24" stroke-width="8" transform="rotate(-14 100 70)"/></svg>`) },
  { id: "icecream", label: "Ice Cream", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220"><path d="M100 18a34 34 0 0 1 33 26 30 30 0 0 1 13 56H54a30 30 0 0 1 13-56A34 34 0 0 1 100 18Z" fill="#f9a8d4"/><circle cx="72" cy="66" r="22" fill="#fef3c7"/><circle cx="128" cy="66" r="22" fill="#fca5a5"/><path d="M60 100h80l-40 108Z" fill="#d97706"/><path d="M66 128h68M72 154h56" stroke="#b45309" stroke-width="5"/></svg>`) },
  { id: "pizza", label: "Pizza Slice", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 190 26 52a170 170 0 0 1 148 0Z" fill="#fbbf24"/><path d="M26 52a170 170 0 0 1 148 0l-8 14a152 152 0 0 0-132 0Z" fill="#dc2626"/><circle cx="82" cy="96" r="13" fill="#dc2626"/><circle cx="122" cy="120" r="13" fill="#dc2626"/><circle cx="96" cy="150" r="11" fill="#dc2626"/></svg>`) },
  { id: "book-open", label: "Open Book", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><path d="M100 34C78 18 42 16 18 26v96c24-10 60-8 82 8Z" fill="#f59e0b"/><path d="M100 34c22-16 58-18 82-8v96c-24-10-60-8-82 8Z" fill="#fbbf24"/><path d="M100 34v96" stroke="#b45309" stroke-width="6"/></svg>`) },
  { id: "pencil", label: "Pencil", category: "illustrations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="86" y="30" width="28" height="118" rx="4" transform="rotate(45 100 89)" fill="#fbbf24"/><rect x="86" y="12" width="28" height="22" rx="4" transform="rotate(45 100 23)" fill="#f43f5e"/><path d="M56 132l10 24 14-14Z" transform="rotate(0 66 144)" fill="#fde68a"/><path d="M52 148l6 16 10-10" fill="#1f2937"/></svg>`) },
  { id: "chat-bubble", label: "Chat Bubble", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 170"><path d="M20 20h160v100H90l-34 34v-34H20Z" fill="#c4b5fd"/><circle cx="65" cy="70" r="9" fill="#ffffff"/><circle cx="100" cy="70" r="9" fill="#ffffff"/><circle cx="135" cy="70" r="9" fill="#ffffff"/></svg>`) },
  { id: "ribbon-banner", label: "Ribbon Banner", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100" preserveAspectRatio="none"><path d="M0 20 40 50 0 80V20ZM300 20 260 50l40 30V20Z" fill="#d97706"/><rect x="36" y="14" width="228" height="72" fill="#f59e0b"/></svg>`) },
  { id: "laurel", label: "Laurel Wreath", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="none" stroke="#059669" stroke-width="9" stroke-linecap="round"><path d="M62 28C34 52 26 96 44 132M138 28c28 24 36 68 18 104"/></g><g fill="#10b981"><ellipse cx="60" cy="34" rx="14" ry="7" transform="rotate(-38 60 34)"/><ellipse cx="42" cy="62" rx="14" ry="7" transform="rotate(-62 42 62)"/><ellipse cx="36" cy="96" rx="14" ry="7" transform="rotate(-84 36 96)"/><ellipse cx="46" cy="130" rx="14" ry="7" transform="rotate(-110 46 130)"/><ellipse cx="140" cy="34" rx="14" ry="7" transform="rotate(38 140 34)"/><ellipse cx="158" cy="62" rx="14" ry="7" transform="rotate(62 158 62)"/><ellipse cx="164" cy="96" rx="14" ry="7" transform="rotate(84 164 96)"/><ellipse cx="154" cy="130" rx="14" ry="7" transform="rotate(110 154 130)"/></g></svg>`) },
  { id: "frame-polaroid", label: "Polaroid Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340" preserveAspectRatio="none"><rect x="8" y="8" width="284" height="324" rx="10" fill="#ffffff" stroke="#e5e7eb" stroke-width="4"/><rect x="30" y="30" width="240" height="220" fill="#e5e7eb"/></svg>`) },
  { id: "frame-tape", label: "Taped Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="none"><rect x="20" y="28" width="260" height="250" rx="6" fill="#fffbeb" stroke="#e7e5e4" stroke-width="4"/><rect x="110" y="6" width="80" height="34" fill="#fde68a" opacity="0.85" transform="rotate(-6 150 23)"/><rect x="86" y="50" width="128" height="150" fill="#e5e7eb"/></svg>`) },
  { id: "waves-pattern", label: "Waves", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M0 40c40-30 80-30 120 0s80 30 120 0 80-30 120 0v80H0Z" fill="#93c5fd" opacity="0.6"/></svg>`) },
  { id: "checkers", label: "Checkers", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="none"><rect width="200" height="200" fill="#faf5ff"/><rect width="100" height="100" fill="#e9d5ff"/><rect x="100" y="100" width="100" height="100" fill="#e9d5ff"/></svg>`) },
  { id: "stripes-diag", label: "Retro Stripes", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" preserveAspectRatio="none"><rect width="400" height="400" fill="#fff7ed"/><path d="M0 400 400 0v80L0 400ZM0 300 300 0h80L0 380Z" fill="#fb923c" opacity="0.75"/></svg>`) },
  { id: "sunburst", label: "Sunburst", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#fbbf24"><path d="M100 100 90 0h20ZM100 100l10-100h-20Z" opacity="0.2"/><path d="M100 100 20 40l60 20Z" opacity="0.35"/><path d="M100 100l80-60-60 20Z" opacity="0.35"/><path d="M100 100 0 90v20Z" opacity="0.5"/><path d="M100 100h200l-100 10Z" opacity="0.5"/><path d="M100 100 20 160l20-60Z" opacity="0.35"/><path d="M100 100l80 60-60-20Z" opacity="0.35"/></g><circle cx="100" cy="100" r="30" fill="#f59e0b"/></svg>`) },
]

export const FRAME_ASSETS: AssetDef[] = [
  { id: "frame-simple", label: "Simple Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="none"><rect x="10" y="10" width="280" height="280" fill="none" stroke="#111827" stroke-width="8"/><rect x="30" y="30" width="240" height="240" fill="#f3f4f6"/></svg>`) },
  { id: "frame-arch", label: "Arch Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 380" preserveAspectRatio="none"><path d="M20 380V160C20 82 75 20 150 20C225 20 280 82 280 160V380H20Z" fill="#ede9fe" stroke="#7c3aed" stroke-width="8"/></svg>`) },
  { id: "frame-circle", label: "Circle Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><circle cx="150" cy="150" r="130" fill="#fce7f3" stroke="#db2777" stroke-width="8"/></svg>`) },
  { id: "frame-dashed", label: "Dashed Frame", category: "frames", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" preserveAspectRatio="none"><rect x="10" y="10" width="280" height="280" fill="#eff6ff" stroke="#2563eb" stroke-width="6" stroke-dasharray="18 12" rx="24"/></svg>`) },
]

export const BADGE_ASSETS: AssetDef[] = [
  { id: "badge-sale", label: "Sale Badge", category: "badges", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 5L122 27L153 18L160 50L192 60L180 91L200 115L177 135L182 167L150 170L137 200L108 184L78 199L65 169L33 166L38 134L15 114L35 90L23 59L55 49L62 17L93 26L100 5Z" fill="#ef4444"/><text x="100" y="112" font-family="Arial, sans-serif" font-size="46" font-weight="bold" fill="#ffffff" text-anchor="middle">SALE</text></svg>`) },
  { id: "badge-new", label: "New Badge", category: "badges", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 90"><rect width="220" height="90" rx="45" fill="#8b5cf6"/><text x="110" y="60" font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="#ffffff" text-anchor="middle">NEW</text></svg>`) },
  { id: "badge-star", label: "Star Badge", category: "badges", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#f59e0b"/><path d="M100 45L115 78L152 83L125 108L131 145L100 127L69 145L75 108L48 83L85 78L100 45Z" fill="#ffffff"/></svg>`) },
]

export const DECORATION_ASSETS: AssetDef[] = [
  { id: "confetti", label: "Confetti", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><circle cx="40" cy="40" r="10" fill="#f43f5e"/><rect x="100" y="20" width="16" height="16" transform="rotate(30 108 28)" fill="#8b5cf6"/><path d="M180 30l14 24-28 0z" fill="#f59e0b"/><circle cx="260" cy="60" r="12" fill="#10b981"/><rect x="320" y="30" width="18" height="18" transform="rotate(-20 329 39)" fill="#06b6d4"/><circle cx="90" cy="120" r="9" fill="#f59e0b"/><rect x="170" y="100" width="16" height="16" transform="rotate(45 178 108)" fill="#ec4899"/><circle cx="250" cy="140" r="10" fill="#6366f1"/><path d="M320 110l14 24-28 0z" fill="#84cc16"/><rect x="50" y="170" width="16" height="16" transform="rotate(15 58 178)" fill="#14b8a6"/><circle cx="140" cy="180" r="9" fill="#f97316"/><rect x="220" y="180" width="16" height="16" transform="rotate(-30 228 188)" fill="#a855f7"/><circle cx="300" cy="180" r="10" fill="#ef4444"/></svg>`) },
  { id: "sparkle", label: "Sparkle", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M100 10L118 82L190 100L118 118L100 190L82 118L10 100L82 82L100 10Z" fill="#fde047"/></svg>`) },
  { id: "sparkle-small", label: "Sparkle Duo", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M70 20L82 58L120 70L82 82L70 120L58 82L20 70L58 58L70 20Z" fill="#c084fc"/><path d="M140 90L148 114L172 122L148 130L140 154L132 130L108 122L132 114L140 90Z" fill="#f0abfc"/></svg>`) },
  { id: "arrow-curve", label: "Curved Arrow", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><path d="M30 160C60 60 140 40 175 80" stroke="#111827" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M175 80L150 60M175 80L178 48" stroke="#111827" stroke-width="10" fill="none" stroke-linecap="round"/></svg>`) },
  { id: "underline-scribble", label: "Scribble Underline", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" preserveAspectRatio="none"><path d="M10 40C60 20 120 20 160 35C200 50 250 45 290 25" stroke="#f59e0b" stroke-width="12" fill="none" stroke-linecap="round"/></svg>`) },
  { id: "flower", label: "Flower", category: "decorations", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g fill="#f9a8d4"><circle cx="100" cy="50" r="32"/><circle cx="145" cy="85" r="32"/><circle cx="128" cy="138" r="32"/><circle cx="72" cy="138" r="32"/><circle cx="55" cy="85" r="32"/></g><circle cx="100" cy="100" r="26" fill="#fbbf24"/></svg>`) },
]

export const PATTERN_ASSETS: AssetDef[] = [
  { id: "dots", label: "Dots Pattern", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><circle cx="15" cy="15" r="4" fill="#d1d5db"/><circle cx="45" cy="15" r="4" fill="#d1d5db"/><circle cx="15" cy="45" r="4" fill="#d1d5db"/><circle cx="45" cy="45" r="4" fill="#d1d5db"/></svg>`) },
  { id: "grid", label: "Grid Pattern", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><path d="M60 0H0V60" fill="none" stroke="#e5e7eb" stroke-width="2"/></svg>`) },
  { id: "diagonal", label: "Diagonal Stripes", category: "patterns", svg: enc(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M-10 10L10 -10M0 40L40 0M30 50L50 30" stroke="#f3f4f6" stroke-width="8"/></svg>`) },
]

export const ALL_ASSET_COLLECTIONS: { id: string; label: string; assets: AssetDef[] }[] = [
  { id: "shapes", label: "Shapes", assets: SHAPE_ASSETS },
  { id: "frames", label: "Frames", assets: FRAME_ASSETS },
  { id: "badges", label: "Badges", assets: BADGE_ASSETS },
  { id: "decorations", label: "Decorations", assets: DECORATION_ASSETS },
  { id: "patterns", label: "Patterns", assets: PATTERN_ASSETS },
]

export function findAsset(id: string): AssetDef | undefined {
  for (const col of ALL_ASSET_COLLECTIONS) {
    const hit = col.assets.find((a) => a.id === id)
    if (hit) return hit
  }
  return undefined
}
