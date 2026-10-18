import { ReactNode } from "react"
import { BarChart3 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_SOURCE = "elaboracion propia con datos procesados por NetScope desde RIPE Atlas"

type ReportChartFigureProps = {
  id: string
  title: string
  description: string
  caption?: string
  source?: string
  method?: string
  notes?: string[]
  children: ReactNode
}

export function ReportChartFigure({ id, title, description, caption, source, method, notes, children }: ReportChartFigureProps) {
  const figureSource = source ?? DEFAULT_SOURCE
  const figureCaption = `${caption ?? `Figura ${id}. ${title}.`} Fuente: ${figureSource}.`

  return (
    <figure className="break-inside-avoid w-full print:my-6 print:break-inside-avoid print:block">
      <Card className="report-surface border border-border/50 transition-all duration-200 hover:border-border/80 w-full print:border-none print:shadow-none print:bg-transparent print:p-0 print:rounded-none print:block print:break-inside-avoid">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border print:p-0 print:border-none print:mb-2 print:block">
          <div className="flex flex-col gap-1 print:block">
            <div className="flex items-center gap-2 print:gap-0 print:block">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary print:hidden">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-semibold print:text-[11pt] print:font-bold print:text-black">Figura {id}. {title}.</CardTitle>
            </div>
            <CardDescription className="grid gap-1 text-xs print:text-[9pt] print:text-gray-700 print:block">
              <span>{description}</span>
              {method && <span>Metodo: {method}</span>}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-5 w-full print:p-0 print:pt-1 print:block">
          {children}
          {notes?.length ? (
            <ul className="mt-3 grid gap-1 text-xs text-muted-foreground print:text-[8.5pt] print:text-gray-600 print:block">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <figcaption className="mt-2 text-left px-1 text-xs text-muted-foreground print:text-[9pt] print:italic print:text-gray-700 print:mt-1.5 print:block">{figureCaption}</figcaption>
    </figure>
  )
}
