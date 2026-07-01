import { FaseResponse, Investigation } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function createInvestigation(file: File): Promise<{id: number, name: string}> {
  const formData = new FormData()
  formData.append("file", file)
  const res = await fetch(`${API_BASE}/api/investigations/`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error("Error creating investigation")
  return res.json()
}

export async function listInvestigations(): Promise<Investigation[]> {
  const res = await fetch(`${API_BASE}/api/investigations/`)
  if (!res.ok) throw new Error("Error listing investigations")
  return res.json()
}

export async function getInvestigation(id: number): Promise<Investigation> {
  const res = await fetch(`${API_BASE}/api/investigations/${id}`)
  if (!res.ok) throw new Error("Error getting investigation")
  return res.json()
}

export async function runPhase(invId: number, phaseNumber: number): Promise<FaseResponse> {
  const res = await fetch(`${API_BASE}/api/investigations/${invId}/fases/${phaseNumber}`, {
    method: "POST",
  })
  if (!res.ok) throw new Error("Error executing phase")
  return res.json()
}

export async function getPhaseResult(invId: number, phaseNumber: number): Promise<FaseResponse> {
  const res = await fetch(`${API_BASE}/api/investigations/${invId}/fases/${phaseNumber}`)
  if (!res.ok) throw new Error("Error getting phase result")
  return res.json()
}
