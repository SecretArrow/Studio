"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"
import { api, ApiClientError } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Sparkles, ShieldCheck, Palette, Video, Presentation, Globe } from "lucide-react"

interface AuthResponse {
  user: { id: string; email: string; name: string | null; role: string; locale: string; avatarUrl: string | null }
  workspaceId?: string
  verifyHint?: string
}

export function AuthView() {
  const navigate = useAppStore((s) => s.navigate)
  const setUser = useAppStore((s) => s.setUser)
  const { toast } = useToast()
  const [busy, setBusy] = useState(false)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOpen, setForgotOpen] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)

  function afterAuth(res: AuthResponse) {
    setUser(res.user, { id: res.workspaceId ?? "", name: "My Workspace" })
    navigate({ name: "home" })
    if (res.verifyHint) {
      setVerifyToken(res.verifyHint)
      toast({
        title: "Verify your email",
        description: "SMTP is not configured on this server, so here is your verification token (dev mode):",
      })
    }
  }

  async function doLogin(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<AuthResponse>("/api/auth/login", { email: loginEmail, password: loginPassword })
      afterAuth(res)
    } catch (err) {
      toast({ title: "Sign in failed", description: err instanceof ApiClientError ? err.message : "Network error", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<AuthResponse>("/api/auth/register", { name: regName, email: regEmail, password: regPassword })
      afterAuth(res)
    } catch (err) {
      toast({ title: "Registration failed", description: err instanceof ApiClientError ? err.message : "Network error", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function doForgot(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await api.post<{ ok: boolean; token?: string; delivered?: string }>("/api/auth/forgot", { email: forgotEmail })
      if (res.token) {
        toast({ title: "Reset token (SMTP not configured)", description: `Use this token on the reset form: ${res.token}` })
      } else {
        toast({ title: "Check your inbox", description: "If the address exists, a reset link has been queued." })
      }
    } catch (err) {
      toast({ title: "Request failed", description: err instanceof ApiClientError ? err.message : "Network error", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function verifyNow(token: string) {
    try {
      await api.post("/api/auth/verify", { token })
      toast({ title: "Email verified" })
      setVerifyToken(null)
    } catch (err) {
      toast({ title: "Verification failed", description: err instanceof ApiClientError ? err.message : "Network error", variant: "destructive" })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 md:grid-cols-2">
        {/* Marketing side */}
        <div className="hidden flex-col gap-6 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
              <p className="text-sm text-muted-foreground">Free all-in-one visual design platform</p>
            </div>
          </div>
          <p className="max-w-md text-lg text-muted-foreground">
            Graphics, photo editing, video, presentations, documents, whiteboards, charts, websites and collaboration —
            one workspace, completely free. No paywalls, no watermarks, no credit systems.
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg border p-3"><Palette className="h-4 w-4 text-primary" /> Canvas & photo editor</div>
            <div className="flex items-center gap-2 rounded-lg border p-3"><Presentation className="h-4 w-4 text-primary" /> Presentations & docs</div>
            <div className="flex items-center gap-2 rounded-lg border p-3"><Video className="h-4 w-4 text-primary" /> Video & motion</div>
            <div className="flex items-center gap-2 rounded-lg border p-3"><Globe className="h-4 w-4 text-primary" /> Websites & emails</div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Open source, self-hostable, your data stays yours.
          </div>
        </div>

        {/* Auth card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Studio</CardTitle>
            <CardDescription>Sign in to sync your projects across devices — or start as a guest.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="register">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={doLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={doRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Name</Label>
                    <Input id="reg-name" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input id="reg-email" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" required minLength={8} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="At least 8 characters" />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Separator className="my-5" />

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setUser(null, null)
                  useAppStore.getState().setGuest(true)
                  navigate({ name: "home" })
                }}
              >
                Continue as guest
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Guest projects are stored locally in your browser (IndexedDB). Sign in later to sync them to the cloud.
              </p>
              <div className="flex items-center justify-between text-xs">
                <button className="text-muted-foreground underline-offset-2 hover:underline" onClick={() => setForgotOpen((v) => !v)}>
                  Forgot password?
                </button>
                <button
                  className="text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => {
                    setLoginEmail("demo@studio.local")
                    setLoginPassword("demo1234")
                  }}
                >
                  Use demo account
                </button>
              </div>
            </div>

            {forgotOpen && (
              <form onSubmit={doForgot} className="mt-4 space-y-3 rounded-lg border p-4">
                <Label htmlFor="forgot-email">Account email</Label>
                <Input id="forgot-email" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" />
                <Button type="submit" variant="secondary" className="w-full" disabled={busy}>
                  Send reset token
                </Button>
                <p className="text-xs text-muted-foreground">
                  Without SMTP configured, the reset token is shown here instead of emailed — no fake "email sent" claims.
                </p>
              </form>
            )}

            {verifyToken && (
              <div className="mt-4 space-y-2 rounded-lg border border-dashed p-4">
                <p className="text-xs font-medium">Email verification token (dev mode)</p>
                <code className="block break-all rounded bg-muted p-2 text-xs">{verifyToken}</code>
                <Button size="sm" variant="secondary" onClick={() => verifyNow(verifyToken)}>Verify now</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
        Studio — free and open source. Self-host it, remix it, ship it.
      </footer>
    </div>
  )
}
