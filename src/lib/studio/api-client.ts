"use client"

/** Small typed fetch wrapper for the Studio API. Relative paths only. */

export class ApiClientError extends Error {
  status: number
  code: string
  data: Record<string, unknown> | null
  constructor(status: number, message: string, code = "error", data: Record<string, unknown> | null = null) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
}

async function handle<T>(res: Response): Promise<T> {
  let body: Record<string, unknown> = {}
  try {
    body = await res.json()
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new ApiClientError(res.status, (body.error as string) || `Request failed (${res.status})`, (body.code as string) || "error", body)
  }
  return body as T
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(path, { credentials: "same-origin" }).then((r) => handle<T>(r))
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(path, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Requested-With": "studio" },
      body: body === undefined ? "{}" : JSON.stringify(body),
    }).then((r) => handle<T>(r))
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return fetch(path, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-Requested-With": "studio" },
      body: body === undefined ? "{}" : JSON.stringify(body),
    }).then((r) => handle<T>(r))
  },
  delete<T>(path: string): Promise<T> {
    return fetch(path, {
      method: "DELETE",
      credentials: "same-origin",
      headers: { "X-Requested-With": "studio" },
    }).then((r) => handle<T>(r))
  },
  upload<T>(path: string, form: FormData, onProgress?: (pct: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", path)
      xhr.withCredentials = true
      xhr.setRequestHeader("X-Requested-With", "studio")
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        let body: Record<string, unknown> = {}
        try { body = JSON.parse(xhr.responseText) } catch { /* noop */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(body as T)
        else reject(new ApiClientError(xhr.status, (body.error as string) || "Upload failed", (body.code as string) || "error", body))
      }
      xhr.onerror = () => reject(new ApiClientError(0, "Network error during upload"))
      xhr.send(form)
    })
  },
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
