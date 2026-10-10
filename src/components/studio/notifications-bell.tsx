"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { api } from "@/lib/studio/api-client"
import { useAppStore } from "@/lib/studio/app-store"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/components/studio/dashboard/views/admin/admin-shared"
import { AtSign, Bell, CheckCheck, Loader2, Mail, MessageSquare, Share2 } from "lucide-react"

interface NotificationRow {
  id: string
  type: string
  payloadJson: string
  read: boolean
  createdAt: string
}

type NotificationPayload = Record<string, unknown>

function parsePayload(row: NotificationRow): NotificationPayload {
  try {
    const v = JSON.parse(row.payloadJson) as unknown
    return typeof v === "object" && v !== null ? (v as NotificationPayload) : {}
  } catch {
    return {}
  }
}

function payloadStr(payload: NotificationPayload, key: string): string {
  const v = payload[key]
  return typeof v === "string" ? v : ""
}

function typeIcon(type: string) {
  if (type === "comment") return <MessageSquare className="h-4 w-4" aria-hidden="true" />
  if (type === "mention") return <AtSign className="h-4 w-4" aria-hidden="true" />
  if (type === "share") return <Share2 className="h-4 w-4" aria-hidden="true" />
  if (type.startsWith("email.")) return <Mail className="h-4 w-4" aria-hidden="true" />
  return <Bell className="h-4 w-4" aria-hidden="true" />
}

function typeLabelKey(type: string) {
  switch (type) {
    case "comment": return "notif.type.comment" as const
    case "share": return "notif.type.share" as const
    case "mention": return "notif.type.mention" as const
    case "email.queue": return "notif.type.email.queue" as const
    default: return "notif.type.generic" as const
  }
}

/** Body line: server-provided message/title first, then known payload fields, else empty (honest). */
function bodyText(payload: NotificationPayload): string {
  return (
    payloadStr(payload, "message") ||
    payloadStr(payload, "title") ||
    payloadStr(payload, "subject") ||
    [payloadStr(payload, "by") || payloadStr(payload, "body"), payloadStr(payload, "projectName")]
      .filter(Boolean)
      .join(" · ")
  )
}

export function NotificationsBell() {
  const { t } = useI18n()
  const user = useAppStore((s) => s.user)
  const navigate = useAppStore((s) => s.navigate)
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const notif = useQuery({
    queryKey: ["notifications"],
    enabled: !!user,
    queryFn: () => api.get<{ notifications: NotificationRow[]; unread: number }>("/api/notifications"),
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  })

  const markRead = useMutation({
    mutationFn: (body: { ids?: string[]; all?: boolean }) => api.patch<{ updated: number }>("/api/notifications", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (!user) return null

  const rows = notif.data?.notifications ?? []
  const unread = notif.data?.unread ?? 0

  function openNotification(row: NotificationRow) {
    const payload = parsePayload(row)
    if (!row.read) markRead.mutate({ ids: [row.id] })
    if (row.type === "comment" && typeof payload.projectId === "string" && payload.projectId) {
      setOpen(false)
      navigate({ name: "editor", projectId: payload.projectId })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative min-h-[36px]" aria-label={unread > 0 ? `${t("notif.title")} (${unread})` : t("notif.title")}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground" aria-hidden="true">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(20rem,calc(100vw-1.5rem))] p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">{t("notif.title")}</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={unread === 0 || markRead.isPending}
            onClick={() => markRead.mutate({ all: true })}
          >
            {markRead.isPending && markRead.variables?.all ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            {t("notif.markAll")}
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notif.isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="mx-auto mt-2 max-w-56 text-xs text-muted-foreground">{t("notif.empty")}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {rows.map((row) => {
                const payload = parsePayload(row)
                const detail = bodyText(payload)
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60",
                        !row.read && "bg-primary/5",
                      )}
                      onClick={() => openNotification(row)}
                    >
                      <span className="mt-0.5 text-muted-foreground">{typeIcon(row.type)}</span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm", !row.read && "font-semibold")}>
                          {t(typeLabelKey(row.type))}
                        </span>
                        {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-[10px] text-muted-foreground">{timeAgo(row.createdAt)}</span>
                        {!row.read && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
