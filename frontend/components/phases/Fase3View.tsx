import { GitBranch } from "lucide-react"

import { ElementRenderer } from "./ElementRenderer"
import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"

export function Fase3View({ data }: { data: FaseResponse }) {
  const elements = data.elements || []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary">
              <GitBranch className="h-3 w-3" aria-hidden="true" />
              Fase 3
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">
              seccion 4.3 - mapeo_asn
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">
            Mapeo de Proveedores y ASNs
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Inventario de proveedores, ASNs, origenes, hops publicos/privados y destinos observados.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {elements.map((el, i) => (
          <ElementRenderer key={`${el.type}-${el.id}-${i}`} element={el} />
        ))}
      </div>
    </div>
  )
}