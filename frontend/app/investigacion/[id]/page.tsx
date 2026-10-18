"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import { ChatPanel } from "@/components/layout/ChatPanel"
import { PhasePanel } from "@/components/layout/PhasePanel"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { BarChart3, ChevronRight, Layers3 } from "lucide-react"
import { useInvestigation } from "./useInvestigation"

function parseInvestigationId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (!rawValue || !/^\d+$/.test(rawValue)) return null

  const parsed = Number.parseInt(rawValue, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function InvestigacionContent({ id }: { id: number }) {
  const {
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
  } = useInvestigation(id)

  return (
    <div className="app-shell flex h-svh w-full flex-col">
      <header className="workspace-header flex h-16 shrink-0 items-center justify-between border-b border-border px-4 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="workspace-logo flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold tracking-tight">NetScope</span>
            <span className="hidden items-center gap-1 font-mono text-[10px] text-muted-foreground sm:flex">
              Investigaciones <ChevronRight className="h-3 w-3" /> RIPE Atlas
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-[10px] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-3" aria-hidden="true" />
            {investigation ? `ID: ${investigation.id}` : "Cargando..."}
          </Badge>
          <Badge variant="outline" className="hidden gap-1.5 font-mono text-[10px] uppercase tracking-wider md:inline-flex">
            <Layers3 className="h-3 w-3" aria-hidden="true" />
            Investigación
          </Badge>
          <div className="ml-1 h-5 w-px bg-border" aria-hidden="true" />
          <ThemeToggle />
        </div>
      </header>

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out ${
          chatCollapsed ? "lg:grid-cols-[56px_minmax(0,1fr)]" : "lg:grid-cols-[340px_minmax(0,1fr)]"
        }`}
      >
        <div className="hidden h-full min-h-0 overflow-hidden lg:flex">
          <ChatPanel
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((v) => !v)}
            activeInvId={id}
          />
        </div>
        <div className="workspace-main flex min-h-0 overflow-hidden">
          <PhasePanel
            investigation={investigation}
            reportTemplate={reportTemplate}
            fase1Data={fase1Data}
            fase2Data={fase2Data}
            fase3Data={fase3Data}
            fase4Data={fase4Data}
            fase5Data={fase5Data}
            onRunPhase={handleRunPhase}
            onRunAllPhases={handleRunAllPhases}
            isRunningAll={isRunningAll}
            runningPhaseNum={runningPhaseNum}
            pipelineProgress={pipelineProgress}
          />
        </div>
      </div>
    </div>
  )
}

export default function InvestigacionPage() {
  const params = useParams<{ id: string }>()
  const id = parseInvestigationId(params?.id)

  return (
    <Suspense fallback={<div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Cargando investigacion...</div>}>
      {id ? (
        <InvestigacionContent id={id} />
      ) : (
        <div className="flex h-svh items-center justify-center text-sm text-muted-foreground">
          ID de investigacion invalido.
        </div>
      )}
    </Suspense>
  )
}
