import { Activity, Maximize2, Network, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RttLineChart } from "@/components/rtt-line-chart"
import { JitterBoxPlot } from "@/components/jitter-box-plot"
import { CriticalNodesTable } from "@/components/critical-nodes-table"
import { FaseResponse } from "@/lib/types"

export function Phase4View({ data }: { data?: FaseResponse }) {
  const probes = data?.metricas_resumen.probes ?? 42
  const targets = data?.metricas_resumen.targets ?? 187
  const anomalias = data?.metricas_resumen.anomalias ?? 9

  return (
    <div className="flex flex-col gap-5">
      {/* Phase header */}
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
            <span className="font-mono text-[11px] text-muted-foreground">
              metodología.path_inflation
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">
            Detección de Path Inflation
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Comparación de trayectorias geográficas vs. lógicas en mediciones RIPE Atlas para
            identificar desvíos hacia el backbone internacional.
          </p>
        </div>
        <div className="flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Probes</span>
            <span className="text-base font-semibold text-foreground">{probes}</span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Targets</span>
            <span className="text-base font-semibold text-foreground">{targets}</span>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="uppercase tracking-wider">Anomalías</span>
            <span className="text-base font-semibold text-red-600 dark:text-red-400">{anomalias}</span>
          </div>
        </div>
      </div>

      {/* Top: charts grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* RTT por hop por ISP */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">RTT por hop por ISP</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Eje X: número de hop · Eje Y: RTT promedio (ms)
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Expandir gráfico">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <RttLineChart data={data?.series_chart} />
          </CardContent>
        </Card>

        {/* Distribución del Jitter por ISP */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Activity className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">Distribución del Jitter por ISP</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Box plot · cuartiles, mediana y outliers (ms)
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Expandir gráfico">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <JitterBoxPlot stats={data?.boxplot || undefined} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom: critical nodes table */}
      <Card>
        <CardHeader className="flex flex-col gap-2 border-b border-border sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">Nodos críticos con geolocalización</CardTitle>
            <CardDescription className="text-xs">
              Hops responsables del path inflation observado, agrupados por ISP y propietario del AS.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Local SV
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
              Tránsito regional
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
              Backbone internacional
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <CriticalNodesTable nodes={data?.tabla} />
        </CardContent>
      </Card>
    </div>
  )
}
