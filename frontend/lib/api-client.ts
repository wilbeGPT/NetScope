import { FaseResponse, Investigation, ReportTemplate } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer. Received: ${value}`)
  }
}

function assertChapterNumber(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 7) {
    throw new TypeError(`chapterNumber must be an integer between 1 and 7. Received: ${value}`)
  }
}

async function readErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const payload = await res.json()
    if (typeof payload?.detail === "string") return payload.detail
    if (typeof payload?.message === "string") return payload.message
  } catch {
    try {
      const text = await res.text()
      if (text) return text
    } catch {
      // Keep the original fallback when the response body cannot be read.
    }
  }

  return fallback
}

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return
  const detail = await readErrorDetail(res, fallback)
  throw new Error(`${fallback}: ${detail}`)
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 2, delayMs = 500): Promise<Response> {
  let lastError: any = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options)
    } catch (err) {
      lastError = err
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)))
      }
    }
  }
  throw lastError
}

export async function createInvestigation(file: File): Promise<{ id: number; name: string }> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_BASE}/api/investigations/`, {
    method: "POST",
    body: formData,
  })
  await throwIfNotOk(res, "Error creating investigation")
  return res.json()
}

export async function listInvestigations(): Promise<Investigation[]> {
  const res = await fetchWithRetry(`${API_BASE}/api/investigations/`)
  await throwIfNotOk(res, "Error listing investigations")
  return res.json()
}

export async function getInvestigation(id: number): Promise<Investigation> {
  assertPositiveInteger(id, "id")

  const res = await fetchWithRetry(`${API_BASE}/api/investigations/${id}`)
  await throwIfNotOk(res, "Error getting investigation")
  return res.json()
}

export async function updateInvestigation(id: number, name: string): Promise<Investigation> {
  assertPositiveInteger(id, "id")

  const res = await fetch(`${API_BASE}/api/investigations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  })
  await throwIfNotOk(res, "Error updating investigation")
  return res.json()
}

export async function deleteInvestigation(id: number): Promise<{ message: string; id: number }> {
  assertPositiveInteger(id, "id")

  const res = await fetch(`${API_BASE}/api/investigations/${id}`, {
    method: "DELETE",
  })
  await throwIfNotOk(res, "Error deleting investigation")
  return res.json()
}

export async function runPhase(invId: number, phaseNumber: number): Promise<FaseResponse> {
  assertPositiveInteger(invId, "invId")
  assertChapterNumber(phaseNumber)

  const res = await fetchWithRetry(`${API_BASE}/api/investigations/${invId}/fases/${phaseNumber}`, {
    method: "POST",
  })
  await throwIfNotOk(res, `Error executing phase ${phaseNumber}`)
  return res.json()
}

export async function getPhaseResult(invId: number, phaseNumber: number): Promise<FaseResponse> {
  assertPositiveInteger(invId, "invId")
  assertChapterNumber(phaseNumber)

  const res = await fetchWithRetry(`${API_BASE}/api/investigations/${invId}/fases/${phaseNumber}`)
  await throwIfNotOk(res, "Error getting phase result")
  return res.json()
}

export async function sendChatMessage(invId: number, message: string): Promise<string> {
  assertPositiveInteger(invId, "invId")

  const res = await fetchWithRetry(`${API_BASE}/api/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ investigation_id: invId, message }),
  })
  await throwIfNotOk(res, "Failed to send message")
  const data = await res.json()
  return data.reply
}
export async function getReportTemplate(invId?: number): Promise<ReportTemplate> {
  const url = invId ? `${API_BASE}/api/report-template?inv_id=${invId}` : `${API_BASE}/api/report-template`
  const res = await fetchWithRetry(url)
  await throwIfNotOk(res, "Error getting report template")
  return res.json()
}

export async function downloadInvestigationDocx(invId: number, invName: string): Promise<void> {
  assertPositiveInteger(invId, "invId")
  const url = `${API_BASE}/api/investigations/${invId}/export/docx`
  const res = await fetch(url)
  await throwIfNotOk(res, "Error descargando documento Word")
  const blob = await res.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = downloadUrl
  const safeName = invName.replace(/[^a-zA-Z0-9_\-]/g, "_")
  a.download = `Tesis_UFG_${safeName}.docx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

