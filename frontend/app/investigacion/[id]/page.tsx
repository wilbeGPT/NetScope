"use client"

import { Suspense } from "react"
import { ChatPanel } from "@/components/layout/ChatPanel"
import { PhasePanel } from "@/components/layout/PhasePanel"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { BarChart3, FileCheck2 } from "lucide-react"
import { useInvestigation } from "./useInvestigation"

/**
 * Layout principal de investigación — ruta dinámica /investigacion/[id]
 * Corresponde al diseño de referencia con panel izquierdo (Chat) + panel derecho (Fases).
 */
function InvestigacionContent({ id }: { id: number }) {
  const {
    investigation,
    chatCollapsed,
    setChatCollapsed,
    fase1Data, fase2Data, fase3Data, fase4Data, fase5Data,
    handleRunPhase,
  } = useInvestigation(id)

  return (
    <div className="flex h-svh w-full flex-col bg-background">
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

      <div
        className={`grid min-h-0 flex-1 grid-cols-1 transition-[grid-template-columns] duration-300 ease-in-out ${
          chatCollapsed ? "lg:grid-cols-[56px_1fr]" : "lg:grid-cols-[30%_1fr]"
        }`}
      >
        <div className="hidden h-full min-h-0 overflow-hidden lg:flex">
          <ChatPanel
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((v) => !v)}
            activeInvId={id}
          />
        </div>
        <PhasePanel
          fase1Data={fase1Data}
          fase2Data={fase2Data}
          fase3Data={fase3Data}
          fase4Data={fase4Data}
          fase5Data={fase5Data}
          onRunPhase={handleRunPhase}
        />
      </div>
    </div>
  )
}

export default function InvestigacionPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex h-svh items-center justify-center text-sm text-muted-foreground">Cargando investigación...</div>}>
      <InvestigacionContent id={parseInt(params.id, 10)} />
    </Suspense>
  )
}
