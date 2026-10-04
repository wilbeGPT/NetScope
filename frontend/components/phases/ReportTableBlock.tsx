import { Database } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportTable } from "@/lib/types"

const DEFAULT_SOURCE = "elaboracion propia con datos procesados por NetScope desde RIPE Atlas"

function formatValue(value: string | number): string {
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString("es") : value.toFixed(2)
  return value
}

function rowTone(tableId: string, row: Record<string, string | number>, index: number): string {
  const value = Number(row["Delta (ms)"] ?? row["Overhead Path Inflation (ms)"] ?? row["Delta pico vs valle"] ?? row["Jitter promedio"] ?? row["Mediana RTT"])
  const mark = String(row["Marca"] ?? "")

  if (mark.includes("Mayor")) return "bg-red-500/10"
  if (mark.includes("Menor")) return "bg-emerald-500/10"
  if (["1", "3", "4", "5"].includes(tableId) && Number.isFinite(value)) {
    if (value > 80 || (tableId === "5" && value > 2)) return "bg-red-500/10"
    if (value > 60 || (tableId === "4" && value > 1) || (tableId === "5" && value > 1)) return "bg-amber-500/10"
    return "bg-emerald-500/10"
  }
  if (tableId === "2") {
    const country = String(row["Pais"] ?? "")
    if (["ES", "SE", "US", "EU", "PE"].includes(country)) return "bg-red-500/10"
    if (["LATAM", "CAM"].includes(country)) return "bg-amber-500/10"
    if (country === "SV") return "bg-emerald-500/10"
  }
  return index % 2 === 0 ? "bg-transparent" : "bg-white/[0.025]"
}

function isNumericColumn(column: string): boolean {
  return /RTT|Hop|Delta|Jitter|StdDev|p95|paquetes|traceroutes|n |Mediana|Promedio|Max|Min|Q\d/i.test(column)
}

export function ReportTableBlock({ table }: { table: ReportTable & { type?: string } }) {
  const source = table.source ?? DEFAULT_SOURCE
  const prefix = table.type === "CHART" ? "Figura" : "Tabla"
  const caption = table.caption ?? `${prefix} ${table.id}. ${table.title}. Fuente: ${source}.`

  return (
    <Card className="report-surface break-inside-avoid w-full">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4 text-primary" aria-hidden="true" />
          {prefix} {table.id}. {table.title}
        </CardTitle>
        <CardDescription className="grid gap-1 text-xs">
          <span>Fuente: {source}.</span>
          {table.method && <span>Metodo: {table.method}</span>}
          {table.unit && <span>Unidad: {table.unit}</span>}
          {typeof table.sample_size === "number" && <span>Muestra: {table.sample_size.toLocaleString("es")} registros.</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="report-table">
          <table aria-label={`Tabla ${table.id}. ${table.title}`} className="w-full border-collapse font-sans text-[12px] text-foreground">
            <caption className="caption-bottom px-3 py-3 text-left text-xs text-muted-foreground">{caption}</caption>
            <thead>
              <tr className="bg-primary/15 text-foreground">
                {(table.columns || []).map((column) => (
                  <th key={column} className={`border-b border-border px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider ${isNumericColumn(column) ? "text-right" : "text-left"}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={index} className={`${rowTone(String(table.id), row, index)} transition-colors hover:bg-primary/10`}>
                  {(table.columns || []).map((column) => (
                    <td key={column} className={`max-w-[360px] whitespace-normal border-b border-border/80 px-4 py-3 align-middle ${isNumericColumn(column) ? "text-right font-mono tabular-nums" : "text-left"}`}>
                      {formatValue(row[column] ?? "N/D")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {table.notes?.length ? (
          <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
            {table.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ReportTables({ tables = [] }: { tables?: ReportTable[] }) {
  if (!tables.length) return null
  return (
    <>
      {tables.map((table) => (
        <ReportTableBlock key={table.id} table={table} />
      ))}
    </>
  )
}
