"use client"

import { useState } from "react"
import { Loader2, type LucideIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/**
 * PhaseEmpty — estado "Esta fase aún no se ha ejecutado" + botón Ejecutar.
 * Reemplaza/alias de PhasePlaceholder con el nombre canónico del contexto.
 */
export function PhaseEmpty({
  phase,
  title,
  description,
  icon: Icon,
  onExecute,
}: {
  phase: string
  title: string
  description: string
  icon: LucideIcon
  onExecute?: () => Promise<void> | void
}) {
  const [loading, setLoading] = useState(false)

  const handleExecute = async () => {
    if (!onExecute) return
    setLoading(true)
    try {
      await onExecute()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary"
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {phase}
          </Badge>
          <span className="font-mono text-[11px] text-muted-foreground">metodología</span>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-balance">{title}</h2>
        <p className="text-sm text-muted-foreground text-pretty">{description}</p>
      </div>

      <Empty className="rounded-lg border border-dashed border-border bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Esta fase aún no se ha ejecutado</EmptyTitle>
          <EmptyDescription>
            Carga las mediciones JSON correspondientes y ejecuta esta etapa de la metodología para
            visualizar los resultados.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" onClick={handleExecute} disabled={loading || !onExecute}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Ejecutando..." : "Ejecutar fase"}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
