import { Radar, Image as ImageIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FaseResponse } from "@/lib/types"

export function Fase5View({ data }: { data: FaseResponse }) {
  const { grafica_png_url } = data
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5 border-primary/30 bg-primary/5 font-mono text-[10px] uppercase tracking-wider text-primary">
              <Radar className="h-3 w-3" aria-hidden="true" />
              Fase 5
            </Badge>
            <span className="font-mono text-[11px] text-muted-foreground">metodología.estabilidad</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-balance">Análisis de Estabilidad Temporal</h2>
          <p className="text-sm text-muted-foreground text-pretty">Evaluación de la persistencia del path inflation a lo largo del tiempo y detección de variaciones de ruta.</p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">Distribución del Jitter Temporal</CardTitle>
            </div>
            <CardDescription className="text-xs">Gráfico estadístico generado por el motor de R (ggplot2)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5 flex justify-center bg-muted/20">
          {grafica_png_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${baseUrl}${grafica_png_url}`} alt="Gráfico Fase 5" className="max-w-full rounded-md border border-border shadow-sm" />
          ) : (
            <p className="text-sm text-muted-foreground py-10">Imagen no disponible</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
