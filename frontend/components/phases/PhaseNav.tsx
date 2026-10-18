"use client"

import { Activity, FileText, GitBranch, Loader2, Network, Radar, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const phases: { id: string; short: string; label: string; icon: LucideIcon }[] = [
  { id: "reporte", short: "Reporte", label: "Académico", icon: FileText },
  { id: "fase-1", short: "Fase 1", label: "Integridad", icon: ShieldCheck },
  { id: "fase-2", short: "Fase 2", label: "Línea Base", icon: Activity },
  { id: "fase-3", short: "Fase 3", label: "Mapeo ASN", icon: GitBranch },
  { id: "fase-4", short: "Fase 4", label: "Path Inflation", icon: Network },
  { id: "fase-5", short: "Fase 5", label: "Estabilidad", icon: Radar },
]

export interface PhaseNavProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  onRunAllPhases?: () => Promise<void> | void
  isRunningAll?: boolean
  runningPhaseNum?: number | null
  pipelineProgress?: string
}

export function PhaseNav({
  activeTab = "reporte",
  onTabChange,
  onRunAllPhases,
  isRunningAll = false,
  runningPhaseNum = null,
  pipelineProgress = "",
}: PhaseNavProps) {
  return (
    <div className="phase-navigation sticky top-0 z-10 border-b border-border px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6 print:static print:px-0">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground xl:block">
            Módulos
          </span>
          <TabsList className="h-auto flex-nowrap justify-start gap-1 overflow-x-auto bg-transparent p-0 print:hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {phases.map((p) => {
              const Icon = p.icon
              const isPhaseRunning = isRunningAll && runningPhaseNum !== null && p.id === `fase-${runningPhaseNum}`
              const isActive = activeTab === p.id
              return (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  onClick={() => onTabChange?.(p.id)}
                  className="group shrink-0 gap-1.5 rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition-all duration-150 hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm active:scale-[0.98] transition-transform duration-100 cursor-pointer select-none"
                >
                  {isPhaseRunning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className={`font-mono text-[10px] uppercase tracking-wider transition-colors ${isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-foreground"}`}>
                    {p.short}:
                  </span>
                  <span>{p.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <div className="flex shrink-0 items-center print:hidden">
          {isRunningAll ? (
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-xs animate-pulse">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] font-medium tracking-tight tabular-nums truncate max-w-[180px] sm:max-w-none">
                {pipelineProgress || "Ejecutando análisis..."}
              </span>
              {runningPhaseNum !== null && (
                <span className="hidden sm:inline-flex items-center justify-center rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-mono tabular-nums leading-none">
                  {runningPhaseNum}/5
                </span>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRunAllPhases?.()}
              disabled={isRunningAll || !onRunAllPhases}
              className="gap-1.5 font-medium text-xs border-primary/30 hover:bg-primary/10 hover:text-primary active:scale-[0.98] transition-all duration-100 shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="hidden sm:inline">Ejecutar Análisis Completo</span>
              <span className="sm:hidden">Ejecutar Todo</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
