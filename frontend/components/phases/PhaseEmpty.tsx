"use client"

import { useState } from "react"
import { Loader2, Sparkles, type LucideIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

/**
 * PhaseEmpty - estado "Esta fase aun no se ha ejecutado" + botones de ejecucion individual y pipeline completo.
 */
export function PhaseEmpty({
  phase,
  title,
  description,
  icon: Icon,
  onExecute,
  onRunAll,
  isRunningAll = false,
}: {
  phase: string
  title: string
  description: string
  icon: LucideIcon
  onExecute?: () => Promise<void> | void
  onRunAll?: () => Promise<void> | void
  isRunningAll?: boolean
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
    <div className="flex flex-col gap-6">
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
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
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
        <EmptyContent className="flex flex-wrap items-center justify-center gap-3">
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={loading || isRunningAll || !onExecute}
            className="active:scale-[0.98] transition-transform duration-100"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Ejecutando..." : `Ejecutar ${phase}`}
          </Button>

          {onRunAll && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRunAll()}
              disabled={loading || isRunningAll}
              className="gap-2 border-primary/30 hover:bg-primary/5 active:scale-[0.98] transition-transform duration-100"
            >
              {isRunningAll ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Ejecutando pipeline...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Ejecutar todas las fases (1 a 5)</span>
                </>
              )}
            </Button>
          )}
        </EmptyContent>
      </Empty>
    </div>
  )
}
