import { Activity, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"

export function Fase2View({ data }: { data: FaseResponse }) {
  const { metricas_resumen, grafica_png_url } = data
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary">
              <Activity className="h-3 w-3" aria-hidden="true" />
              Fase 2
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">metodología.linea_base</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">Construcción de Línea Base RTT</h2>
          <p className="text-sm text-muted-foreground text-pretty">Cálculo de métricas base de latencia por probe y target para identificar el comportamiento normal de la red.</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Sonda Óptima</span>
            <span className="text-base font-semibold text-foreground">AS-{metricas_resumen.sonda_optima || "N/A"}</span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">RTT Mín.</span>
            <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
              {Number(metricas_resumen.rtt_minimo || 0).toFixed(2)} ms
            </span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">RTT Prom.</span>
            <span className="text-base font-semibold text-foreground">
              {Number(metricas_resumen.rtt_promedio || 0).toFixed(2)} ms
            </span>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">Línea Base RTT por Sonda</CardTitle>
            </div>
            <CardDescription className="text-xs">Gráfico estadístico generado por el motor de R (ggplot2)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5 flex justify-center bg-muted/20">
          {grafica_png_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${baseUrl}${grafica_png_url}`} alt="Gráfico Fase 2" className="max-w-full rounded-md border border-border shadow-sm" />
          ) : (
            <p className="text-sm text-muted-foreground py-10">Imagen no disponible</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
