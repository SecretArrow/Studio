"use client"

/** Step 2 — review the {{token}} fields detected in the design and mark image fields. */

import { Switch } from "@/components/ui/switch"
import { Braces, ImageIcon, Info } from "lucide-react"
import type { BulkField } from "./bulk-types"

interface Props {
  fields: BulkField[]
  onFieldChange: (token: string, patch: Partial<BulkField>) => void
}

export function StepFields({ fields, onFieldChange }: Props) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
        <Braces className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">No dynamic fields found in this design</p>
        <p className="max-w-md text-xs text-muted-foreground">
          Bulk Create fills text written as{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{{token}}"}</code> — for example{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{{name}}"}</code> or{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{{date}}"}</code>. Open the design in
          the editor, add those tokens to any text element, then come back and pick it again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Found <span className="font-medium text-foreground">{fields.length}</span> dynamic field
        {fields.length === 1 ? "" : "s"} in the design. Each becomes a column in your data table on the next step.
      </p>
      <div className="divide-y rounded-xl border">
        {fields.map((f) => (
          <div key={f.token} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{`{{${f.token}}}`}</code>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {f.count} occurrence{f.count === 1 ? "" : "s"} in text elements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={`img-${f.token}`}
                checked={f.isImage}
                disabled={!f.entireValue}
                onCheckedChange={(checked) => onFieldChange(f.token, { isImage: checked })}
              />
              <label htmlFor={`img-${f.token}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                Treat as image
              </label>
            </div>
          </div>
        ))}
      </div>
      <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Image fields replace the whole text box with the picture from each row (upload or URL). Text fields are
        uppercase-aware: if the text is styled ALL-CAPS, values are uppercased too.
      </p>
    </div>
  )
}
