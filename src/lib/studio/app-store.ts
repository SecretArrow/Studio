"use client"

import { create } from "zustand"

export type AppView =
  | { name: "auth" }
  | { name: "home" }
  | { name: "projects"; folderId?: string }
  | { name: "templates" }
  | { name: "templates-detail"; templateId: string }
  | { name: "brand" }
  | { name: "bulk" }
  | { name: "trash" }
  | { name: "settings" }
  | { name: "admin" }
  | { name: "editor"; projectId: string; type?: string; share?: string }
  | { name: "shared"; token: string }

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: string
  locale: string
  avatarUrl: string | null
}

interface AppState {
  view: AppView
  user: SessionUser | null
  workspace: { id: string; name: string } | null
  booted: boolean
  locale: "en" | "id"
  sidebarOpen: boolean
  /** true when browsing without an account (local drafts only) */
  guest: boolean
  setGuest: (v: boolean) => void
  navigate: (view: AppView) => void
  setUser: (user: SessionUser | null, workspace?: { id: string; name: string } | null) => void
  setBooted: (v: boolean) => void
  setLocale: (l: "en" | "id") => void
  toggleSidebar: () => void
}

function viewFromHash(): AppView {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#\/?/, "") : ""
  const [path, query] = hash.split("?")
  const parts = path.split("/").filter(Boolean)
  const params = new URLSearchParams(query || "")
  if (parts[0] === "editor" && parts[1]) return { name: "editor", projectId: parts[1], share: params.get("share") || undefined }
  if (parts[0] === "templates" && parts[1]) return { name: "templates-detail", templateId: parts[1] }
  if (parts[0] === "templates") return { name: "templates" }
  if (parts[0] === "projects") return { name: "projects", folderId: parts[1] || undefined }
  if (parts[0] === "brand") return { name: "brand" }
  if (parts[0] === "bulk") return { name: "bulk" }
  if (parts[0] === "trash") return { name: "trash" }
  if (parts[0] === "settings") return { name: "settings" }
  if (parts[0] === "admin") return { name: "admin" }
  if (parts[0] === "shared" && params.get("t")) return { name: "shared", token: params.get("t")! }
  if (parts[0] === "home") return { name: "home" }
  if (parts[0] === "auth") return { name: "auth" }
  return { name: "home" }
}

function hashFromView(view: AppView): string {
  switch (view.name) {
    case "auth": return "#/auth"
    case "home": return "#/home"
    case "projects": return `#/projects${view.folderId ? `/${view.folderId}` : ""}`
    case "templates": return "#/templates"
    case "templates-detail": return `#/templates/${view.templateId}`
    case "brand": return "#/brand"
    case "bulk": return "#/bulk"
    case "trash": return "#/trash"
    case "settings": return "#/settings"
    case "admin": return "#/admin"
    case "editor": return `#/editor/${view.projectId}${view.share ? `?share=${view.share}` : ""}`
    case "shared": return `#/shared?t=${view.token}`
  }
}

export const useAppStore = create<AppState>((set) => ({
  view: { name: "home" },
  user: null,
  workspace: null,
  booted: false,
  locale: "en",
  sidebarOpen: true,
  guest: false,
  setGuest: (v) => set({ guest: v }),
  navigate: (view) => {
    const hash = hashFromView(view)
    if (typeof window !== "undefined" && window.location.hash !== hash) {
      window.location.hash = hash
    }
    set({ view, sidebarOpen: view.name === "home" || view.name === "projects" ? true : false })
  },
  setUser: (user, workspace) => set({ user, workspace: workspace ?? null }),
  setBooted: (v) => set({ booted: v }),
  setLocale: (l) => set({ locale: l }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

/** Subscribe to hash changes to keep the SPA router in sync (single-route app). */
export function installHashRouter() {
  if (typeof window === "undefined") return () => {}
  const onHash = () => {
    useAppStore.setState({ view: viewFromHash() })
  }
  window.addEventListener("hashchange", onHash)
  return () => window.removeEventListener("hashchange", onHash)
}

export function startView(): AppView {
  return viewFromHash()
}
