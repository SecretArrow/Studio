"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"

/**
 * Lightweight i18n. English (en) is the default interface language;
 * Indonesian (id) ships built-in. Operators can add locales by extending
 * the `dictionaries` map — every key must exist in en.
 */

const en = {
  "app.name": "Studio",
  "app.tagline": "The free all-in-one visual design platform",
  "nav.home": "Home",
  "nav.projects": "Projects",
  "nav.templates": "Templates",
  "nav.brand": "Brand Kits",
  "nav.bulk": "Bulk Create",
  "nav.trash": "Trash",
  "nav.settings": "Settings",
  "nav.admin": "Admin",
  "nav.newDesign": "New design",
  "auth.welcome": "Welcome to Studio",
  "auth.subtitle": "Design anything. Free forever — no paywalls, no watermarks, no credit systems.",
  "auth.email": "Email",
  "auth.name": "Name",
  "auth.password": "Password",
  "auth.login": "Sign in",
  "auth.register": "Create account",
  "auth.logout": "Sign out",
  "auth.guest": "Continue as guest",
  "auth.forgot": "Forgot password?",
  "auth.noAccount": "New here? Create an account",
  "auth.hasAccount": "Already have an account? Sign in",
  "home.recent": "Recent projects",
  "home.favorites": "Favorites",
  "home.empty": "No projects yet — create your first design",
  "home.templates": "Featured templates",
  "home.startBlank": "Start a new design",
  "projects.search": "Search projects…",
  "projects.sortRecent": "Recently updated",
  "projects.sortName": "Name A–Z",
  "projects.sortCreated": "Newest",
  "projects.localDraft": "Local draft",
  "projects.addToCloud": "Save to cloud",
  "common.open": "Open",
  "common.rename": "Rename",
  "common.duplicate": "Duplicate",
  "common.delete": "Delete",
  "common.restore": "Restore",
  "common.deleteForever": "Delete forever",
  "common.favorite": "Favorite",
  "common.unfavorite": "Remove favorite",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.saved": "All changes saved",
  "common.cancel": "Cancel",
  "common.create": "Create",
  "common.apply": "Apply",
  "common.export": "Export",
  "common.download": "Download",
  "common.close": "Close",
  "common.loading": "Loading…",
  "common.error": "Something went wrong",
  "editor.pages": "Pages",
  "editor.layers": "Layers",
  "editor.templates": "Templates",
  "editor.elements": "Elements",
  "editor.uploads": "Uploads",
  "editor.text": "Text",
  "editor.photos": "Photos",
  "editor.background": "Background",
  "editor.zoomIn": "Zoom in",
  "editor.zoomOut": "Zoom out",
  "editor.fit": "Fit to screen",
  "editor.undo": "Undo",
  "editor.redo": "Redo",
  "editor.present": "Present",
  "editor.notes": "Notes",
  "editor.share": "Share",
  "trash.empty": "Trash is empty",
  "trash.subtitle": "Projects in trash can be restored or deleted forever.",
}

const id: typeof en = {
  "app.name": "Studio",
  "app.tagline": "Platform desain visual all-in-one yang gratis",
  "nav.home": "Beranda",
  "nav.projects": "Proyek",
  "nav.templates": "Templat",
  "nav.brand": "Kit Brand",
  "nav.bulk": "Buat Massal",
  "nav.trash": "Sampah",
  "nav.settings": "Pengaturan",
  "nav.admin": "Admin",
  "nav.newDesign": "Desain baru",
  "auth.welcome": "Selamat datang di Studio",
  "auth.subtitle": "Rancang apa saja. Gratis selamanya — tanpa paywall, tanpa watermark, tanpa sistem kredit.",
  "auth.email": "Email",
  "auth.name": "Nama",
  "auth.password": "Kata sandi",
  "auth.login": "Masuk",
  "auth.register": "Buat akun",
  "auth.logout": "Keluar",
  "auth.guest": "Lanjut sebagai tamu",
  "auth.forgot": "Lupa kata sandi?",
  "auth.noAccount": "Baru di sini? Buat akun",
  "auth.hasAccount": "Sudah punya akun? Masuk",
  "home.recent": "Proyek terbaru",
  "home.favorites": "Favorit",
  "home.empty": "Belum ada proyek — buat desain pertamamu",
  "home.templates": "Templat unggulan",
  "home.startBlank": "Mulai desain baru",
  "projects.search": "Cari proyek…",
  "projects.sortRecent": "Terbaru diperbarui",
  "projects.sortName": "Nama A–Z",
  "projects.sortCreated": "Terbaru",
  "projects.localDraft": "Draf lokal",
  "projects.addToCloud": "Simpan ke cloud",
  "common.open": "Buka",
  "common.rename": "Ganti nama",
  "common.duplicate": "Duplikat",
  "common.delete": "Hapus",
  "common.restore": "Pulihkan",
  "common.deleteForever": "Hapus permanen",
  "common.favorite": "Favorit",
  "common.unfavorite": "Hapus favorit",
  "common.save": "Simpan",
  "common.saving": "Menyimpan…",
  "common.saved": "Semua perubahan tersimpan",
  "common.cancel": "Batal",
  "common.create": "Buat",
  "common.apply": "Terapkan",
  "common.export": "Ekspor",
  "common.download": "Unduh",
  "common.close": "Tutup",
  "common.loading": "Memuat…",
  "common.error": "Terjadi kesalahan",
  "editor.pages": "Halaman",
  "editor.layers": "Lapisan",
  "editor.templates": "Templat",
  "editor.elements": "Elemen",
  "editor.uploads": "Unggahan",
  "editor.text": "Teks",
  "editor.photos": "Foto",
  "editor.background": "Latar",
  "editor.zoomIn": "Perbesar",
  "editor.zoomOut": "Perkecil",
  "editor.fit": "Sesuaikan layar",
  "editor.undo": "Urungkan",
  "editor.redo": "Ulangi",
  "editor.present": "Presentasikan",
  "editor.notes": "Catatan",
  "editor.share": "Bagikan",
  "trash.empty": "Sampah kosong",
  "trash.subtitle": "Proyek di sampah dapat dipulihkan atau dihapus permanen.",
}

export const dictionaries = { en, id }
export type Locale = keyof typeof dictionaries

type I18nContextValue = {
  locale: Locale
  t: (key: keyof typeof en) => string
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({ locale: "en", t: (k) => en[k] ?? String(k), setLocale: () => {} })

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user)
  const storeLocale = useAppStore((s) => s.locale)
  const setStoreLocale = useAppStore((s) => s.setLocale)
  const [localeState, setLocaleState] = useState<Locale>(storeLocale)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("studio:locale") as Locale | null) : null
    const initial = stored ?? (user?.locale === "id" ? "id" : storeLocale)
    const id = setTimeout(() => setLocaleState(initial), 0)
    return () => clearTimeout(id)
  }, [user, storeLocale])

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l)
      localStorage.setItem("studio:locale", l)
      setStoreLocale(l)
      if (user) void fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: l }) })
    },
    [user, setStoreLocale],
  )

  const t = useCallback((key: keyof typeof en) => dictionaries[localeState][key] ?? en[key] ?? String(key), [localeState])

  return <I18nContext.Provider value={{ locale: localeState, t, setLocale }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
