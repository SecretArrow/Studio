"use client"

/** Step 3 — bring the data: CSV upload/paste, column mapping, validation, demo data. */

import { useMemo, useRef, useState } from "react"
import Papa from "papaparse"
import { api } from "@/lib/studio/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { SessionUser } from "@/lib/studio/app-store"
import { cn } from "@/lib/utils"
import { AlertTriangle, FileSpreadsheet, ImagePlus, Loader2, Sparkles, Trash2, Upload } from "lucide-react"
import type { BulkField, CsvTable } from "./bulk-types"
import { demoRows, findMissing } from "./tokens"

const MAX_PREVIEW_ROWS = 30

interface Props {
  fields: BulkField[]
  onFieldChange: (token: string, patch: Partial<BulkField>) => void
  csv: CsvTable | null
  onCsvChange: (csv: CsvTable | null) => void
  /** indexes (0-based, in csv.rows) of exact duplicate rows */
  duplicateIndexes: Set<number>
  skipDuplicates: boolean
  onSkipDuplicatesChange: (v: boolean) => void
  user: SessionUser | null
}

export function StepCsv({ fields, onFieldChange, csv, onCsvChange, duplicateIndexes, skipDuplicates, onSkipDuplicatesChange, user }: Props) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pasting, setPasting] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [uploadingCell, setUploadingCell] = useState<string | null>(null)

  const mappedFields = useMemo(() => fields.filter((f) => f.column), [fields])
  const missing = useMemo(() => findMissing(csv?.rows ?? [], fields), [csv?.rows, fields])
  const missingRows = useMemo(() => [...missing.keys()], [missing])
  const duplicateCount = duplicateIndexes.size

  function adoptTable(columns: string[], rows: Record<string, string>[], name: string) {
    if (columns.length === 0) {
      setParseError("No columns detected — the first row should be a header like name,course,date")
      return
    }
    setParseError(null)
    onCsvChange({ name, columns, rows })
    // auto-map columns to tokens by name (case-insensitive)
    const lower = new Map(columns.map((c) => [c.toLowerCase(), c]))
    fields.forEach((f) => {
      const match = lower.get(f.token.toLowerCase())
      if (match) {
        onFieldChange(f.token, { column: match })
      } else if (f.column && !columns.includes(f.column)) {
        onFieldChange(f.token, { column: null })
      }
    })
  }

  function parseFile(file: File) {
    setParsing(true)
    setParseError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        setParsing(false)
        adoptTable((results.meta.fields ?? []).filter(Boolean), results.data, file.name)
      },
      error: (err) => {
        setParsing(false)
        setParseError(err.message)
      },
    })
  }

  function parsePasted() {
    if (!pasteText.trim()) return
    setParsing(true)
    setParseError(null)
    try {
      const results = Papa.parse<Record<string, string>>(pasteText.trim(), {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (h) => h.trim(),
      })
      adoptTable((results.meta.fields ?? []).filter(Boolean), results.data, "Pasted data")
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not parse the pasted data")
    } finally {
      setParsing(false)
    }
  }

  function loadDemo() {
    const tokens = fields.map((f) => f.token)
    adoptTable(tokens, demoRows(fields), "Demo data")
  }

  function editCell(rowIndex: number, column: string, value: string) {
    if (!csv) return
    onCsvChange({
      ...csv,
      rows: csv.rows.map((row, i) => (i === rowIndex ? { ...row, [column]: value } : row)),
    })
  }

  async function uploadCellImage(rowIndex: number, column: string, file: File) {
    const key = `${rowIndex}:${column}`
    setUploadingCell(key)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await api.upload<{ asset: { url: string } }>("/api/assets", form)
      editCell(rowIndex, column, res.asset.url)
    } catch (err) {
      toast({ title: "Image upload failed", description: err instanceof Error ? err.message : undefined, variant: "destructive" })
    } finally {
      setUploadingCell(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* import */}
      <div className="rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="mr-1">Data</Label>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={parsing}>
            {parsing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPasting((v) => !v)}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> {pasting ? "Hide paste box" : "Paste data"}
          </Button>
          <Button variant="outline" size="sm" onClick={loadDemo} disabled={fields.length === 0}>
            <Sparkles className="h-3.5 w-3.5" /> Demo data (3 rows)
          </Button>
          {csv && (
            <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground" onClick={() => onCsvChange(null)}>
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Upload CSV file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) parseFile(file)
              e.target.value = ""
            }}
          />
        </div>
        {pasting && (
          <div className="mt-3 space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={4}
              placeholder={"name,course,date\nAva Chen,Watercolor,June 1 2025\n…"}
              className="w-full rounded-md border bg-background p-2 font-mono text-xs"
              aria-label="Paste CSV data"
            />
            <Button size="sm" onClick={parsePasted} disabled={!pasteText.trim() || parsing}>Parse pasted data</Button>
          </div>
        )}
        {parseError && (
          <p className="mt-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">{parseError}</p>
        )}
        {csv && (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{csv.name}</span> — {csv.rows.length} row{csv.rows.length === 1 ? "" : "s"},{" "}
            {csv.columns.length} column{csv.columns.length === 1 ? "" : "s"} (parsed in your browser — nothing uploaded)
          </p>
        )}
      </div>

      {fields.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          Go back to step 2 — this design has no {"{{fields}}"} to fill yet.
        </p>
      )}

      {/* mapping */}
      {fields.length > 0 && (
        <div className="rounded-xl border p-4">
          <Label className="mb-3 block">Map columns → fields</Label>
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.token} className="flex flex-wrap items-center gap-2">
                <code className="w-40 shrink-0 truncate rounded bg-muted px-1.5 py-1 font-mono text-xs">{`{{${f.token}}}`}</code>
                <span className="text-xs text-muted-foreground" aria-hidden>←</span>
                <Select
                  value={f.column ?? "none"}
                  onValueChange={(v) => onFieldChange(f.token, { column: v === "none" ? null : v })}
                >
                  <SelectTrigger className="w-56" aria-label={`CSV column for ${f.token}`}>
                    <SelectValue placeholder="Choose a column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— leave as {"{{token}}"} —</SelectItem>
                    {(csv?.columns ?? []).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {f.isImage && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">image per row</span>}
              </div>
            ))}
          </div>
          {!csv && <p className="mt-3 text-xs text-muted-foreground">Load a CSV, paste data, or use demo data to enable mapping.</p>}
        </div>
      )}

      {/* validation */}
      {csv && (
        <div className="space-y-2">
          {csv.rows.length > 200 && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {csv.rows.length} rows is a large batch — generation runs in your browser in chunks, but very large files
              can exhaust memory. Consider splitting into smaller CSVs for smoother runs.
            </p>
          )}
          {duplicateCount > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs text-muted-foreground">
                {duplicateCount} exact duplicate row{duplicateCount === 1 ? "" : "s"} detected (highlighted in the table).
              </p>
              <div className="ml-auto flex items-center gap-2">
                <Switch id="skip-dups" checked={skipDuplicates} onCheckedChange={onSkipDuplicatesChange} />
                <label htmlFor="skip-dups" className="text-xs">Skip duplicates</label>
              </div>
            </div>
          )}
          {mappedFields.length > 0 && missingRows.length > 0 && (
            <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {missingRows.length} row{missingRows.length === 1 ? " has" : "s have"} empty values in mapped columns (row
              {" "}{missingRows.slice(0, 20).map((i) => i + 1).join(", ")}{missingRows.length > 20 ? "…" : ""}) — those rows still generate with blanks.
            </p>
          )}
        </div>
      )}

      {/* preview table */}
      {csv && mappedFields.length > 0 && (
        <div className="overflow-hidden rounded-xl border">
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  <th className="px-2 py-2 font-medium text-muted-foreground">#</th>
                  {mappedFields.map((f) => (
                    <th key={f.token} className="px-2 py-2 font-medium">
                      <code className="font-mono">{`{{${f.token}}}`}</code>
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground">← {f.column}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {csv.rows.slice(0, MAX_PREVIEW_ROWS).map((row, i) => {
                  const isDup = duplicateIndexes.has(i)
                  return (
                    <tr key={i} className={cn(isDup && "bg-amber-50 dark:bg-amber-900/15")}>
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      {mappedFields.map((f) => {
                        const column = f.column as string
                        const value = row[column] ?? ""
                        if (f.isImage) {
                          return (
                            <td key={f.token} className="px-2 py-1.5">
                              <div className="flex items-center gap-1">
                                <Input
                                  value={value}
                                  onChange={(e) => editCell(i, column, e.target.value)}
                                  placeholder="image URL"
                                  className="h-7 w-44 font-mono text-[11px]"
                                  aria-label={`Image URL for row ${i + 1}`}
                                />
                                {user ? (
                                  <label
                                    className={cn(
                                      "inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border text-muted-foreground transition hover:border-primary hover:text-foreground",
                                      uploadingCell === `${i}:${column}` && "pointer-events-none opacity-60",
                                    )}
                                    title="Upload an image for this row"
                                  >
                                    {uploadingCell === `${i}:${column}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <ImagePlus className="h-3 w-3" />
                                    )}
                                    <input
                                      type="file"
                                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                      className="sr-only"
                                      aria-label={`Upload image for row ${i + 1}`}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) void uploadCellImage(i, column, file)
                                        e.target.value = ""
                                      }}
                                    />
                                  </label>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground" title="Sign in to upload — paste an image URL instead">URL</span>
                                )}
                              </div>
                            </td>
                          )
                        }
                        return (
                          <td key={f.token} className="px-2 py-1.5">
                            <Input
                              value={value}
                              onChange={(e) => editCell(i, column, e.target.value)}
                              className={cn(
                                "h-7 w-40 text-[11px]",
                                !value.trim() && "border-amber-400/70 bg-amber-50 dark:bg-amber-900/15",
                              )}
                              aria-label={`${f.token} for row ${i + 1}`}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {csv.rows.length > MAX_PREVIEW_ROWS && (
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              Showing the first {MAX_PREVIEW_ROWS} of {csv.rows.length} rows — every row is included in the generated batch.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
