"use client"

/**
 * Small doc preview canvas. Draws synchronously inside a callback ref so no
 * state or effects are involved (React Compiler friendly). Uses the shared
 * renderDocToCanvas renderer from the stub editor module.
 */

import { useCallback } from "react"
import { renderDocToCanvas } from "@/components/studio/editors/stub-editor"
import type { DesignDoc } from "@/lib/design/types"
import { cn } from "@/lib/utils"

interface Props {
  doc: DesignDoc
  page?: number
  /** backing-store multiplier; previews can render below 1 to save memory */
  pixelRatio?: number
  className?: string
  label?: string
}

export function DocCanvas({ doc, page = 0, pixelRatio = 0.4, className, label = "Design preview" }: Props) {
  const attach = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas) {
        renderDocToCanvas(doc, page, canvas, pixelRatio)
      }
    },
    [doc, page, pixelRatio],
  )
  return <canvas ref={attach} role="img" aria-label={label} className={cn("h-auto w-full rounded border bg-white", className)} />
}
