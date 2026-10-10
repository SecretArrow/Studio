"use client"

/** Shared types for the bulk generation wizard. */

import type { DesignDoc } from "@/lib/design/types"

export interface BulkSource {
  kind: "project" | "template"
  id: string
  name: string
  width: number
  height: number
  thumbnail: string | null
}

export interface BulkField {
  /** token name inside {{...}} */
  token: string
  /** how many {{token}} occurrences exist across text elements */
  count: number
  /** the token is the entire value of at least one text element → eligible as an image field */
  entireValue: boolean
  /** user marked it as an image replacement */
  isImage: boolean
  /** mapped CSV column (null = leave {{token}} as-is) */
  column: string | null
}

export interface CsvTable {
  /** file name or "Pasted data" or "Demo data" */
  name: string
  columns: string[]
  rows: Record<string, string>[]
}

export interface RowError {
  row: number
  message: string
}

export type { DesignDoc }
