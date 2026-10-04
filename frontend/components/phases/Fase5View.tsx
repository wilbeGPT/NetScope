import { Radar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"
import { ElementRenderer } from "./ElementRenderer"

export function Fase5View({ data }: { data: FaseResponse }) {
  const elements = data.elements || []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary"
            >
              <Radar className="h-3 w-3" aria-hidden="true" />
              Fase 5
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              seccion 4.5 - estabilidad
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">
            Analisis de Estabilidad Temporal
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Evaluacion de RTT por hora, evolucion diaria, franjas horarias, dia de semana y dispersion temporal.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {elements.map((el, idx) => (
          <ElementRenderer key={`${el.type}-${el.id}-${idx}`} element={el} />
        ))}
      </div>
    </div>
  )
}