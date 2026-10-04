"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, CalendarDays, FilePlus2, ListChecks, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { listInvestigations } from "@/lib/api-client"
import { Investigation } from "@/lib/types"

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha no disponible"

  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function measurementLabel(count: number | undefined): string {
  const safeCount = count ?? 0
  return `${safeCount.toLocaleString("es")} ${safeCount === 1 ? "medicion" : "mediciones"}`
}

export default function Page() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInvestigations = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await listInvestigations()
      setInvestigations(data)
    } catch (e) {
      console.error(e)
      setError("No se pudo cargar la lista de investigaciones.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvestigations()
  }, [])

  return (
    <div className="flex min-h-svh w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight">NetScope</span>
            <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
              investigaciones RIPE Atlas
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Investigaciones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona una investigacion existente o crea una nueva desde un archivo RIPE Atlas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={loadInvestigations} disabled={loading} aria-label="Actualizar lista">
              <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} aria-hidden="true" />
            </Button>
            <Button asChild>
              <Link href="/nueva">
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                Nueva investigacion
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Investigaciones guardadas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">Cargando investigaciones...</div>
            ) : investigations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <p className="text-sm font-medium">No hay investigaciones guardadas.</p>
                <Button asChild>
                  <Link href="/nueva">
                    <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                    Nueva investigacion
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {investigations.map((investigation) => (
                  <Link
                    key={investigation.id}
                    href={`/investigacion/${investigation.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{investigation.name}</span>
                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider">
                          ID {investigation.id}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatDate(investigation.created_at)}
                        </span>
                        <span>{measurementLabel(investigation.measurement_count)}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
