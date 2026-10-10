"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"
import { api, ApiClientError, downloadBlob } from "@/lib/studio/api-client"
import { localGetProject, localSaveProject, saveProjectThumb } from "@/lib/studio/local-store"
import type { DesignDoc } from "@/lib/design/types"
import { getEditor, EditorSuspense } from "@/components/studio/editors/registry"
import { Suspense } from "react"
import type { EditorHandle, EditorProps, ExportRequest } from "@/components/studio/editors/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { usePresence, avatarClass } from "@/components/studio/collab/use-presence"
import { CollabPanel } from "@/components/studio/collab/collab-panel"
import { ArrowLeft, Download, Share2, Check, Loader2, Presentation, Cloud, CloudOff, Users } from "lucide-react"

interface LoadedState {
  meta: { id: string; name: string; type: string; width: number; height: number }
  doc: DesignDoc
  role: "owner" | "editor" | "commenter" | "viewer"
  cloud: boolean
  updatedAt?: string
}

export function EditorShell({ projectId, share }: { projectId: string; share?: string }) {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  const { toast } = useToast()
  const [loaded, setLoaded] = useState<LoadedState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">("saved")
  const [name, setName] = useState("")
  const [shareOpen, setShareOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const docRef = useRef<DesignDoc | null>(null)
  const handleRef = useRef<EditorHandle | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const baseUpdatedAt = useRef<string | undefined>(undefined)
  const dirtyRef = useRef(false)

  /* ---------------- load ---------------- */
  useEffect(() => {
    let alive = true
    const localId = sessionStorage.getItem("studio:open-local")
    async function boot() {
      try {
        if (projectId.startsWith("local_") || (localId === projectId && !share)) {
          const local = await localGetProject(projectId)
          if (!local) throw new Error("Draft not found in this browser")
          if (!alive) return
          setLoaded({
            meta: { id: local.id, name: local.name, type: local.type, width: local.width, height: local.height },
            doc: local.doc,
            role: "owner",
            cloud: false,
          })
          setName(local.name)
          return
        }
        const res = await api.get<{
          project: { id: string; name: string; type: string; width: number; height: number; contentJson: string; updatedAt: string }
          role: LoadedState["role"]
        }>(`/api/projects/${projectId}${share ? `?share=${share}` : ""}`)
        if (!alive) return
        const doc = JSON.parse(res.project.contentJson) as DesignDoc
        baseUpdatedAt.current = res.project.updatedAt
        setLoaded({
          meta: { id: res.project.id, name: res.project.name, type: res.project.type, width: res.project.width, height: res.project.height },
          doc,
          role: res.role,
          cloud: true,
          updatedAt: res.project.updatedAt,
        })
        setName(res.project.name)
      } catch (err) {
        if (!alive) return
        setError(err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : "Failed to open project")
      }
    }
    void boot()
    return () => {
      alive = false
    }
  }, [projectId, share])

  /* ---------------- collaboration presence ---------------- */
  const [collabOpen, setCollabOpen] = useState(false)

  const handleRemoteDocUpdate = useCallback(
    (info: { updatedAt: string; userName: string }) => {
      toast({
        title: `Project updated by ${info.userName}`,
        description: "A collaborator saved new changes. Reload to see the latest version.",
        action: (
          <ToastAction altText="Reload editor" onClick={() => window.location.reload()}>
            Reload
          </ToastAction>
        ),
      })
    },
    [toast],
  )

  const {
    status: presenceStatus,
    members: collabMembers,
    selfColor,
    notifyEditing,
    sendDocUpdate,
  } = usePresence({
    projectId: loaded?.cloud ? projectId : null,
    displayName: user?.name || user?.email || "Guest",
    userId: user?.id ?? null,
    enabled: !!loaded?.cloud,
    onRemoteDocUpdate: handleRemoteDocUpdate,
  })

  const selfName = user?.name || user?.email || "Guest"

  /* ---------------- autosave ---------------- */
  const persistCloud = useCallback(
    async (doc: DesignDoc, thumbnail: string | null) => {
      setSaveState("saving")
      try {
        const res = await fetch(`/api/projects/${projectId}${share ? `?share=${share}` : ""}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json", "X-Requested-With": "studio" },
          body: JSON.stringify({
            contentJson: JSON.stringify(doc),
            ...(thumbnail ? { thumbnail } : {}),
            baseUpdatedAt: baseUpdatedAt.current,
          }),
        })
        if (res.status === 409) {
          toast({
            title: "Project changed elsewhere",
            description: "Another edit was saved after you opened this project. Your view will reload with the latest content.",
          })
          const body = (await res.json()) as { serverUpdatedAt?: string }
          if (body.serverUpdatedAt) baseUpdatedAt.current = body.serverUpdatedAt
          const fresh = await api.get<{ project: { contentJson: string; updatedAt: string } }>(`/api/projects/${projectId}${share ? `?share=${share}` : ""}`)
          const freshDoc = JSON.parse(fresh.project.contentJson) as DesignDoc
          docRef.current = freshDoc
          baseUpdatedAt.current = fresh.project.updatedAt
          setLoaded((prev) => (prev ? { ...prev, doc: freshDoc } : prev))
          setSaveState("saved")
          return
        }
        if (!res.ok) throw new Error("Save failed")
        const body = (await res.json()) as { project: { updatedAt: string } }
        baseUpdatedAt.current = body.project.updatedAt
        setSaveState("saved")
        dirtyRef.current = false
        // Live-follow: tell the room a new revision was saved (receivers toast + reload).
        sendDocUpdate(JSON.stringify(doc), body.project.updatedAt)
        // Best-effort local thumbnail capture for dashboard cards — at most one
        // capture per save, and never allowed to break the save flow above.
        try {
          const localThumb = thumbnail ?? ((await handleRef.current?.getThumbnail()) ?? null)
          if (localThumb) await saveProjectThumb(projectId, localThumb)
        } catch {
          /* thumbnail capture is optional */
        }
      } catch {
        setSaveState("dirty")
        toast({ title: "Offline — changes kept locally", description: "We will keep trying to save your work." })
      }
    },
    [projectId, share, toast, sendDocUpdate],
  )

  const performSave = useCallback(async () => {
    const doc = docRef.current
    if (!doc) return
    if (loaded?.cloud) {
      const thumb = (await handleRef.current?.getThumbnail()) ?? null
      await persistCloud(doc, thumb)
    } else {
      const local = await localGetProject(projectId)
      if (local) {
        await localSaveProject({ ...local, doc, updatedAt: Date.now() })
        let thumb: string | null = null
        try {
          thumb = (await handleRef.current?.getThumbnail()) ?? null
        } catch {
          thumb = null
        }
        if (thumb) {
          await localSaveProject({ ...local, doc, thumbnail: thumb, updatedAt: Date.now() })
          try {
            await saveProjectThumb(projectId, thumb)
          } catch {
            /* thumbnail storage is optional */
          }
        }
      }
      setSaveState("saved")
      dirtyRef.current = false
    }
  }, [loaded?.cloud, persistCloud, projectId])

  const scheduleSave = useCallback(() => {
    dirtyRef.current = true
    setSaveState("dirty")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null
      void performSave()
    }, 1400)
  }, [performSave])

  // Unmount with a pending autosave: flush immediately instead of leaving the
  // debounce to fire later, so the last edits are persisted and the timer's
  // closure is released right away (setStates after unmount are no-ops).
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current)
        saveTimer.current = null
        void performSave()
      }
    }
  }, [performSave])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        if (saveTimer.current) clearTimeout(saveTimer.current)
        const doc = docRef.current
        if (!doc) return
        if (loaded?.cloud) void persistCloud(doc, null)
        else scheduleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault()
        void doExport({ format: "png" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [loaded?.cloud, persistCloud, scheduleSave])

  // warn before leaving with unsaved changes
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  /* ---------------- editor callbacks ---------------- */
  const onDocChange = useCallback(
    (doc: DesignDoc) => {
      docRef.current = doc
      notifyEditing()
      scheduleSave()
    },
    [scheduleSave, notifyEditing],
  )

  const registerHandle = useCallback((h: EditorHandle | null) => {
    handleRef.current = h
  }, [])

  async function doExport(req: ExportRequest) {
    const handle = handleRef.current
    if (!handle) return
    setExporting(true)
    try {
      const results = await handle.export({ ...req, filenameBase: name })
      for (const r of results) downloadBlob(r.blob, r.filename)
      if (results.length === 0) {
        toast({ title: "Nothing to export", description: "The document appears to be empty." })
      } else if (results[0]?.note) {
        toast({ title: "Exported", description: results[0].note })
      }
    } catch (err) {
      toast({ title: "Export failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  async function renameProject() {
    if (!name.trim() || !loaded?.cloud) return
    try {
      await api.patch(`/api/projects/${projectId}`, { name: name.trim() })
    } catch { /* ignore */ }
  }

  async function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#/editor/${projectId}`
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Link copied", description: "Anyone with this link and the right permission can open the project." })
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" })
    }
  }

  const editorKind = loaded?.meta.type ?? "canvas"
  const EditorComponent = useMemo(() => getEditor(editorKind), [editorKind])

  if (error) {
    return (
      <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg font-semibold">{error}</p>
        <Button onClick={() => navigate({ name: "home" })}><ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard</Button>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const canEdit = loaded.role === "owner" || loaded.role === "editor"

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Editor top bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-2 pt-[env(safe-area-inset-top)] md:px-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ name: "home" })} aria-label="Back to dashboard" className="min-h-[36px] min-w-[36px]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={renameProject}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="h-8 w-40 border-transparent bg-transparent font-semibold hover:border-border md:w-64"
          aria-label="Project name"
        />
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
          {saveState === "saved" ? (
            <><Check className="h-3.5 w-3.5 text-emerald-500" /> {loaded.cloud ? "Saved" : "Saved locally"}</>
          ) : saveState === "saving" ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
          ) : (
            <><CloudOff className="h-3.5 w-3.5 text-amber-500" /> Unsaved</>
          )}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {loaded.cloud && (
            <>
              {presenceStatus === "live" && collabMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCollabOpen(true)}
                  className="hidden h-8 items-center pr-1 sm:flex"
                  aria-label={`${collabMembers.length} collaborator${collabMembers.length === 1 ? "" : "s"} online — open the collaborate panel`}
                >
                  {collabMembers.slice(0, 3).map((m) => (
                    <span
                      key={m.key}
                      className={cn(
                        "-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white first:ml-0",
                        avatarClass(m.color),
                      )}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {collabMembers.length > 3 && (
                    <span className="-ml-1.5 flex h-6 items-center rounded-full border-2 border-background bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
                      +{collabMembers.length - 3}
                    </span>
                  )}
                </button>
              )}
              <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => setCollabOpen(true)}>
                <Users className="h-4 w-4" /> <span className="hidden md:inline">Collaborate</span>
              </Button>
            </>
          )}
          {editorKind === "presentation" && canEdit && (
            <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => handleRef.current?.present?.()}>
              <Presentation className="h-4 w-4" /> <span className="hidden md:inline">Present</span>
            </Button>
          )}
          {loaded.cloud && canEdit && (
            <Button variant="ghost" size="sm" className="min-h-[36px]" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" /> <span className="hidden md:inline">Share</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="min-h-[36px]" disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Download as</DropdownMenuLabel>
              {editorKind === "video" ? (
                <>
                  <DropdownMenuItem onClick={() => doExport({ format: "webm" })}>WebM video</DropdownMenuItem>
                  {typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.("video/mp4") && (
                    <DropdownMenuItem onClick={() => doExport({ format: "mp4" })}>MP4 video (browser-supported)</DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => doExport({ format: "json" })}>Project file (.json)</DropdownMenuItem>
                </>
              ) : editorKind === "website" ? (
                <>
                  <DropdownMenuItem onClick={() => doExport({ format: "html" })}>Static site (.html + assets)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "json" })}>Project file (.json)</DropdownMenuItem>
                </>
              ) : editorKind === "email" ? (
                <>
                  <DropdownMenuItem onClick={() => doExport({ format: "html" })}>Email HTML</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "json" })}>Project file (.json)</DropdownMenuItem>
                </>
              ) : editorKind === "doc" ? (
                <>
                  <DropdownMenuItem onClick={() => doExport({ format: "pdf" })}>PDF document</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "html" })}>Word-compatible HTML</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "json" })}>Project file (.json)</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => doExport({ format: "png" })}>PNG image</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "png", scale: 2 })}>PNG @2x</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "jpeg", quality: 0.92 })}>JPEG image</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "webp" })}>WebP image</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "png", transparent: true, pages: [0] })}>PNG (transparent)</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => doExport({ format: "pdf" })}>PDF</DropdownMenuItem>
                  {editorKind === "canvas" && <DropdownMenuItem onClick={() => doExport({ format: "svg" })}>SVG (vector elements)</DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => doExport({ format: "zip" })}>All pages (.zip)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => doExport({ format: "json" })}>Project file (.json)</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Editor surface */}
      <div className="min-h-0 flex-1">
        <Suspense fallback={<EditorSuspense />}>
          <EditorComponent
            {...({
              project: loaded.meta,
              initialDoc: loaded.doc,
              role: loaded.role,
              onDocChange,
              registerHandle,
            } as unknown as EditorProps)}
          />
        </Suspense>
      </div>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share & collaborate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Project link</p>
              <p className="text-xs text-muted-foreground">Copy this link, then choose who can open it.</p>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}${window.location.pathname}#/editor/${projectId}`} className="text-xs" />
                <Button variant="secondary" onClick={copyShareLink}>Copy</Button>
              </div>
            </div>
            <ShareSettings projectId={projectId} onDone={() => setShareOpen(false)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collaborate drawer: comments | versions | presence */}
      <Sheet open={collabOpen} onOpenChange={setCollabOpen}>
        <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle className="text-base">Collaborate</SheetTitle>
            <SheetDescription className="text-xs">
              Comments, version history and live presence for this project.
            </SheetDescription>
          </SheetHeader>
          <CollabPanel
            projectId={projectId}
            share={share}
            role={loaded.role}
            members={collabMembers}
            status={presenceStatus}
            selfName={selfName}
            selfColor={selfColor}
            signedIn={!!user}
            currentUserEmail={user?.email ?? null}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

import { ShareSettings } from "@/components/studio/shared/share-settings"
import { Cloud as _Cloud } from "lucide-react"
