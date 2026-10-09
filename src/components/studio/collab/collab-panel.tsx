"use client"

/**
 * CollabPanel — the content of the editor's "Collaborate" side sheet.
 * Tabs: Comments | Versions | Presence. Presence state comes from the
 * usePresence hook owned by the editor shell (one socket per editor).
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { avatarClass } from "./use-presence"
import type { PresenceMember, PresenceStatus } from "./use-presence"
import { CommentsPanel, type CollabRole } from "./comments-panel"
import { VersionsPanel } from "./versions-panel"
import { MessageSquare, History, Users, Loader2, Wifi, WifiOff } from "lucide-react"

interface CollabPanelProps {
  projectId: string
  share?: string
  role: CollabRole
  members: PresenceMember[]
  status: PresenceStatus
  selfName: string
  selfColor: string
  signedIn: boolean
  currentUserEmail: string | null
}

function StatusLine({ status, count }: { status: PresenceStatus; count: number }) {
  if (status === "live") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        Live — {count} {count === 1 ? "person" : "people"}
      </p>
    )
  }
  if (status === "connecting") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Connecting…
      </p>
    )
  }
  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <WifiOff className="h-4 w-4" aria-hidden /> Offline mode
    </p>
  )
}

export function CollabPanel({ projectId, share, role, members, status, selfName, selfColor, signedIn, currentUserEmail }: CollabPanelProps) {
  const totalPeople = members.length + 1

  return (
    <Tabs defaultValue="comments" className="flex min-h-0 flex-1 flex-col gap-0">
      <TabsList className="mx-4 mt-2 grid w-auto grid-cols-3">
        <TabsTrigger value="comments" className="min-h-[36px] gap-1.5 text-xs sm:text-sm">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden /> Comments
        </TabsTrigger>
        <TabsTrigger value="versions" className="min-h-[36px] gap-1.5 text-xs sm:text-sm">
          <History className="h-3.5 w-3.5" aria-hidden /> Versions
        </TabsTrigger>
        <TabsTrigger value="presence" className="min-h-[36px] gap-1.5 text-xs sm:text-sm">
          <Users className="h-3.5 w-3.5" aria-hidden /> Presence
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="mt-3 flex min-h-0 flex-1 flex-col px-4 pb-4">
        <CommentsPanel
          projectId={projectId}
          share={share}
          role={role}
          signedIn={signedIn}
          currentUserEmail={currentUserEmail}
          currentUserName={selfName}
        />
      </TabsContent>

      <TabsContent value="versions" className="mt-3 flex min-h-0 flex-1 flex-col px-4 pb-4">
        <VersionsPanel projectId={projectId} role={role} />
      </TabsContent>

      <TabsContent value="presence" className="mt-3 flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4">
        <div className="shrink-0 space-y-1">
          <StatusLine status={status} count={totalPeople} />
          <p className="text-xs text-muted-foreground">
            {status === "live"
              ? "Everyone with this project open appears below. You can collaborate in real time."
              : status === "connecting"
                ? "Establishing the live connection…"
                : "Live presence is unavailable right now — editing, comments and versions still work."}
          </p>
        </div>

        <div className="collab-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {/* Self row */}
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
            <span
              aria-hidden
              className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", avatarClass(selfColor))}
            >
              {selfName.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{selfName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role}</p>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">You</span>
          </div>

          {/* Other members */}
          {members.map((m) => (
            <div key={m.key} className="flex items-center gap-3 rounded-lg border p-2.5">
              <span
                aria-hidden
                className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white", avatarClass(m.color))}
              >
                {m.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className={cn("text-xs", m.editing ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                  {m.editing ? "Editing…" : "Viewing"}
                </p>
              </div>
              {m.editing && (
                <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <Wifi className="h-3 w-3" aria-hidden /> live
                </span>
              )}
            </div>
          ))}

          {status === "live" && members.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" aria-hidden />
              <p className="text-sm font-medium">You are the only one here</p>
              <p className="max-w-[260px] text-xs text-muted-foreground">
                Use the Share button to invite people — when they open this project they will appear here instantly.
              </p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
