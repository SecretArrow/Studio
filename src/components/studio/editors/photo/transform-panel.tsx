"use client"

/** Transform panel: rotate ±90°, flips, straighten slider and the crop flow. */

import type { PhotoApi } from "./api"
import { EmptyHint, PanelSection, SliderRow } from "./ui"
import { Button } from "@/components/ui/button"
import { Check, Crop, FlipHorizontal, FlipVertical, Loader2, RotateCcw, RotateCw, X } from "lucide-react"

const ASPECTS: { id: string; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "3:2", label: "3:2" },
  { id: "2:3", label: "2:3" },
  { id: "original", label: "Original" },
]

export function TransformPanel({ api }: { api: PhotoApi }) {
  const subject = api.subject
  if (!subject) {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <PanelSection title="Transform">
          <EmptyHint title="Add a photo first" note="Rotate, straighten and crop become available with a photo on the canvas." />
        </PanelSection>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PanelSection title="Rotate & flip">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit} onClick={() => api.rotate90(-1)}>
            <RotateCcw className="h-3.5 w-3.5" /> 90° left
          </Button>
          <Button variant="outline" size="sm" className="h-9 gap-1.5" disabled={!api.canEdit} onClick={() => api.rotate90(1)}>
            <RotateCw className="h-3.5 w-3.5" /> 90° right
          </Button>
          <Button
            variant={subject.flipH ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            disabled={!api.canEdit}
            onClick={() => api.toggleFlip("h")}
            aria-pressed={!!subject.flipH}
          >
            <FlipHorizontal className="h-3.5 w-3.5" /> Flip H
          </Button>
          <Button
            variant={subject.flipV ? "secondary" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            disabled={!api.canEdit}
            onClick={() => api.toggleFlip("v")}
            aria-pressed={!!subject.flipV}
          >
            <FlipVertical className="h-3.5 w-3.5" /> Flip V
          </Button>
        </div>
      </PanelSection>

      <PanelSection title="Straighten">
        <SliderRow
          label="Angle"
          hint="±15°, applied live"
          value={api.straighten}
          def={0}
          min={-15}
          max={15}
          step={0.5}
          disabled={!api.canEdit}
          coalesceKey="straighten"
          onCommit={(v) => api.setStraighten(v)}
        />
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          The photo scales up slightly so no empty corners appear. Baked into the image when you apply a crop.
        </p>
      </PanelSection>

      <PanelSection title="Crop">
        {!api.cropMode ? (
          <>
            <Button size="sm" className="w-full gap-1.5" disabled={!api.canEdit} onClick={() => api.setCropMode(true)}>
              <Crop className="h-3.5 w-3.5" /> Enter crop mode
            </Button>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Drag the frame handles on the photo, pick an aspect ratio, then apply. Applying writes a new image with
              the rotation, straighten and flip baked in — filters stay editable.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {ASPECTS.map((a) => (
                <Button
                  key={a.id}
                  variant={api.cropAspect === a.id ? "secondary" : "outline"}
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  disabled={!api.canEdit}
                  onClick={() => api.setCropAspect(a.id)}
                  aria-pressed={api.cropAspect === a.id}
                >
                  {a.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="h-9 gap-1.5" disabled={!api.canEdit || api.busy === "crop"} onClick={() => api.applyCrop()}>
                {api.busy === "crop" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Apply crop
              </Button>
              <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => api.setCropMode(false)}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          </>
        )}
      </PanelSection>
    </div>
  )
}
