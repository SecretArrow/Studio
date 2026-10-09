"use client"

import { useQuery } from "@tanstack/react-query"
import { useAppStore } from "@/lib/studio/app-store"
import { api } from "@/lib/studio/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Users, FolderKanban, HardDrive, ScrollText, Loader2 } from "lucide-react"

interface AdminStats {
  users: number
  projects: number
  assets: number
  templates: number
  versions: number
  audit: number
}

interface AuditRow { id: string; action: string; target: string | null; createdAt: string; actor: { name: string | null; email: string } | null }

export function AdminView() {
  const user = useAppStore((s) => s.user)
  const stats = useQuery({ queryKey: ["admin", "stats"], enabled: user?.role === "admin", queryFn: () => api.get<AdminStats>("/api/admin/stats") })
  const audit = useQuery({ queryKey: ["admin", "audit"], enabled: user?.role === "admin", queryFn: () => api.get<{ rows: AuditRow[] }>("/api/admin/audit") })

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-xl font-bold">Administrators only</h1>
        <p className="mt-1 text-sm text-muted-foreground">This area is protected by server-side role checks.</p>
      </div>
    )
  }

  const cards = [
    { label: "Users", value: stats.data?.users, icon: Users },
    { label: "Projects", value: stats.data?.projects, icon: FolderKanban },
    { label: "Assets", value: stats.data?.assets, icon: HardDrive },
    { label: "Templates", value: stats.data?.templates, icon: ScrollText },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <h1 className="text-xl font-bold">Administration</h1>
      <p className="mt-1 text-sm text-muted-foreground">System health, usage and audit trail. All checks happen server-side.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-1"><c.icon className="h-4 w-4 text-primary" /></CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value ?? <Loader2 className="h-4 w-4 animate-spin" />}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-base">Recent audit events</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Time</th><th className="pb-2">Action</th><th className="pb-2">Actor</th><th className="pb-2">Target</th>
                </tr>
              </thead>
              <tbody>
                {(audit.data?.rows ?? []).map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-1.5 pr-2 text-xs">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="py-1.5 pr-2 font-medium">{row.action}</td>
                    <td className="py-1.5 pr-2 text-xs">{row.actor?.email ?? "—"}</td>
                    <td className="py-1.5 text-xs">{row.target ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(audit.data?.rows ?? []).length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No audit events yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
