"use client"

/**
 * CommentsPanel — threaded project comments (list, reply, resolve, delete).
 * Backend: GET/POST /api/comments, PATCH/DELETE /api/comments/{id}.
 * Viewer role (and signed-out share guests) get read-only UI.
 * @mentions are highlighted visually only (no user resolution).
 */

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, ApiClientError } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { avatarClass, colorFor } from "./use-presence"
import {
  CheckCircle2,
  CornerDownRight,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react"

export type CollabRole = "owner" | "editor" | "commenter" | "viewer"

export interface CommentRow {
  id: string
  projectId: string
  pageId: string | null
  elementId: string | null
  body: string
  parentId: string | null
  resolved: boolean
  createdAt: string
  author: { name: string | null; email: string | null }
}

interface CommentsPanelProps {
  projectId: string
  share?: string
  role: CollabRole
  signedIn: boolean
  currentUserEmail: string | null
  currentUserName: string
}

/** Split text into plain/mention spans (visual only). */
function renderBody(body: string) {
  const parts = body.split(/(@[A-Za-z0-9_.\-]+)/g)
  return parts.map((part, i) =>
    part.startsWith("@") && part.length > 1 ? (
      <span key={i} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: "numeric" }),
  })
}

function AuthorAvatar({ name, email }: { name: string | null; email: string | null }) {
  const label = name || email || "?"
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white",
        avatarClass(colorFor(email || label)),
      )}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}

export function CommentsPanel({ projectId, share, role, signedIn, currentUserEmail, currentUserName }: CommentsPanelProps) {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [draft, setDraft] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState("")

  const shareQs = share ? `?share=${encodeURIComponent(share)}` : ""
  const queryKey = useMemo(() => ["comments", projectId, share ?? null] as const, [projectId, share])

  const commentsQuery = useQuery({
    queryKey,
    queryFn: () => api.get<{ comments: CommentRow[] }>(`/api/comments?projectId=${encodeURIComponent(projectId)}${share ? `&share=${encodeURIComponent(share)}` : ""}`),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey })

  const postComment = useMutation({
    mutationFn: (vars: { body: string; parentId?: string }) =>
      api.post(`/api/comments${shareQs}`, {
        projectId,
        body: vars.body,
        ...(vars.parentId ? { parentId: vars.parentId } : {}),
      }),
    onSuccess: (_data, vars) => {
      if (vars.parentId) {
        setReplyTo(null)
        setReplyDraft("")
      } else {
        setDraft("")
      }
      void invalidate()
    },
    onError: (err) => {
      toast({ title: "Could not post comment", description: err instanceof ApiClientError ? err.message : "Please try again", variant: "destructive" })
    },
  })

  const resolveComment = useMutation({
    mutationFn: (c: CommentRow) => api.patch(`/api/comments/${c.id}${shareQs}`, { resolved: !c.resolved }),
    onSuccess: () => void invalidate(),
    onError: (err) => {
      toast({ title: "Could not update comment", description: err instanceof ApiClientError ? err.message : "Please try again", variant: "destructive" })
    },
  })

  const deleteComment = useMutation({
    mutationFn: (id: string) => api.delete(`/api/comments/${id}${shareQs}`),
    onSuccess: () => void invalidate(),
    onError: (err) => {
      toast({ title: "Could not delete comment", description: err instanceof ApiClientError ? err.message : "Please try again", variant: "destructive" })
    },
  })

  const threads = useMemo(() => {
    const all = commentsQuery.data?.comments ?? []
    const tops = all.filter((c) => !c.parentId)
    const byParent = new Map<string, CommentRow[]>()
    for (const c of all) {
      if (!c.parentId) continue
      const arr = byParent.get(c.parentId) ?? []
      arr.push(c)
      byParent.set(c.parentId, arr)
    }
    return tops.map((root) => ({ root, replies: byParent.get(root.id) ?? [] }))
  }, [commentsQuery.data])

  const canComment = signedIn && role !== "viewer"
  const canModerate = role === "owner" || role === "editor"
  const isAuthor = (c: CommentRow) => !!currentUserEmail && c.author.email === currentUserEmail
  const canResolve = (c: CommentRow) => canModerate || isAuthor(c)
  const canDelete = (c: CommentRow) => role === "owner" || isAuthor(c)
  const busy = postComment.isPending || resolveComment.isPending || deleteComment.isPending

  function submit(parentId?: string) {
    const body = (parentId ? replyDraft : draft).trim()
    if (!body || !canComment) return
    postComment.mutate({ body, ...(parentId ? { parentId } : {}) })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="collab-scroll min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {commentsQuery.isPending && (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {commentsQuery.isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-medium">Could not load comments</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {commentsQuery.error instanceof ApiClientError ? commentsQuery.error.message : "Please try again."}
            </p>
            <Button size="sm" variant="outline" className="mt-2 min-h-[36px]" onClick={() => void commentsQuery.refetch()}>
              Retry
            </Button>
          </div>
        )}

        {!commentsQuery.isPending && !commentsQuery.isError && threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="text-sm font-medium">No comments yet</p>
            <p className="max-w-[240px] text-xs text-muted-foreground">
              {canComment
                ? "Start the conversation — use @ to mention teammates."
                : "People with comment access can leave feedback here."}
            </p>
          </div>
        )}

        {threads.map(({ root, replies }) => (
          <article key={root.id} className={cn("rounded-lg border p-3", root.resolved && "opacity-60")}>
            <div className="flex items-start gap-2">
              <AuthorAvatar name={root.author.name} email={root.author.email} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-xs">
                  <span className="font-semibold">{root.author.name || root.author.email || "Unknown"}</span>
                  <time className="text-muted-foreground" dateTime={root.createdAt}>{formatDate(root.createdAt)}</time>
                  {root.resolved && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" aria-hidden /> Resolved
                    </span>
                  )}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">{renderBody(root.body)}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {canComment && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 min-h-[28px] px-2 text-xs"
                      disabled={busy}
                      onClick={() => {
                        setReplyTo(replyTo === root.id ? null : root.id)
                        setReplyDraft("")
                      }}
                    >
                      <CornerDownRight className="mr-1 h-3 w-3" aria-hidden /> Reply
                    </Button>
                  )}
                  {canResolve(root) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 min-h-[28px] px-2 text-xs"
                      disabled={busy}
                      onClick={() => resolveComment.mutate(root)}
                    >
                      {root.resolved ? (
                        <><RotateCcw className="mr-1 h-3 w-3" aria-hidden /> Reopen</>
                      ) : (
                        <><CheckCircle2 className="mr-1 h-3 w-3" aria-hidden /> Resolve</>
                      )}
                    </Button>
                  )}
                  {canDelete(root) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 min-h-[28px] px-2 text-xs text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => deleteComment.mutate(root.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" aria-hidden /> Delete
                    </Button>
                  )}
                </div>

                {replies.length > 0 && (
                  <div className="mt-2 space-y-2 border-l-2 pl-3">
                    {replies.map((r) => (
                      <div key={r.id} className="flex items-start gap-2">
                        <AuthorAvatar name={r.author.name} email={r.author.email} />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-x-2 text-xs">
                            <span className="font-semibold">{r.author.name || r.author.email || "Unknown"}</span>
                            <time className="text-muted-foreground" dateTime={r.createdAt}>{formatDate(r.createdAt)}</time>
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{renderBody(r.body)}</p>
                          {canDelete(r) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-0.5 h-6 min-h-[24px] px-2 text-xs text-destructive hover:text-destructive"
                              disabled={busy}
                              onClick={() => deleteComment.mutate(r.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" aria-hidden /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {canComment && replyTo === root.id && (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit(root.id)
                      }}
                      placeholder={`Reply to ${root.author.name || "this comment"}… (@ to mention)`}
                      className="min-h-[64px] text-sm"
                      aria-label="Reply"
                      maxLength={2000}
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" className="min-h-[32px]" onClick={() => setReplyTo(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" className="min-h-[32px]" disabled={!replyDraft.trim() || postComment.isPending} onClick={() => submit(root.id)}>
                        {postComment.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="mr-1 h-3.5 w-3.5" aria-hidden />}
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {canComment ? (
        <div className="shrink-0 space-y-2 border-t pt-3">
          {draft.trim() && /@[A-Za-z0-9_.\-]/.test(draft) && (
            <div className="rounded-md border bg-muted/40 px-3 py-2">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Mention preview</p>
              <p className="whitespace-pre-wrap break-words text-sm">{renderBody(draft)}</p>
            </div>
          )}
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit()
            }}
            placeholder={`Comment as ${currentUserName}… (@ to mention)`}
            className="min-h-[72px] text-sm"
            aria-label="Add a comment"
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{draft.length}/2000 · Ctrl+Enter to post</p>
            <Button size="sm" className="min-h-[36px]" disabled={!draft.trim() || postComment.isPending} onClick={() => submit()}>
              {postComment.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden /> : <Send className="mr-1 h-4 w-4" aria-hidden />}
              Comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="shrink-0 border-t pt-3 text-xs text-muted-foreground">
          {signedIn
            ? "Viewers have read-only access to comments."
            : "Sign in to join the conversation."}
        </p>
      )}
    </div>
  )
}
