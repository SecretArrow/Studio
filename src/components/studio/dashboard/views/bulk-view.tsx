"use client"

/**
 * Bulk Create — a 4-step wizard: pick a design → review {{fields}} → map CSV data
 * → batch-generate a ZIP of PNGs. Runs entirely in the browser; guests can use a
 * public template + demo data (or their own CSV) without an account.
 */

import { useMemo, useState } from "react"
import { useAppStore } from "@/lib/studio/app-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DesignDoc } from "@/lib/design/types"
import { Braces, Check, ChevronLeft, ChevronRight, Info, LayoutTemplate, Rocket, Table2 } from "lucide-react"
import type { BulkField, BulkSource, CsvTable } from "./bulk/bulk-types"
import { findDuplicates, scanFields } from "./bulk/tokens"
import { StepTemplate } from "./bulk/step-template"
import { StepFields } from "./bulk/step-fields"
import { StepCsv } from "./bulk/step-csv"
import { StepGenerate } from "./bulk/step-generate"

const STEPS = [
  { label: "Design", hint: "Pick a project or template", icon: LayoutTemplate },
  { label: "Fields", hint: "Review dynamic {{fields}}", icon: Braces },
  { label: "Data", hint: "Upload & map your CSV", icon: Table2 },
  { label: "Generate", hint: "Preview and batch-render", icon: Rocket },
] as const

export function BulkView() {
  const user = useAppStore((s) => s.user)

  const [step, setStep] = useState(0)
  const [source, setSource] = useState<BulkSource | null>(null)
  const [doc, setDoc] = useState<DesignDoc | null>(null)
  const [fields, setFields] = useState<BulkField[]>([])
  const [csv, setCsv] = useState<CsvTable | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(false)

  const duplicateIndexes = useMemo(() => (csv ? findDuplicates(csv.rows) : new Set<number>()), [csv])
  const effectiveRows = useMemo(
    () => (csv ? (skipDuplicates ? csv.rows.filter((_, i) => !duplicateIndexes.has(i)) : csv.rows) : []),
    [csv, skipDuplicates, duplicateIndexes],
  )

  function handleSelect(next: BulkSource, loadedDoc: DesignDoc) {
    setSource(next)
    setDoc(loadedDoc)
    setFields(scanFields(loadedDoc))
    setCsv(null)
    setSkipDuplicates(false)
    setStep(1)
  }

  function handleFieldChange(token: string, patch: Partial<BulkField>) {
    setFields((prev) => prev.map((f) => (f.token === token ? { ...f, ...patch } : f)))
  }

  function back() {
    setStep((s) => Math.max(0, s - 1))
  }

  function next() {
    setStep((s) => Math.min(3, s + 1))
  }

  const canNext =
    (step === 0 && !!doc) ||
    (step === 1 && fields.length > 0) ||
    (step === 2 && !!csv && effectiveRows.length > 0 && fields.some((f) => f.column))

  const isDemoRun = source?.kind === "template"

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Bulk Create</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Turn one design into hundreds — certificates, product cards, invitations — from a CSV. All parsing and
          rendering runs in your browser; your data never leaves the device.
        </p>
      </div>

      {/* stepper */}
      <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Bulk create steps">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const reachable = i < step || (i === step + 1 && canNext)
          const passed = i < step
          return (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => reachable && setStep(i)}
                disabled={!reachable && i !== step}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border p-3 text-left transition",
                  i === step ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "hover:border-muted-foreground/40",
                  reachable ? "cursor-pointer" : "cursor-default opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    passed ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {passed ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* demo banner */}
      {isDemoRun && (
        <p className="mb-4 flex items-start gap-2 rounded-lg bg-violet-50 p-3 text-xs text-violet-800 dark:bg-violet-900/20 dark:text-violet-200">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Demo run — you&apos;re using a public template. Everything still generates in your browser and downloads as a
          real ZIP. Sign in to bulk-generate from your own saved designs and keep a job history.
        </p>
      )}

      {/* step content */}
      <div className="min-h-[360px]">
        {step === 0 && <StepTemplate selected={source} onSelect={handleSelect} />}
        {step === 1 && doc && <StepFields fields={fields} onFieldChange={handleFieldChange} />}
        {step === 2 && (
          <StepCsv
            fields={fields}
            onFieldChange={handleFieldChange}
            csv={csv}
            onCsvChange={setCsv}
            duplicateIndexes={duplicateIndexes}
            skipDuplicates={skipDuplicates}
            onSkipDuplicatesChange={setSkipDuplicates}
            user={user}
          />
        )}
        {step === 3 && doc && (
          <StepGenerate doc={doc} fields={fields} rows={effectiveRows} source={source} user={user} />
        )}
      </div>

      {/* nav */}
      <div className="mt-6 flex items-center gap-2 border-t pt-4">
        <Button variant="outline" onClick={back} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < 3 && (
          <>
            {step === 2 && !canNext && (
              <p className="ml-auto text-xs text-muted-foreground">Load data and map at least one column to continue.</p>
            )}
            <Button onClick={next} disabled={!canNext} className={cn("ml-auto", step === 2 && !canNext && "ml-0")}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
