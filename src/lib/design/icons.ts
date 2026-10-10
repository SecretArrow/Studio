/**
 * Icon library — original SVG path data (24×24 viewBox, stroke-based, CC0).
 * Keyed by name; consumed by the editor Elements panel and icon elements.
 * Each entry: { label, category, paths } where paths are SVG path `d` strings
 * drawn with stroke=currentColor, stroke-width=2, fill=none.
 */
export interface IconDef {
  label: string
  category: "basic" | "arrows" | "media" | "business" | "social" | "nature" | "ui"
  paths: string[]
}

export const ICON_LIBRARY: Record<string, IconDef> = {
  heart: { label: "Heart", category: "basic", paths: ["M12 21C12 21 4 14.5 4 9.5C4 6.5 6.5 4 9.5 4C11 4 12 5 12 5C12 5 13 4 14.5 4C17.5 4 20 6.5 20 9.5C20 14.5 12 21 12 21Z"] },
  star: { label: "Star", category: "basic", paths: ["M12 3L14.7 8.6L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.3 8.6L12 3Z"] },
  check: { label: "Check", category: "basic", paths: ["M4 12L10 18L20 6"] },
  x: { label: "Cross", category: "basic", paths: ["M6 6L18 18", "M18 6L6 18"] },
  plus: { label: "Plus", category: "basic", paths: ["M12 5V19", "M5 12H19"] },
  minus: { label: "Minus", category: "basic", paths: ["M5 12H19"] },
  info: { label: "Info", category: "basic", paths: ["M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21Z", "M12 11V16", "M12 8V8.01"] },
  bell: { label: "Bell", category: "basic", paths: ["M6 8C6 5.2 8.2 3 11 3H13C15.8 3 18 5.2 18 8V13L20 17H4L6 13V8Z", "M10 20C10.5 21 11.2 21.5 12 21.5C12.8 21.5 13.5 21 14 20"] },
  home: { label: "Home", category: "basic", paths: ["M4 11L12 4L20 11", "M6 10V20H18V10"] },
  camera: { label: "Camera", category: "media", paths: ["M4 8H8L10 5H14L16 8H20V19H4V8Z", "M12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16Z"] },
  music: { label: "Music", category: "media", paths: ["M9 18V6L20 4V16", "M9 18C9 19.66 7.66 21 6 21C4.34 21 3 19.66 3 18C3 16.34 4.34 15 6 15C7.66 15 9 16.34 9 18Z", "M20 16C20 17.66 18.66 19 17 19C15.34 19 14 17.66 14 16C14 14.34 15.34 13 17 13C18.66 13 20 14.34 20 16Z"] },
  play: { label: "Play", category: "media", paths: ["M7 4L20 12L7 20V4Z"] },
  pause: { label: "Pause", category: "media", paths: ["M7 4H10V20H7V4Z", "M14 4H17V20H14V4Z"] },
  mic: { label: "Microphone", category: "media", paths: ["M12 3C13.66 3 15 4.34 15 6V12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12V6C9 4.34 10.34 3 12 3Z", "M5 11C5 14.87 8.13 18 12 18C15.87 18 19 14.87 19 11", "M12 18V21"] },
  video: { label: "Video", category: "media", paths: ["M3 6H15V18H3V6Z", "M15 10L21 6V18L15 14"] },
  image: { label: "Image", category: "media", paths: ["M4 5H20V19H4V5Z", "M8 11C9.1 11 10 10.1 10 9C10 7.9 9.1 7 8 7C6.9 7 6 7.9 6 9C6 10.1 6.9 11 8 11Z", "M4 17L10 11L14 15L17 12L20 15"] },
  arrowRight: { label: "Arrow Right", category: "arrows", paths: ["M4 12H20", "M14 6L20 12L14 18"] },
  arrowLeft: { label: "Arrow Left", category: "arrows", paths: ["M20 12H4", "M10 6L4 12L10 18"] },
  arrowUp: { label: "Arrow Up", category: "arrows", paths: ["M12 20V4", "M6 10L12 4L18 10"] },
  arrowDown: { label: "Arrow Down", category: "arrows", paths: ["M12 4V20", "M6 14L12 20L18 14"] },
  undo: { label: "Undo", category: "arrows", paths: ["M4 10H14C17.3 10 20 12.7 20 16C20 17.5 19.5 18.8 18.6 19.8", "M8 6L4 10L8 14"] },
  redo: { label: "Redo", category: "arrows", paths: ["M20 10H10C6.7 10 4 12.7 4 16C4 17.5 4.5 18.8 5.4 19.8", "M16 6L20 10L16 14"] },
  rocket: { label: "Rocket", category: "business", paths: ["M12 3C15.5 5 17.5 8.5 17.5 13L12 18L6.5 13C6.5 8.5 8.5 5 12 3Z", "M12 10V10.01", "M9 15L6 21L9.5 19L12 21L14.5 19L18 21L15 15"] },
  briefcase: { label: "Briefcase", category: "business", paths: ["M4 8H20V20H4V8Z", "M9 8V5H15V8", "M4 13H20"] },
  chart: { label: "Chart", category: "business", paths: ["M4 20H20", "M7 20V10", "M12 20V4", "M17 20V13"] },
  coin: { label: "Coin", category: "business", paths: ["M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21Z", "M12 7V17", "M15 9C15 9 14 8 12 8C10 8 9 9 9 10C9 12.5 15 11.5 15 14C15 15 14 16 12 16C10 16 9 15 9 15"] },
  target: { label: "Target", category: "business", paths: ["M12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21Z", "M12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17Z", "M12 13V13.01"] },
  trophy: { label: "Trophy", category: "business", paths: ["M7 4H17V10C17 12.76 14.76 15 12 15C9.24 15 7 12.76 7 10V4Z", "M7 5H4V7C4 9 5.5 10.5 7 10.5", "M17 5H20V7C20 9 18.5 10.5 17 10.5", "M12 15V18", "M8 21H16"] },
  instagram: { label: "Instagram", category: "social", paths: ["M4 4H20V20H4V4Z", "M12 16C14.2 16 16 14.2 16 12C16 9.8 14.2 8 12 8C9.8 8 8 9.8 8 12C8 14.2 9.8 16 12 16Z", "M16.5 7.5V7.51"] },
  facebook: { label: "Facebook", category: "social", paths: ["M14 8H17V4H14C11.8 4 10 5.8 10 8V11H7V15H10V21H14V15H17L18 11H14V8Z"] },
  twitter: { label: "X / Twitter", category: "social", paths: ["M4 4L20 20", "M20 4L4 20"] },
  youtube: { label: "YouTube", category: "social", paths: ["M3 7C3 5.9 3.9 5 5 5H19C20.1 5 21 5.9 21 7V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7Z", "M10 9L15 12L10 15V9Z"] },
  linkedin: { label: "LinkedIn", category: "social", paths: ["M4 4H20V20H4V4Z", "M8 10V16", "M8 7V7.01", "M12 16V10", "M12 12C12 10.9 12.9 10 14 10C15.1 10 16 10.9 16 12V16"] },
  share: { label: "Share", category: "social", paths: ["M8 12C8 13.1 7.1 14 6 14C4.9 14 4 13.1 4 12C4 10.9 4.9 10 6 10C7.1 10 8 10.9 8 12Z", "M20 6C20 7.1 19.1 8 18 8C16.9 8 16 7.1 16 6C16 4.9 16.9 4 18 4C19.1 4 20 4.9 20 6Z", "M20 18C20 19.1 19.1 20 18 20C16.9 20 16 19.1 16 18C16 16.9 16.9 16 18 16C19.1 16 20 16.9 20 18Z", "M8 11L16 7", "M8 13L16 17"] },
  leaf: { label: "Leaf", category: "nature", paths: ["M5 19C5 12 9 5 20 4C20 15 13 19 6 19", "M5 19C7 15 10 12 14 10"] },
  sun: { label: "Sun", category: "nature", paths: ["M12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17Z", "M12 2V4", "M12 20V22", "M2 12H4", "M20 12H22", "M4.9 4.9L6.3 6.3", "M17.7 17.7L19.1 19.1", "M4.9 19.1L6.3 17.7", "M17.7 6.3L19.1 4.9"] },
  cloud: { label: "Cloud", category: "nature", paths: ["M7 18C4.8 18 3 16.2 3 14C3 12 4.5 10.3 6.4 10C7 7.2 9.5 5 12.5 5C15.8 5 18.5 7.7 18.5 11C20.4 11.3 22 12.9 22 14.5C22 16.4 20.4 18 18.5 18H7Z"] },
  settings: { label: "Gear", category: "ui", paths: ["M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z", "M19 12C19 12.3 19 12.6 18.9 12.9L20.7 14.3L18.7 17.7L16.6 16.9C16.1 17.3 15.5 17.6 14.9 17.8L14.6 20H10.4L10.1 17.8C9.5 17.6 8.9 17.3 8.4 16.9L6.3 17.7L4.3 14.3L6.1 12.9C6 12.6 6 12.3 6 12C6 11.7 6 11.4 6.1 11.1L4.3 9.7L6.3 6.3L8.4 7.1C8.9 6.7 9.5 6.4 10.1 6.2L10.4 4H14.6L14.9 6.2C15.5 6.4 16.1 6.7 16.6 7.1L18.7 6.3L20.7 9.7L18.9 11.1C19 11.4 19 11.7 19 12Z"] },
  search: { label: "Search", category: "ui", paths: ["M11 19C15.42 19 19 15.42 19 11C19 6.58 15.42 3 11 3C6.58 3 3 6.58 3 11C3 15.42 6.58 19 11 19Z", "M21 21L17 17"] },
  lock: { label: "Lock", category: "ui", paths: ["M6 11H18V21H6V11Z", "M9 11V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V11"] },
  user: { label: "User", category: "ui", paths: ["M12 12C14.2 12 16 10.2 16 8C16 5.8 14.2 4 12 4C9.8 4 8 5.8 8 8C8 10.2 9.8 12 12 12Z", "M4 21C4 17.7 7.6 15 12 15C16.4 15 20 17.7 20 21"] },
}

export const ICON_CATEGORIES: { id: IconDef["category"]; label: string }[] = [
  { id: "basic", label: "Basic" },
  { id: "arrows", label: "Arrows" },
  { id: "media", label: "Media" },
  { id: "business", label: "Business" },
  { id: "social", label: "Social" },
  { id: "nature", label: "Nature" },
  { id: "ui", label: "Interface" },
]

/** Render an icon to a standalone SVG string (used for canvas rasterization). */
export function iconToSvg(name: string, color: string, size = 96): string | null {
  const def = ICON_LIBRARY[name]
  if (!def) return null
  const body = def.paths.map((d) => `<path d="${d}"/>`).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`
}
