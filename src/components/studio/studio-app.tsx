"use client"

import { useEffect, useRef } from "react"
import { useAppStore, installHashRouter, startView } from "@/lib/studio/app-store"
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
  const view = useAppStore((s) => s.view)
  const setUser = useAppStore((s) => s.setUser)
  const setBooted = useAppStore((s) => s.setBooted)
  const navigate = useAppStore((s) => s.navigate)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    installHashRouter()
    const initial = startView()
    useAppStore.setState({ view: initial })
    api
      .get<{ user: null | { id: string; email: string; name: string | null; role: string; locale: string; avatarUrl: string | null }; workspace?: { id: string; name: string } | null }>("/api/auth/me")
      .then((res) => {
        setUser(res.user, res.workspace ?? null)
        // guests opening an editor/shared link keep their view; everyone else lands home
        if (!res.user && (initial.name === "home" || initial.name === "projects" || initial.name === "templates")) {
          navigate({ name: "auth" })
        }
      })
      .catch(() => navigate({ name: "auth" }))
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

  if (!user || view.name === "auth") {
    if (!user && view.name === "shared") return <SharedView token={view.token} />
    return <AuthView />
  }

  return (
    <I18nProvider>
      {view.name === "shared" ? <SharedView token={view.token} /> : <Dashboard />}
    </I18nProvider>
  )
}
