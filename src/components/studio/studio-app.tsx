"use client"

import { useEffect, useRef } from "react"
import { useAppStore, installHashRouter, startView, sidebarOpenFor } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { AuthView } from "@/components/studio/auth-view"
import { Dashboard } from "@/components/studio/dashboard/dashboard"
import { EditorShell } from "@/components/studio/editor-shell"
import { SharedView } from "@/components/studio/shared-view"
import { I18nProvider } from "@/lib/i18n"
import { Loader2 } from "lucide-react"

export function StudioApp() {
  const booted = useAppStore((s) => s.booted)
  const user = useAppStore((s) => s.user)
  const guest = useAppStore((s) => s.guest)
  const view = useAppStore((s) => s.view)
  const setUser = useAppStore((s) => s.setUser)
  const setBooted = useAppStore((s) => s.setBooted)
  const navigate = useAppStore((s) => s.navigate)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    installHashRouter()
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
    const initial = startView()
    useAppStore.setState({ view: initial, sidebarOpen: sidebarOpenFor(initial) })
    api
      .get<{ user: null | { id: string; email: string; name: string | null; role: string; locale: string; avatarUrl: string | null }; workspace?: { id: string; name: string } | null }>("/api/auth/me")
      .then((res) => {
        setUser(res.user, res.workspace ?? null)
        // Guests may browse home/projects/templates/whiteboard demos freely —
        // account-gated views show their own sign-in prompts. Only a failed
        // session check with no view falls back to auth.
        if (!res.user && initial.name === "auth") return
      })
      .catch(() => {
        /* keep current view; guests can still browse */
      })
      .finally(() => setBooted(true))
  }, [navigate, setBooted, setUser])

  if (!booted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Studio is starting…</p>
        </div>
      </div>
    )
  }

  // Editor views are full-screen immersive and skip the dashboard chrome
  if (view.name === "editor") {
    return <EditorShell projectId={view.projectId} share={view.share} />
  }

  if (view.name === "auth" || (!user && !guest)) {
    if (view.name === "shared") return <SharedView token={view.token} />
    return <AuthView />
  }

  return (
    <I18nProvider>
      {view.name === "shared" ? <SharedView token={view.token} /> : <Dashboard />}
    </I18nProvider>
  )
}
