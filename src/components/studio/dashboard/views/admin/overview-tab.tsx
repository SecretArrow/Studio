"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/studio/api-client"
import { useI18n } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FolderKanban, HardDrive, ScrollText, ShieldCheck, Users, FileStack, Activity } from "lucide-react"
import { type AdminStats, type HealthInfo, useApiErrorToast } from "./admin-shared"

export function OverviewTab() {
  const { t } = useI18n()
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<AdminStats>("/api/admin/stats"),
    refetchOnWindowFocus: false,
  })
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthInfo>("/api/health"),
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  })
  useApiErrorToast(stats.error)
  useApiErrorToast(health.error)

  const cards = [
    { label: t("admin.stat.users"), value: stats.data?.users, icon: Users },
    { label: t("admin.stat.projects"), value: stats.data?.projects, icon: FolderKanban },
    { label: t("admin.stat.assets"), value: stats.data?.assets, icon: HardDrive },
    { label: t("admin.stat.templates"), value: stats.data?.templates, icon: ScrollText },
    { label: t("admin.stat.versions"), value: stats.data?.versions, icon: FileStack },
    { label: t("admin.stat.audit"), value: stats.data?.audit, icon: ShieldCheck },
  ]

  const dbUp = health.data?.services.database === "up"
  const appUp = health.data?.services.app === "up"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-1">
              <c.icon className="h-4 w-4 text-primary" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{c.value ?? <Skeleton className="h-7 w-10" />}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("admin.health.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HealthRow label={t("admin.health.app")} up={appUp} detail={health.data?.services.app} loading={health.isLoading} />
          <HealthRow label={t("admin.health.database")} up={dbUp} detail={health.data?.services.database} loading={health.isLoading} />
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("admin.health.latency")}</p>
            <p className="mt-1 text-sm font-semibold">
              {health.data ? `${health.data.latencyMs} ms` : <Skeleton className="inline-block h-4 w-12 align-middle" />}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function HealthRow({ label, up, detail, loading }: { label: string; up: boolean | undefined; detail?: string; loading: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1">
        {loading ? (
          <Skeleton className="inline-block h-5 w-16 align-middle" />
        ) : (
          <Badge className={up ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}>
            {up ? detail ?? "up" : detail ?? "down"}
          </Badge>
        )}
      </p>
    </div>
  )
}
