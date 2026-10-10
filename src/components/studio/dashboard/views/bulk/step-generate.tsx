"use client"

/** Step 4 — preview the first rows, then batch-render every row to PNGs inside a ZIP. */

import { useEffect, useMemo, useRef, useState } from "react"
import JSZip from "jszip"
import { useAppStore, type SessionUser } from "@/lib/studio/app-store"
import { api, downloadBlob } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { renderDocToCanvas } from "@/components/studio/editors/stub-editor"
import type { DesignDoc } from "@/lib/design/types"
import { AlertTriangle, CheckCircle2, Download, History, Loader2, Play, Square } from "lucide-react"
import type { BulkField, BulkSource, RowError } from "./bulk-types"
import { DocCanvas } from "./doc-canvas"
import { applyRow, canvasToBlob, sanitizeFileBase, yieldToBrowser } from "./tokens"

interface Props {
  doc: DesignDoc
  fields: BulkField[]
  rows: Record<string, string>[]
  source: BulkSource | null
  user: SessionUser | null
}

interface RunResult {
  produced: number
  cancelled: boolean
  zipName: string | null
  errors: RowError[]
}

export function StepGenerate({ doc, fields, rows, source, user }: Props) {
  const { toast } = useToast()
  const navigate = useAppStore((s) => s.navigate)
  const [scale, setScale] = useState(1)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const cancelRef = useRef(false)
  // set when the component unmounts so the batch loop stops rendering rows,
  // releases its zip buffer and skips post-unmount setState/download
  const unmountedRef = useRef(false)
  useEffect(() => {
    return () => {
      unmountedRef.current = true
    }
  }, [])

  const mappedFields = useMemo(() => fields.filter((f) => f.column), [fields])
  const previews = useMemo(
    () =>
      rows.slice(0, 3).map((row, i) => ({
        label: row[mappedFields[0]?.column ?? ""] || `Row ${i + 1}`,
        doc: applyRow(doc, fields, row),
      })),
    [rows, doc, fields, mappedFields],
  )

  async function reportJob(jobId: string, data: Record<string, unknown>) {
    if (!jobId) return
    try {
      await api.patch(`/api/bulk-jobs/${jobId}`, data)
    } catch {
      /* job history is best-effort */
    }
  }

  async function run() {
    if (rows.length === 0 || running) return
    cancelRef.current = false
    setRunning(true)
    setProgress(0)
    setResult(null)

    // job history (signed-in only, best-effort)
    let jobId = ""
    if (user) {
      try {
        const res = await api.post<{ job: { id: string } }>("/api/bulk-jobs", {
          projectId: source?.kind === "project" ? source.id : undefined,
          total: rows.length,
        })
        jobId = res.job.id
      } catch {
        /* ignore — history is optional */
      }
    }
    if (jobId) await reportJob(jobId, { status: "running" })

    const zip = new JSZip()
    const errors: RowError[] = []
    let produced = 0

    try {
      for (let i = 0; i < rows.length; i += 1) {
        if (cancelRef.current || unmountedRef.current) break
        const row = rows[i]
        try {
          const rowDoc = applyRow(doc, fields, row)
          const canvas = renderDocToCanvas(rowDoc, 0, undefined, scale)
          const blob = await canvasToBlob(canvas)
          const firstValue = mappedFields.length > 0 ? (row[mappedFields[0].column as string] ?? "") : ""
          const name = `${String(i + 1).padStart(3, "0")}-${sanitizeFileBase(firstValue)}.png`
          zip.file(name, blob)
          produced += 1
        } catch (err) {
          errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Unknown rendering error" })
        }
        if (!unmountedRef.current) setProgress(i + 1)
        if (jobId && (i + 1) % 5 === 0) await reportJob(jobId, { done: i + 1 })
        await yieldToBrowser()
      }

      const cancelled = cancelRef.current || unmountedRef.current
      let zipName: string | null = null
      if (produced > 0 && !cancelled) {
        zipName = `studio-bulk-${produced}.zip`
        const zipped = await zip.generateAsync({ type: "blob", compression: "STORE" })
        downloadBlob(zipped, zipName)
      }
      if (!unmountedRef.current) setResult({ produced, cancelled, zipName, errors })

      if (jobId) {
        const allFailed = produced === 0 && errors.length > 0
        await reportJob(jobId, {
          status: cancelled ? "cancelled" : allFailed ? "failed" : "done",
          done: produced,
          error: errors.length > 0 ? `${errors.length} row(s) failed: ${errors[0].message}` : null,
        })
      }
      if (produced > 0 && !cancelled) {
        toast({ title: `Generated ${produced} design${produced === 1 ? "" : "s"}`, description: `${zipName} is downloading.` })
      }
    } catch (err) {
      if (!unmountedRef.current) setResult({ produced, cancelled: false, zipName: null, errors: [...errors, { row: progress + 1, message: err instanceof Error ? err.message : "Batch failed" }] })
      if (jobId) await reportJob(jobId, { status: "failed", error: err instanceof Error ? err.message : "Batch failed" })
    } finally {
      if (!unmountedRef.current) setRunning(false)
    }
  }

  const total = rows.length
  const pct = total === 0 ? 0 : Math.round((progress / total) * 100)

  return (
    <div className="space-y-5">
      {/* preview */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Label>Preview — first {previews.length} row{previews.length === 1 ? "" : "s"}</Label>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Export size</Label>
            <Select value={String(scale)} onValueChange={(v) => setScale(Number(v))} disabled={running}>
              <SelectTrigger className="h-8 w-28" aria-label="Export scale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1× ({doc.width}px)</SelectItem>
                <SelectItem value="1.5">1.5× ({Math.round(doc.width * 1.5)}px)</SelectItem>
                <SelectItem value="2">2× ({doc.width * 2}px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {previews.map((p, i) => (
            <div key={i} className="rounded-lg border p-2">
              <DocCanvas doc={p.doc} pixelRatio={0.35} label={`Preview of row ${i + 1}`} />
              <p className="mt-1.5 truncate text-center text-xs text-muted-foreground">{p.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Previews render in your browser. Images placed by the original design may be omitted in previews; the exported
          files follow the same renderer as the editor&apos;s export menu.
        </p>
      </div>

      {/* run */}
      <div className="rounded-xl border p-4">
        {!running ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void run()} disabled={total === 0 || mappedFields.length === 0}>
              <Play className="h-4 w-4" /> Generate {total} design{total === 1 ? "" : "s"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Renders {total} PNG file{total === 1 ? "" : "s"} in this browser tab, then downloads{" "}
              <code className="rounded bg-muted px-1 font-mono">studio-bulk-{total || 0}.zip</code>. You can cancel at any
              time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                Rendering… {progress}/{total}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelRef.current = true
                }}
              >
                <Square className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
            <Progress value={pct} aria-label={`Batch progress ${pct}%`} />
          </div>
        )}
        {!user && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <History className="h-3.5 w-3.5" />
            Batch runs fully in your browser.{" "}
            <button type="button" className="underline hover:text-foreground" onClick={() => navigate({ name: "auth" })}>
              Sign in
            </button>{" "}
            to keep a record of batch jobs in your history.
          </p>
        )}
        {total > 200 && !running && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Large batch ({total} rows) — processing is chunked to keep the UI responsive, but consider splitting into
            smaller files if this tab slows down.
          </p>
        )}
      </div>

      {/* result */}
      {result && (
        <div className="rounded-xl border p-4">
          {result.cancelled ? (
            <p className="flex items-center gap-2 text-sm">
              <Square className="h-4 w-4 text-amber-500" />
              Cancelled after {result.produced} of {total} design{total === 1 ? "" : "s"} — no ZIP was created.
            </p>
          ) : result.produced > 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Done — {result.produced} design{result.produced === 1 ? "" : "s"} exported
              {result.zipName && (
                <>
                  {" "}as <code className="rounded bg-muted px-1 font-mono text-xs">{result.zipName}</code>
                  <Download className="h-3.5 w-3.5 text-muted-foreground" aria-label="downloaded" />
                </>
              )}
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" /> Nothing was generated — see errors below.
            </p>
          )}
          {result.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-destructive">{result.errors.length} row{result.errors.length === 1 ? "" : "s"} failed:</p>
              <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                {result.errors.map((e) => (
                  <li key={e.row} className="rounded bg-muted/60 px-2 py-1">
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
