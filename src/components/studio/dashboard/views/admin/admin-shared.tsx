"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/* ---------------- shared row types for the admin panel ---------------- */

export interface AdminStats {
  users: number
  projects: number
  assets: number
  templates: number
  versions: number
  audit: number
}

export interface HealthInfo {
  ok: boolean
  services: { app: string; database: string }
  latencyMs: number
  time: string
}

export interface AuditRow {
  id: string
  action: string
  target: string | null
  createdAt: string
  actor: { name: string | null; email: string } | null
}

export interface AdminUserRow {
  id: string
  email: string
  name: string | null
  role: string
  locale: string
  emailVerifiedAt: string | null
  createdAt: string
  _count: { projects: number; assets: number; comments: number; bulkJobs: number }
}

export interface AdminProjectRow {
  id: string
  name: string
  type: string
  width: number
  height: number
  favorite: boolean
  shareMode: string
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  owner: { email: string; name: string | null }
}

export interface AdminTemplateRow {
  id: string
  slug: string
  name: string
  category: string
  type: string
  tags: string
  width: number
  height: number
  thumbnail: string | null
  featured: boolean
  license: string
}

export interface BulkJobRow {
  id: string
  projectId: string | null
  status: string
  total: number
  done: number
  error: string | null
  createdAt: string
  updatedAt: string
  owner: { email: string; name: string | null }
}

/* ---------------- helpers ---------------- */

/** Toast once per distinct query error (TanStack v5 useQuery has no onError). */
export function useApiErrorToast(error: unknown): void {
  const shown = useRef<unknown>(null)
  useEffect(() => {
    if (!error || shown.current === error) return
    shown.current = error
    toast.error(error instanceof Error ? error.message : "Something went wrong")
  }, [error])
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return formatDate(iso)
}

const JOB_BADGE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-primary/10 text-primary",
  done: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
}

export function JobStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn("capitalize", JOB_BADGE[status] ?? "")}>
      {status}
    </Badge>
  )
}
