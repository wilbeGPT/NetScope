"use client"

import { Activity, BarChart3, FileText, GitBranch, Network, Radar, ShieldCheck, type LucideIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const phases: { id: string; short: string; label: string; icon: LucideIcon }[] = [
  { id: "reporte", short: "Reporte", label: "Academico", icon: FileText },
  { id: "fase-1", short: "Fase 1", label: "Integridad", icon: ShieldCheck },
  { id: "fase-2", short: "Fase 2", label: "Linea Base", icon: Activity },
  { id: "fase-3", short: "Fase 3", label: "Mapeo ASN", icon: GitBranch },
  { id: "fase-4", short: "Fase 4", label: "Path Inflation", icon: Network },
  { id: "fase-5", short: "Fase 5", label: "Estabilidad", icon: Radar },
]

export function PhaseNav() {
  return (
    <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:static print:px-0">
      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground xl:block">
          Metodologia
        </span>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1 print:hidden">
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
  )
}