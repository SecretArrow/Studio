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
