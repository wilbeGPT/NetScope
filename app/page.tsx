"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

import { useState, useEffect } from "react"
import { Activity, BarChart3, FileCheck2, GitBranch, Network, Radar, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AiChatPanel } from "@/components/ai-chat-panel"
import { Phase4View } from "@/components/phase-4-view"
import { Fase1View } from "@/components/Fase1View"
import { Fase2View } from "@/components/Fase2View"
import { Fase3View } from "@/components/Fase3View"
import { Fase5View } from "@/components/Fase5View"
import { PhasePlaceholder } from "@/components/phase-placeholder"
import { ThemeToggle } from "@/components/theme-toggle"
import { getInvestigation, getPhaseResult, runPhase } from "@/lib/api-client"
import { FaseResponse, Investigation } from "@/lib/types"

const phases = [
  { id: "fase-1", short: "Fase 1", label: "Integridad", icon: ShieldCheck },
  { id: "fase-2", short: "Fase 2", label: "Línea Base", icon: Activity },
  { id: "fase-3", short: "Fase 3", label: "Mapeo ASN", icon: GitBranch },
  { id: "fase-4", short: "Fase 4", label: "Path Inflation", icon: Network },
  { id: "fase-5", short: "Fase 5", label: "Estabilidad", icon: Radar },
]

function PageContent() {
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const searchParams = useSearchParams()
  const idParam = searchParams.get("id")
  
  // State for the active investigation
  const [activeInvId, setActiveInvId] = useState<number>(idParam ? parseInt(idParam, 10) : 1)
  const [investigation, setInvestigation] = useState<Investigation | null>(null)
  
  // State for Phase results
  const [fase1Data, setFase1Data] = useState<FaseResponse | null>(null)
  const [fase2Data, setFase2Data] = useState<FaseResponse | null>(null)
  const [fase3Data, setFase3Data] = useState<FaseResponse | null>(null)
  const [fase4Data, setFase4Data] = useState<FaseResponse | null>(null)
  const [fase5Data, setFase5Data] = useState<FaseResponse | null>(null)

  useEffect(() => {
    if (!activeInvId) return
    
    // Fetch investigation metadata and cache
    getInvestigation(activeInvId)
      .then(inv => {
        setInvestigation(inv)
        if (inv.executed_phases?.includes(1)) {
          getPhaseResult(activeInvId, 1).then(setFase1Data).catch(console.error)
        }
        if (inv.executed_phases?.includes(2)) {
          getPhaseResult(activeInvId, 2).then(setFase2Data).catch(console.error)
        }
        if (inv.executed_phases?.includes(3)) {
          getPhaseResult(activeInvId, 3).then(setFase3Data).catch(console.error)
        }
        if (inv.executed_phases?.includes(4)) {
          getPhaseResult(activeInvId, 4).then(setFase4Data).catch(console.error)
        }
        if (inv.executed_phases?.includes(5)) {
          getPhaseResult(activeInvId, 5).then(setFase5Data).catch(console.error)
        }
      })
      .catch(console.error)
  }, [activeInvId])

  const handleRunPhase = async (phaseNum: number) => {
    if (!activeInvId) return
    const res = await runPhase(activeInvId, phaseNum)
    if (phaseNum === 1) setFase1Data(res)
    if (phaseNum === 2) setFase2Data(res)
    if (phaseNum === 3) setFase3Data(res)
    if (phaseNum === 4) setFase4Data(res)
    if (phaseNum === 5) setFase5Data(res)
  }

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* App top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight">NetScope</span>
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              ripe-atlas · path-inflation-lab
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-3" aria-hidden="true" />
            {investigation ? `ID: ${investigation.id}` : "Cargando..."}
          </Badge>
          <Badge variant="outline" className="hidden gap-1.5 font-mono text-[10px] uppercase tracking-wider sm:inline-flex">
            <FileCheck2 className="h-3 w-3" aria-hidden="true" />
            v1.4.0
          </Badge>
          <div className="ml-1 h-5 w-px bg-border" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </header>

      {/* Split layout: collapsible left rail */}
      <div
        className={`grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out ${chatCollapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[30%_1fr]"
          }`}
      >
        {/* Left: AI chat (collapsible) */}
        <div className="hidden h-full min-h-0 overflow-hidden lg:flex">
          <AiChatPanel
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((v) => !v)}
            activeInvId={activeInvId}
          />
        </div>

        {/* Right: main work area */}
        <main className="flex min-h-0 flex-col overflow-y-auto">
          <Tabs defaultValue="fase-4" className="flex flex-col">
            {/* Phase tabs - sticky */}
            <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex items-center gap-4">
                <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground xl:block">
                  Metodología
                </span>
                <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
                  {phases.map((p) => {
                    const Icon = p.icon
                    return (
                      <TabsTrigger
                        key={p.id}
                        value={p.id}
                        className="gap-1.5 px-3 py-1.5 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground data-[state=active]:text-primary">
                          {p.short}:
                        </span>
                        <span>{p.label}</span>
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </div>
            </div>

            {/* Tab contents */}
            <div className="px-6 py-6">
              <TabsContent value="fase-1" className="mt-0">
                {fase1Data ? (
                  <Fase1View data={fase1Data} />
                ) : (
                  <PhasePlaceholder
                    phase="Fase 1"
                    title="Validación de Integridad"
                    description="Verificación de consistencia y completitud de las mediciones de RIPE Atlas antes del análisis estadístico."
                    icon={ShieldCheck}
                    onExecute={() => handleRunPhase(1)}
                  />
                )}
              </TabsContent>
              <TabsContent value="fase-2" className="mt-0">
                {fase2Data ? (
                  <Fase2View data={fase2Data} />
                ) : (
                  <PhasePlaceholder
                    phase="Fase 2"
                    title="Construcción de Línea Base RTT"
                    description="Cálculo de métricas base de latencia por probe y target para identificar el comportamiento normal de la red."
                    icon={Activity}
                    onExecute={() => handleRunPhase(2)}
                  />
                )}
              </TabsContent>
              <TabsContent value="fase-3" className="mt-0">
                {fase3Data ? (
                  <Fase3View data={fase3Data} />
                ) : (
                  <PhasePlaceholder
                    phase="Fase 3"
                    title="Mapeo ASN"
                    description="Asociación de cada hop con su Sistema Autónomo (AS) y propietario para reconstruir la topología lógica."
                    icon={GitBranch}
                    onExecute={() => handleRunPhase(3)}
                  />
                )}
              </TabsContent>
              <TabsContent value="fase-4" className="mt-0">
                {fase4Data ? (
                  <Phase4View data={fase4Data} />
                ) : (
                  <PhasePlaceholder
                    phase="Fase 4"
                    title="Detección de Path Inflation"
                    description="Comparación de trayectorias geográficas vs. lógicas en mediciones para identificar desvíos."
                    icon={Network}
                    onExecute={() => handleRunPhase(4)}
                  />
                )}
              </TabsContent>
              <TabsContent value="fase-5" className="mt-0">
                {fase5Data ? (
                  <Fase5View data={fase5Data} />
                ) : (
                  <PhasePlaceholder
                    phase="Fase 5"
                    title="Análisis de Estabilidad Temporal"
                    description="Evaluación de la persistencia del path inflation a lo largo del tiempo y detección de variaciones de ruta."
                    icon={Radar}
                    onExecute={() => handleRunPhase(5)}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Cargando NetScope...</div>}>
      <PageContent />
    </Suspense>
  )
}
