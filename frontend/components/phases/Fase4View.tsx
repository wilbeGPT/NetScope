import { Network } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"
import { ElementRenderer } from "./ElementRenderer"

export function Fase4View({ data }: { data: FaseResponse }) {
  const elements = data?.elements || []
  const providers = data?.metricas_resumen?.probes ?? 0
  const targets = data?.metricas_resumen?.targets ?? 0
  const anomalias = data?.metricas_resumen?.anomalias ?? 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary"
            >
              <Network className="h-3 w-3" aria-hidden="true" />
              Fase 4
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">seccion 4.4 - path_inflation</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">Deteccion de Path Inflation</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Comparacion de trayectorias logicas en RIPE Atlas para identificar saltos con delta RTT superior a 20 ms.
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Proveedores</span>
            <span className="text-base font-semibold text-foreground">{Number(providers).toLocaleString("es")}</span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Destinos</span>
            <span className="text-base font-semibold text-foreground">{Number(targets).toLocaleString("es")}</span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Anomalias</span>
            <span className="text-base font-semibold text-red-600 dark:text-red-400">{Number(anomalias).toLocaleString("es")}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {elements.map((el, idx) => (
          <ElementRenderer key={`${el.type}-${el.id}-${idx}`} element={el} />
        ))}
      </div>
    </div>
  )
}