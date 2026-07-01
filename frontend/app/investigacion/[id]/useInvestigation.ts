"use client"

import { useState, useEffect } from "react"
import { getInvestigation, getPhaseResult, runPhase } from "@/lib/api-client"
import { FaseResponse, Investigation } from "@/lib/types"

/**
 * Hook que encapsula toda la lógica de estado de una investigación:
 * carga de metadatos, caché de resultados de fases y ejecución.
 */
export function useInvestigation(invId: number) {
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [fase1Data, setFase1Data] = useState<FaseResponse | null>(null)
  const [fase2Data, setFase2Data] = useState<FaseResponse | null>(null)
  const [fase3Data, setFase3Data] = useState<FaseResponse | null>(null)
  const [fase4Data, setFase4Data] = useState<FaseResponse | null>(null)
  const [fase5Data, setFase5Data] = useState<FaseResponse | null>(null)

  useEffect(() => {
    if (!invId) return
    getInvestigation(invId)
      .then((inv) => {
        setInvestigation(inv)
        if (inv.executed_phases?.includes(1)) getPhaseResult(invId, 1).then(setFase1Data).catch(console.error)
        if (inv.executed_phases?.includes(2)) getPhaseResult(invId, 2).then(setFase2Data).catch(console.error)
        if (inv.executed_phases?.includes(3)) getPhaseResult(invId, 3).then(setFase3Data).catch(console.error)
        if (inv.executed_phases?.includes(4)) getPhaseResult(invId, 4).then(setFase4Data).catch(console.error)
        if (inv.executed_phases?.includes(5)) getPhaseResult(invId, 5).then(setFase5Data).catch(console.error)
      })
      .catch(console.error)
  }, [invId])

  const handleRunPhase = async (phaseNum: number) => {
    const res = await runPhase(invId, phaseNum)
    if (phaseNum === 1) setFase1Data(res)
    if (phaseNum === 2) setFase2Data(res)
    if (phaseNum === 3) setFase3Data(res)
    if (phaseNum === 4) setFase4Data(res)
    if (phaseNum === 5) setFase5Data(res)
  }

  return {
    investigation,
    chatCollapsed,
    setChatCollapsed,
    fase1Data,
    fase2Data,
    fase3Data,
    fase4Data,
    fase5Data,
    handleRunPhase,
  }
}
