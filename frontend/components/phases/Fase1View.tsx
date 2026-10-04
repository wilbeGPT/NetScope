import { ShieldCheck } from "lucide-react"

import { ElementRenderer } from "./ElementRenderer"
import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"

export function Fase1View({ data }: { data: FaseResponse }) {
  const elements = data.elements || []
  const { metricas_resumen } = data

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-7 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary"
            >
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Fase 1
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">seccion 4.1 - integridad</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-balance">
            Validacion de Integridad y Disponibilidad
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Replica el formato de informe de la investigacion: alcance del conjunto de datos, embudo de disponibilidad y detalle por categoria de destino.
          </p>
        </div>

        {metricas_resumen && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 font-mono text-[11px] text-muted-foreground sm:mt-0">
            <div className="flex flex-col">
              <span className="uppercase tracking-wider">Intentos</span>
              <span className="text-base font-semibold text-foreground">
                {Number(metricas_resumen.total_intentos || 0).toLocaleString("es")}
              </span>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="uppercase tracking-wider">Ruta completa</span>
              <span className="text-base font-semibold text-foreground">
                {Number(metricas_resumen.ruta_completa || 0).toLocaleString("es")}
              </span>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="uppercase tracking-wider">Disponibilidad</span>
              <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
                {Number(metricas_resumen.disponibilidad_pct || 0).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {elements.map((el, idx) => (
          <ElementRenderer key={`${el.type}-${el.id}-${idx}`} element={el} />
        ))}
      </div>
    </div>
  )
}
