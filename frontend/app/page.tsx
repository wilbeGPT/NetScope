"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  FilePlus2,
  ListChecks,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
  deleteInvestigation,
  listInvestigations,
  updateInvestigation,
} from "@/lib/api-client"
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
  return `${safeCount.toLocaleString("es")} ${safeCount === 1 ? "medición" : "mediciones"}`
}

export default function Page() {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para Cambiar Nombre
  const [renameTarget, setRenameTarget] = useState<Investigation | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [savingRename, setSavingRename] = useState(false)

  // Estados para Eliminar
  const [deleteTarget, setDeleteTarget] = useState<Investigation | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const openRename = (inv: Investigation) => {
    setRenameTarget(inv)
    setRenameValue(inv.name)
  }

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameTarget) return
    const trimmed = renameValue.trim()
    if (!trimmed) {
      toast.error("El nombre no puede estar vacío")
      return
    }

    setSavingRename(true)
    try {
      const updated = await updateInvestigation(renameTarget.id, trimmed)
      setInvestigations((prev) =>
        prev.map((i) => (i.id === renameTarget.id ? { ...i, name: updated.name } : i))
      )
      toast.success("Nombre actualizado con éxito")
      setRenameTarget(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || "Error al actualizar el nombre")
    } finally {
      setSavingRename(false)
    }
  }

  const openDelete = (inv: Investigation) => {
    setDeleteTarget(inv)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteInvestigation(deleteTarget.id)
      setInvestigations((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      toast.success(`Investigación "${deleteTarget.name}" eliminada`)
      setDeleteTarget(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || "Error al eliminar la investigación")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="app-shell flex min-h-svh w-full flex-col">
      <header className="workspace-header flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="workspace-logo flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BarChart3 className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">NetScope</span>
            <span className="hidden font-mono text-[11px] text-muted-foreground md:inline">
              investigaciones RIPE Atlas
            </span>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Espacio de trabajo
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              Investigaciones
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Selecciona una investigación existente, actualiza su nombre, elimínala o crea una nueva desde un archivo RIPE Atlas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadInvestigations}
              disabled={loading}
              aria-label="Actualizar lista"
              className="active:scale-95 transition-transform"
            >
              <RefreshCw
                className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"}
                aria-hidden="true"
              />
            </Button>
            <Button asChild className="active:scale-98 transition-transform">
              <Link href="/nueva">
                <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                Nueva investigación
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="investigation-library gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
          <CardHeader className="flex-row items-center justify-between border-b px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Investigaciones guardadas
            </CardTitle>
            <span className="font-mono text-[11px] text-muted-foreground">
              {investigations.length} {investigations.length === 1 ? "registrada" : "registradas"}
            </span>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Cargando investigaciones...
              </div>
            ) : investigations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <p className="text-sm font-medium">No hay investigaciones guardadas.</p>
                <Button asChild className="mt-2">
                  <Link href="/nueva">
                    <FilePlus2 className="h-4 w-4" aria-hidden="true" />
                    Nueva investigación
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {investigations.map((investigation) => (
                  <div
                    key={investigation.id}
                    className="group/item flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                  >
                    {/* Área de enlace que navega a la investigación */}
                    <Link
                      href={`/investigacion/${investigation.id}`}
                      className="min-w-0 flex-1 space-y-1.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium group-hover/item:text-primary transition-colors">
                          {investigation.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] uppercase tracking-wider"
                        >
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
                    </Link>

                    {/* Acciones: Cambiar nombre, Eliminar, Abrir */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          openRename(investigation)
                        }}
                        title="Cambiar nombre"
                        aria-label={`Cambiar nombre de ${investigation.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          openDelete(investigation)
                        }}
                        title="Eliminar investigación"
                        aria-label={`Eliminar ${investigation.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
                      >
                        <Link
                          href={`/investigacion/${investigation.id}`}
                          title="Abrir investigación"
                          aria-label={`Abrir ${investigation.name}`}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal / Diálogo para Cambiar Nombre */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Pencil className="h-4 w-4 text-primary" />
              Cambiar nombre de la investigación
            </DialogTitle>
            <DialogDescription>
              Asigna un nombre descriptivo para identificar fácilmente esta medición.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                htmlFor="rename-input"
                className="text-xs font-medium text-muted-foreground"
              >
                Nuevo nombre
              </label>
              <Input
                id="rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Ej: Análisis UFG - Semana 1"
                autoFocus
                disabled={savingRename}
                className="h-10 text-sm"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenameTarget(null)}
                disabled={savingRename}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingRename || !renameValue.trim()}
              >
                {savingRename ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación para Eliminar */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base">
              <Trash2 className="h-4 w-4" />
              ¿Eliminar investigación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              Esta acción eliminará permanentemente la investigación{" "}
              <strong className="text-foreground font-semibold">
                "{deleteTarget?.name}"
              </strong>{" "}
              (ID {deleteTarget?.id}) y todos los resultados de las fases calculadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar definitivamente"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
