import type { DocType } from "./types"

export interface DocPreset {
  id: string
  label: string
  category: string
  type: DocType
  width: number
  height: number
  icon: string // lucide icon name hint
  description?: string
}

export const DOC_CATEGORIES = [
  { id: "social", label: "Social Media", icon: "Share2" },
  { id: "marketing", label: "Marketing", icon: "Megaphone" },
  { id: "print", label: "Print", icon: "Printer" },
  { id: "presentation", label: "Presentations", icon: "Presentation" },
  { id: "video", label: "Video", icon: "Clapperboard" },
  { id: "photo", label: "Photo", icon: "ImageIcon" },
  { id: "doc", label: "Documents", icon: "FileText" },
  { id: "whiteboard", label: "Whiteboard", icon: "PenTool" },
  { id: "web", label: "Websites", icon: "Globe" },
  { id: "email", label: "Emails", icon: "Mail" },
  { id: "profile", label: "Profile & Banners", icon: "UserRound" },
] as const

export const DOC_PRESETS: DocPreset[] = [
  // Social
  { id: "ig-post", label: "Instagram Post", category: "social", type: "canvas", width: 1080, height: 1080, icon: "Instagram", description: "Square post" },
  { id: "ig-story", label: "Instagram Story", category: "social", type: "canvas", width: 1080, height: 1920, icon: "Smartphone", description: "9:16 story/reels" },
  { id: "ig-portrait", label: "Instagram Portrait", category: "social", type: "canvas", width: 1080, height: 1350, icon: "Instagram", description: "4:5 portrait post" },
  { id: "fb-post", label: "Facebook Post", category: "social", type: "canvas", width: 1200, height: 1200, icon: "Facebook" },
  { id: "fb-cover", label: "Facebook Cover", category: "profile", type: "canvas", width: 1640, height: 924, icon: "Facebook" },
  { id: "x-post", label: "X (Twitter) Post", category: "social", type: "canvas", width: 1600, height: 900, icon: "Twitter" },
  { id: "x-header", label: "X (Twitter) Header", category: "profile", type: "canvas", width: 1500, height: 500, icon: "Twitter" },
  { id: "yt-thumb", label: "YouTube Thumbnail", category: "social", type: "canvas", width: 1280, height: 720, icon: "Youtube", description: "16:9 thumbnail" },
  { id: "yt-banner", label: "YouTube Banner", category: "profile", type: "canvas", width: 2560, height: 1440, icon: "Youtube" },
  { id: "tiktok", label: "TikTok Video", category: "video", type: "video", width: 1080, height: 1920, icon: "Music2" },
  { id: "linkedin-post", label: "LinkedIn Post", category: "social", type: "canvas", width: 1200, height: 1200, icon: "Linkedin" },
  { id: "linkedin-banner", label: "LinkedIn Banner", category: "profile", type: "canvas", width: 1584, height: 396, icon: "Linkedin" },
  { id: "pinterest", label: "Pinterest Pin", category: "social", type: "canvas", width: 1000, height: 1500, icon: "Pin" },
  { id: "carousel", label: "Social Carousel", category: "social", type: "canvas", width: 1080, height: 1080, icon: "GalleryHorizontal", description: "Multi-page carousel" },
  // Marketing
  { id: "poster", label: "Poster", category: "print", type: "canvas", width: 1240, height: 1754, icon: "Image", description: "A4 150dpi" },
  { id: "flyer", label: "Flyer", category: "marketing", type: "canvas", width: 1240, height: 1754, icon: "FileImage" },
  { id: "business-card", label: "Business Card", category: "print", type: "canvas", width: 1050, height: 600, icon: "IdCard", description: "3.5×2 in" },
  { id: "logo", label: "Logo", category: "marketing", type: "canvas", width: 1000, height: 1000, icon: "Hexagon" },
  { id: "product-ad", label: "Product Ad", category: "marketing", type: "canvas", width: 1200, height: 628, icon: "Megaphone" },
  { id: "newsletter", label: "Newsletter Graphic", category: "marketing", type: "canvas", width: 1080, height: 1350, icon: "Newspaper" },
  { id: "certificate", label: "Certificate", category: "print", type: "canvas", width: 1754, height: 1240, icon: "Award", description: "A4 landscape" },
  { id: "menu", label: "Menu / Price List", category: "print", type: "canvas", width: 1240, height: 1754, icon: "UtensilsCrossed" },
  { id: "infographic", label: "Infographic", category: "marketing", type: "canvas", width: 1080, height: 1920, icon: "BarChart3" },
  { id: "calendar", label: "Calendar", category: "print", type: "canvas", width: 1240, height: 1754, icon: "CalendarDays" },
  { id: "resume", label: "Resume / CV", category: "doc", type: "doc", width: 794, height: 1123, icon: "FileUser", description: "A4" },
  { id: "invitation", label: "Invitation", category: "print", type: "canvas", width: 1050, height: 1500, icon: "MailOpen" },
  { id: "sticker", label: "Sticker / Label", category: "print", type: "canvas", width: 600, height: 600, icon: "Sticker" },
  { id: "wallpaper", label: "Phone Wallpaper", category: "profile", type: "canvas", width: 1080, height: 1920, icon: "Wallpaper" },
  // Presentations
  { id: "presentation-16-9", label: "Presentation 16:9", category: "presentation", type: "presentation", width: 1920, height: 1080, icon: "Presentation", description: "Slides & pitch decks" },
  { id: "presentation-4-3", label: "Presentation 4:3", category: "presentation", type: "presentation", width: 1440, height: 1080, icon: "Presentation" },
  { id: "pitch-deck", label: "Pitch Deck", category: "presentation", type: "presentation", width: 1920, height: 1080, icon: "Rocket" },
  // Video
  { id: "video-16-9", label: "Video 16:9", category: "video", type: "video", width: 1920, height: 1080, icon: "Clapperboard" },
  { id: "video-9-16", label: "Short / Reel 9:16", category: "video", type: "video", width: 1080, height: 1920, icon: "Smartphone" },
  { id: "video-1-1", label: "Video Square 1:1", category: "video", type: "video", width: 1080, height: 1080, icon: "Square" },
  // Photo
  { id: "photo-edit", label: "Photo Editor", category: "photo", type: "photo", width: 1080, height: 1080, icon: "Camera", description: "Retouch, crop, filters" },
  { id: "chart", label: "Chart / Data Graphic", category: "marketing", type: "chart", width: 1080, height: 1080, icon: "BarChart3", description: "Editable data-driven chart" },
  { id: "photo-collage", label: "Photo Collage", category: "photo", type: "canvas", width: 1080, height: 1350, icon: "LayoutGrid" },
  // Docs
  { id: "blank-doc", label: "Blank Document", category: "doc", type: "doc", width: 794, height: 1123, icon: "FileText", description: "A4 report / article" },
  { id: "ebook", label: "E-book Page", category: "doc", type: "doc", width: 794, height: 1123, icon: "BookOpen" },
  // Whiteboard
  { id: "whiteboard", label: "Whiteboard", category: "whiteboard", type: "whiteboard", width: 2400, height: 1600, icon: "PenTool", description: "Infinite canvas" },
  { id: "flowchart", label: "Flowchart", category: "whiteboard", type: "whiteboard", width: 2400, height: 1600, icon: "GitBranch" },
  { id: "mindmap", label: "Mind Map", category: "whiteboard", type: "whiteboard", width: 2400, height: 1600, icon: "Brain" },
  // Web
  { id: "website", label: "Website / Landing Page", category: "web", type: "website", width: 1440, height: 900, icon: "Globe" },
  // Email
  { id: "email", label: "Email Campaign", category: "email", type: "email", width: 600, height: 800, icon: "Mail" },
]

export function getPreset(id: string): DocPreset | undefined {
  return DOC_PRESETS.find((p) => p.id === id)
}

export interface TemplateCategory {
  id: string
  label: string
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: "all", label: "All templates" },
  { id: "social", label: "Social Media" },
  { id: "story", label: "Stories & Reels" },
  { id: "youtube", label: "YouTube" },
  { id: "marketing", label: "Marketing" },
  { id: "print", label: "Print" },
  { id: "business", label: "Business" },
  { id: "presentation", label: "Presentations" },
  { id: "resume", label: "Resumes & CVs" },
  { id: "event", label: "Invitations & Cards" },
  { id: "education", label: "Education" },
  { id: "infographic", label: "Infographics" },
  { id: "photo", label: "Photo & Collage" },
  { id: "whiteboard", label: "Whiteboard" },
  { id: "seasonal", label: "Seasonal & Holiday" },
]

export const FONT_LIBRARY = [
  { family: "Inter", label: "Inter (Sans)", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Poppins", label: "Poppins", weights: [400, 500, 600, 700, 800] },
  { family: "Playfair Display", label: "Playfair Display (Serif)", weights: [400, 600, 700, 800] },
  { family: "Bebas Neue", label: "Bebas Neue (Display)", weights: [400] },
  { family: "Oswald", label: "Oswald", weights: [400, 500, 600, 700] },
  { family: "Merriweather", label: "Merriweather (Serif)", weights: [400, 700, 900] },
  { family: "Dancing Script", label: "Dancing Script (Script)", weights: [400, 700] },
  { family: "Caveat", label: "Caveat (Handwriting)", weights: [400, 700] },
  { family: "JetBrains Mono", label: "JetBrains Mono", weights: [400, 700] },
  { family: "Permanent Marker", label: "Permanent Marker", weights: [400] },
]

export const SWATCH_PALETTES: { name: string; colors: string[] }[] = [
  { name: "Violet Studio", colors: ["#8b5cf6", "#a78bfa", "#ede9fe", "#1f2937", "#f9fafb"] },
  { name: "Sunset", colors: ["#f97316", "#fb923c", "#ffedd5", "#7c2d12", "#fff7ed"] },
  { name: "Forest", colors: ["#059669", "#34d399", "#d1fae5", "#064e3b", "#ecfdf5"] },
  { name: "Ocean", colors: ["#0891b2", "#22d3ee", "#cffafe", "#164e63", "#ecfeff"] },
  { name: "Berry", colors: ["#db2777", "#f472b6", "#fce7f3", "#831843", "#fdf2f8"] },
  { name: "Mono", colors: ["#111827", "#4b5563", "#9ca3af", "#e5e7eb", "#ffffff"] },
  { name: "Coffee", colors: ["#78350f", "#b45309", "#fcd34d", "#fef3c7", "#fffbeb"] },
  { name: "Neon", colors: ["#22c55e", "#eab308", "#ec4899", "#06b6d4", "#a855f7"] },
]
