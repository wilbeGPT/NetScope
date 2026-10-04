"use client"

import { Download, Printer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaseResponse, Investigation, ReportTemplate, ReportElement } from "@/lib/types"

import { ElementRenderer } from "@/components/phases/ElementRenderer"

type ReportViewProps = {
  investigation: Investigation | null
  reportTemplate?: ReportTemplate | null
  fase1Data: FaseResponse | null
  fase2Data: FaseResponse | null
  fase3Data: FaseResponse | null
  fase4Data: FaseResponse | null
  fase5Data: FaseResponse | null
}

function MissingPhase({ phase, title }: { phase: string; title: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-base">{phase}. {title}</CardTitle>
        <CardDescription>Esta seccion aun no tiene resultados ejecutados para incluir en el reporte.</CardDescription>
      </CardHeader>
    </Card>
  )
}


export function ReportView({ investigation, reportTemplate, ...fases }: ReportViewProps) {
  const phaseData = [
    fases.fase1Data,
    fases.fase2Data,
    fases.fase3Data,
    fases.fase4Data,
    fases.fase5Data,
  ]
  
  const chapters = reportTemplate?.chapters ?? []
  const completed = phaseData.filter(Boolean).length

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <Card className="overflow-hidden border-primary/20 bg-primary/5 print:border-none print:bg-transparent print:shadow-none">
        <CardHeader className="flex flex-col gap-4 border-b border-border sm:flex-row sm:items-start sm:justify-between print:border-b">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-primary">Reporte academico NetScope</p>
            <CardTitle className="text-2xl tracking-tight">Analisis de Path Inflation con mediciones RIPE Atlas</CardTitle>
            <CardDescription>
              {investigation ? `${investigation.name} - ID ${investigation.id}` : "Investigacion en carga"} - {completed}/{chapters.length || 7} fases incluidas.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir / PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider">Fecha de creacion</span>
            <span className="text-foreground">{investigation?.created_at ? new Date(investigation.created_at).toLocaleString("es") : "N/D"}</span>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-wider">Estructura</span>
            <span className="text-foreground">{chapters.length} capitulos desde plantilla estructural.</span>
          </div>
        </CardContent>
      </Card>

      {chapters.length > 0 && (
        <Card className="break-inside-avoid print:hidden">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Indice de Contenidos</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <nav className="flex flex-col gap-2">
              {chapters.map(ch => (
                <a key={ch.chapter} href={`#chapter-${ch.chapter}`} className="text-sm font-medium hover:underline text-primary">
                  {ch.chapter}. {ch.title}
                </a>
              ))}
            </nav>
          </CardContent>
        </Card>
      )}

      {chapters.length > 0 ? chapters.map(ch => {
        const data = phaseData[ch.chapter - 1]
        const hasElements = data?.elements && data.elements.length > 0
        
        return (
          <section id={`chapter-${ch.chapter}`} key={ch.chapter} className="flex flex-col gap-5 break-inside-avoid scroll-mt-20">
            <h2 className="text-xl font-bold border-b pb-2">{ch.chapter}. {ch.title}</h2>
            {hasElements ? (
              data.elements!.map(el => <ElementRenderer key={`${el.type}-${el.id}`} element={el} />)
            ) : (
              <MissingPhase phase={ch.chapter.toString()} title={ch.title} />
            )}
          </section>
        )
      }) : (
        <div className="p-8 text-center text-muted-foreground">Cargando plantilla del reporte...</div>
      )}
    </div>
  )
}
