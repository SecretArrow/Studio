"use client"

import { useAppStore } from "@/lib/studio/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Layers3, Table2, FileSpreadsheet } from "lucide-react"

export function BulkView() {
  const navigate = useAppStore((s) => s.navigate)
  const user = useAppStore((s) => s.user)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-bold">Bulk Create</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Generate hundreds of personalized designs — certificates, product cards, invitations, price tags — from one template
        and a CSV file. All processing runs in your browser; large batches never leave your device unless you publish them.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><Layers3 className="h-5 w-5 text-primary" /><CardTitle className="text-sm">1. Pick a template</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Choose any design as the base and mark text fields as dynamic.</CardContent>
        </Card>
        <Card>
          <CardHeader><Table2 className="h-5 w-5 text-primary" /><CardTitle className="text-sm">2. Map CSV columns</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Import a CSV and map columns to the template&apos;s dynamic fields.</CardContent>
        </Card>
        <Card>
          <CardHeader><FileSpreadsheet className="h-5 w-5 text-primary" /><CardTitle className="text-sm">3. Batch export</CardTitle></CardHeader>
          <CardContent className="text-xs text-muted-foreground">Preview variations, then export everything as a ZIP of PNGs.</CardContent>
        </Card>
      </div>
      <div className="mt-6 flex gap-2">
        <Button onClick={() => navigate({ name: "bulk-generator" as never })} disabled title="Open a template, then choose Bulk generate">
          Start bulk generation
        </Button>
        {!user && <p className="text-xs text-muted-foreground">Sign in to save batch jobs history.</p>}
      </div>
    </div>
  )
}
