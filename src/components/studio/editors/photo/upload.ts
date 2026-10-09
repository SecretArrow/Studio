"use client"

/**
 * Image import helpers: files / blobs / URLs → { src, width, height }.
 * Prefers uploading to the user's private asset library (POST /api/assets);
 * falls back to inline data URLs for guests or when the upload fails, so
 * everything keeps working offline. Honest failures via thrown errors the
 * caller can toast.
 */

import { api } from "@/lib/studio/api-client"
import { loadImage } from "@/lib/editor/export"

export interface ImportedImage {
  src: string
  width: number
  height: number
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => {
      if (typeof fr.result === "string") resolve(fr.result)
      else reject(new Error("Could not read the file"))
    }
    fr.onerror = () => reject(new Error("Could not read the file"))
    fr.readAsDataURL(blob)
  })
}

async function probe(src: string): Promise<{ width: number; height: number } | null> {
  const img = await loadImage(src)
  if (!img || !img.naturalWidth) return null
  return { width: img.naturalWidth, height: img.naturalHeight }
}

async function uploadToAssets(file: File): Promise<string | null> {
  try {
    const form = new FormData()
    form.append("file", file)
    const res = await api.upload<{ asset?: { url?: string } }>("/api/assets", form)
    const url = res.asset?.url
    if (typeof url === "string" && url.length > 0) return url
    return null
  } catch {
    return null // guests / offline — caller falls back to a data URL
  }
}

/** Import a user-selected image file. Never throws — returns null on hard failure. */
export async function importImageFile(file: File): Promise<ImportedImage | null> {
  if (!file.type.startsWith("image/")) return null
  if (file.size > 25 * 1024 * 1024) throw new Error("Image is larger than 25MB — pick a smaller file")
  const dataUrl = await readAsDataUrl(file)
  const dims = await probe(dataUrl)
  if (!dims) return null
  const uploaded = await uploadToAssets(file)
  return { src: uploaded ?? dataUrl, ...dims }
}

/** Import a rendered blob (e.g. a baked crop) the same way. */
export async function importImageBlob(blob: Blob, name: string): Promise<ImportedImage | null> {
  const dataUrl = await readAsDataUrl(blob)
  const dims = await probe(dataUrl)
  if (!dims) return null
  const file = new File([blob], name, { type: blob.type || "image/png" })
  const uploaded = await uploadToAssets(file)
  return { src: uploaded ?? dataUrl, ...dims }
}

/** Load an image from a URL (CORS-enabled hosts only — honest error otherwise). */
export async function importImageUrl(url: string): Promise<ImportedImage | null> {
  const trimmed = url.trim()
  if (!trimmed) return null
  const src = /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:") ? trimmed : `https://${trimmed}`
  const dims = await probe(src)
  if (!dims) throw new Error("Could not load that URL (the host may block cross-origin images)")
  return { src, ...dims }
}
