import { Image as ImageIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DEFAULT_SOURCE = "grafico generado desde R/ggplot2 con datos RIPE Atlas"

type ReportPngFigureProps = {
  id: string
  title: string
  url?: string
  alt?: string
  description?: string
  caption?: string
  source?: string
  method?: string
  notes?: string[]
}

function resolveFigureUrl(url: string | undefined, baseUrl: string): string {
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`
}

export function ReportPngFigure({ id, title, url, alt, description, caption, source, method, notes }: ReportPngFigureProps) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  const figureUrl = resolveFigureUrl(url, baseUrl)
  const figureSource = source ?? DEFAULT_SOURCE
  const figureCaption = `${caption ?? `${id}. ${title}.`} Fuente: ${figureSource}.`

  return (
    <figure className="break-inside-avoid">
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base">{id}. {title}.</CardTitle>
            </div>
            <CardDescription className="grid gap-1 text-xs">
              <span>{description ?? "Grafico estadistico generado por R/ggplot2."}</span>
              {method && <span>Metodo: {method}</span>}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center bg-muted/20 pt-5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={figureUrl} alt={alt ?? `${id}. ${title}`} className="max-w-full rounded-md border border-border shadow-sm" />
          ) : (
            <p className="py-10 text-sm text-muted-foreground">Imagen no disponible</p>
          )}
          {notes?.length ? (
            <ul className="mt-3 grid gap-1 self-stretch text-xs text-muted-foreground">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <figcaption className="mt-2 text-center text-xs text-muted-foreground">{figureCaption}</figcaption>
    </figure>
  )
}
