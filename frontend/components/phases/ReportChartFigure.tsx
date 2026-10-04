import { ReactNode } from "react"

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
    <figure className="break-inside-avoid w-full">
      <Card className="report-surface w-full">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center gap-2 text-base"><span className="h-2 w-2 rounded-full bg-primary" />Figura {id}. {title}.</CardTitle>
          <CardDescription className="grid gap-1 text-xs">
            <span>{description}</span>
            {method && <span>Metodo: {method}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 w-full">
          {children}
          {notes?.length ? (
            <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <figcaption className="mt-2 px-1 text-xs text-muted-foreground">{figureCaption}</figcaption>
    </figure>
  )
}
