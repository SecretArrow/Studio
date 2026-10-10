"use client"

import { useRef, useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { api, ApiClientError, downloadBlob } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { Loader2, LogOut, Moon, Sun, Monitor, Globe, KeyRound, Download, Trash2, Upload } from "lucide-react"

export function SettingsView() {
  const user = useAppStore((s) => s.user)
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useAppStore((s) => s.navigate)
  const { t } = useI18n()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name ?? "")
  const [busy, setBusy] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [nextPw, setNextPw] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveProfile() {
    setBusy(true)
    try {
      const res = await api.patch<{ user: typeof user }>("/api/auth/me", { name })
      setUser(res.user)
      toast({ title: "Profile updated" })
    } catch {
      toast({ title: "Update failed", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function changePassword() {
    setBusy(true)
    try {
      await api.post("/api/auth/password", { current: currentPw, next: nextPw })
      setCurrentPw("")
      setNextPw("")
      toast({ title: "Password changed" })
    } catch (err) {
      toast({ title: "Password change failed", description: err instanceof ApiClientError ? err.message : "Network error", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function exportData() {
    try {
      const res = await api.get<Record<string, unknown>>("/api/account/export")
      downloadBlob(new Blob([JSON.stringify(res, null, 2)], { type: "application/json" }), "studio-account-export.json")
      toast({ title: "Account data exported" })
    } catch {
      toast({ title: "Export failed — sign in first", variant: "destructive" })
    }
  }

  async function importProjectsFile(file: File) {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as { projects?: { name: string; type: string; width: number; height: number; contentJson: string }[] }
      const projects = data.projects ?? []
      let imported = 0
      for (const p of projects) {
        try {
          await api.post("/api/projects", { name: `${p.name} (imported)`, doc: JSON.parse(p.contentJson) })
          imported += 1
        } catch { /* skip invalid */ }
      }
      toast({ title: `Imported ${imported} project(s)` })
    } catch {
      toast({ title: "Invalid file", variant: "destructive" })
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-xl font-bold">{t("nav.settings")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your profile, password and data. Guests can still use every editor.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">{t("nav.settings")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>{user.email}{user.role === "admin" ? " · administrator" : ""}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Display name</Label>
            <div className="flex gap-2">
              <Input id="settings-name" value={name} onChange={(e) => setName(e.target.value)} />
              <Button onClick={saveProfile} disabled={busy || !name.trim()}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Appearance</Label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((mode) => (
                <Button key={mode} size="sm" variant={theme === mode ? "secondary" : "outline"} onClick={() => setTheme(mode)}>
                  {mode === "light" ? <Sun className="h-4 w-4" /> : mode === "dark" ? <Moon className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                  {mode[0].toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label><Globe className="mr-1 inline h-4 w-4" />Language</Label>
            <div className="flex gap-2">
              {(["en", "id"] as const).map((loc) => (
                <Button key={loc} size="sm" variant={user.locale === loc ? "secondary" : "outline"} onClick={() => api.patch("/api/auth/me", { locale: loc }).then(() => window.location.reload())}>
                  {loc === "en" ? "English" : "Bahasa Indonesia"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base"><KeyRound className="mr-1 inline h-4 w-4" /> Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cur-pw">Current password</Label>
              <Input id="cur-pw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next-pw">New password (8+)</Label>
              <Input id="next-pw" type="password" value={nextPw} onChange={(e) => setNextPw(e.target.value)} />
            </div>
          </div>
          <Button variant="secondary" onClick={changePassword} disabled={busy || !currentPw || nextPw.length < 8}>Update password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data & privacy</CardTitle>
          <CardDescription>Your projects are private by default. Export or delete everything at any time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportData}><Download className="mr-2 h-4 w-4" /> Export my data (JSON)</Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" /> Import projects (JSON)</Button>
          <input
            ref={fileRef} type="file" accept="application/json" className="hidden"
            onChange={(e) => e.target.files?.[0] && importProjectsFile(e.target.files[0])}
          />
          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm("Delete your account and ALL data permanently? This cannot be undone.")) return
              try {
                await api.delete("/api/account")
                setUser(null)
                navigate({ name: "auth" })
              } catch {
                toast({ title: "Account deletion failed", variant: "destructive" })
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete account
          </Button>
        </CardContent>
      </Card>

      <div>
        <Button variant="ghost" onClick={async () => { await api.post("/api/auth/logout"); setUser(null); navigate({ name: "auth" }) }}>
          <LogOut className="mr-2 h-4 w-4" /> {t("auth.logout")}
        </Button>
      </div>
    </div>
  )
}
