"use client"

import { useState, useEffect } from "react"
import { getInvestigation, getPhaseResult, getReportTemplate, runPhase } from "@/lib/api-client"
import { FaseResponse, Investigation, ReportTemplate } from "@/lib/types"

/**
 * Hook que encapsula toda la logica de estado de una investigacion:
 * carga de metadatos, cache de resultados de fases y ejecucion.
 */
export function useInvestigation(invId: number) {
  const hasValidInvId = Number.isInteger(invId) && invId > 0
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  const [reportTemplate, setReportTemplate] = useState<ReportTemplate | null>(null)
  const [fase1Data, setFase1Data] = useState<FaseResponse | null>(null)
  const [fase2Data, setFase2Data] = useState<FaseResponse | null>(null)
  const [fase3Data, setFase3Data] = useState<FaseResponse | null>(null)
  const [fase4Data, setFase4Data] = useState<FaseResponse | null>(null)
  const [fase5Data, setFase5Data] = useState<FaseResponse | null>(null)

  const [isRunningAll, setIsRunningAll] = useState(false)
  const [runningPhaseNum, setRunningPhaseNum] = useState<number | null>(null)
  const [pipelineProgress, setPipelineProgress] = useState("")

  useEffect(() => {
    if (!hasValidInvId) return
    getReportTemplate(invId).then(setReportTemplate).catch((err) => console.warn("Aviso plantilla de reporte:", err))
    getInvestigation(invId)
      .then((inv) => {
        setInvestigation(inv)
        if (inv.executed_phases?.includes(1)) getPhaseResult(invId, 1).then(setFase1Data).catch((err) => console.warn("Aviso carga Fase 1:", err))
        if (inv.executed_phases?.includes(2)) getPhaseResult(invId, 2).then(setFase2Data).catch((err) => console.warn("Aviso carga Fase 2:", err))
        if (inv.executed_phases?.includes(3)) getPhaseResult(invId, 3).then(setFase3Data).catch((err) => console.warn("Aviso carga Fase 3:", err))
        if (inv.executed_phases?.includes(4)) getPhaseResult(invId, 4).then(setFase4Data).catch((err) => console.warn("Aviso carga Fase 4:", err))
        if (inv.executed_phases?.includes(5)) getPhaseResult(invId, 5).then(setFase5Data).catch((err) => console.warn("Aviso carga Fase 5:", err))
      })
      .catch((err) => console.warn("Aviso carga investigacion:", err))
  }, [hasValidInvId, invId])

  const handleRunPhase = async (phaseNum: number) => {
    if (!hasValidInvId) return

    const res = await runPhase(invId, phaseNum)
    if (phaseNum === 1) setFase1Data(res)
    if (phaseNum === 2) setFase2Data(res)
    if (phaseNum === 3) setFase3Data(res)
    if (phaseNum === 4) setFase4Data(res)
    if (phaseNum === 5) setFase5Data(res)

    getInvestigation(invId).then(setInvestigation).catch((err) => console.warn("Aviso recarga investigacion:", err))
    getReportTemplate(invId).then(setReportTemplate).catch((err) => console.warn("Aviso recarga plantilla:", err))
  }

  const handleRunAllPhases = async () => {
    if (!hasValidInvId || isRunningAll) return

    setIsRunningAll(true)
    try {
      setRunningPhaseNum(1)
      setPipelineProgress("Fase 1/5: Integridad y Disponibilidad...")
      const res1 = await runPhase(invId, 1)
      setFase1Data(res1)

      setRunningPhaseNum(2)
      setPipelineProgress("Fase 2/5: Línea Base de Latencia...")
      const res2 = await runPhase(invId, 2)
      setFase2Data(res2)

      setRunningPhaseNum(3)
      setPipelineProgress("Fase 3/5: Mapeo ASN y Topología...")
      const res3 = await runPhase(invId, 3)
      setFase3Data(res3)

      setRunningPhaseNum(4)
      setPipelineProgress("Fase 4/5: Detección de Path Inflation...")
      const res4 = await runPhase(invId, 4)
      setFase4Data(res4)

      setRunningPhaseNum(5)
      setPipelineProgress("Fase 5/5: Estabilidad Temporal...")
      const res5 = await runPhase(invId, 5)
      setFase5Data(res5)

      setPipelineProgress("Análisis completo finalizado")
      const updatedInv = await getInvestigation(invId)
      setInvestigation(updatedInv)
      const updatedTpl = await getReportTemplate(invId)
      setReportTemplate(updatedTpl)
    } catch (error) {
      console.error("Error al ejecutar pipeline completo:", error)
      throw error
    } finally {
      setIsRunningAll(false)
      setRunningPhaseNum(null)
    }
  }

  return {
    investigation,
    reportTemplate,
    chatCollapsed,
    setChatCollapsed,
    fase1Data,
    fase2Data,
    fase3Data,
    fase4Data,
    fase5Data,
    handleRunPhase,
    handleRunAllPhases,
    isRunningAll,
    runningPhaseNum,
    pipelineProgress,
  }
}
