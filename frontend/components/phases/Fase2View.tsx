import { Activity } from "lucide-react"

import { ElementRenderer } from "./ElementRenderer"
import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"

export function Fase2View({ data }: { data: FaseResponse }) {
  const elements = data.elements || []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary">
              <Activity className="h-3 w-3" aria-hidden="true" />
              Fase 2
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">seccion 4.2 - linea_base</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">Construccion de Linea Base RTT</h2>
          <p className="text-sm text-muted-foreground text-pretty">Calculo de metricas base de latencia por proveedor/ASN para identificar el comportamiento normal de la red.</p>
        </div>
      </div>

        {elements.map((el, idx) => (
          <ElementRenderer key={`${el.type}-${el.id}-${idx}`} element={el} />
        ))}
    </div>
  )
}