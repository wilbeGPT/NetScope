"use client"

import { useState, useMemo, useCallback } from "react"
import { Database, Copy, Check, Search, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ReportTable } from "@/lib/types"

const DEFAULT_SOURCE = "elaboracion propia con datos procesados por NetScope desde RIPE Atlas"

function isNumericColumn(column: string): boolean {
  return /RTT|TTR|Hop|Delta|Overhead|Exceso|Jitter|StdDev|p95|paquetes|traceroutes|n |Mediana|Promedio|Max|Min|Q\d|Muestra|Porcentaje|Loss|Desviación|Varianza|Ms|Mediciones|Sondas/i.test(
    column
  )
}

function isMonospaceColumn(column: string): boolean {
  return /ASN|IP|Hop|Prefijo|Prefix|Sonda|Probe|Hash|DNS/i.test(column) || isNumericColumn(column)
}

function isIpOrAsnValue(val: unknown): boolean {
  if (typeof val !== "string") return false
  const s = val.trim()
  return (
    /^(\d{1,3}\.){3}\d{1,3}(\/\d+)?$/.test(s) ||
    /^AS\d+/i.test(s) ||
    /^[0-9a-fA-F:]{4,}$/.test(s)
  )
}

function formatValue(value: string | number): string {
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString("es") : value.toFixed(2)
  return String(value)
}

const ISP_META: Record<string, { dot: string }> = {
  "Claro SV": { dot: "bg-red-500" },
  "Movistar SV": { dot: "bg-blue-500" },
  "Liberty SV": { dot: "bg-cyan-500" },
  "Conective SV": { dot: "bg-emerald-500" },
  "UCA": { dot: "bg-amber-500" },
  "UES": { dot: "bg-purple-500" },
  "Navega GT": { dot: "bg-fuchsia-500" },
  "Globalnet HN": { dot: "bg-slate-500" },
}

function cleanIspName(name: string): string {
  if (!name) return ""
  const upper = name.toUpperCase()
  if (upper.includes("CLARO") || upper.includes("GUATEMALA") || upper.includes("CTE") || upper.includes("AS14754")) return "Claro SV"
  if (upper.includes("CONECTIVE") || upper.includes("AS264635")) return "Conective SV"
  if (upper.includes("GLOBALNET") || upper.includes("AS27729")) return "Globalnet HN"
  if (upper.includes("LIBERTY") || upper.includes("COLUMBUS") || upper.includes("AS262199")) return "Liberty SV"
  if (upper.includes("TELEFONICA") || upper.includes("MOVISTAR") || upper.includes("AS12127")) return "Movistar SV"
  if (upper.includes("NAVEGA") || upper.includes("TIGO") || upper.includes("AS26617")) return "Navega GT"
  if (upper.includes("CENTROAMERICANA") || upper.includes("UCA") || upper.includes("AS61502")) return "UCA"
  if (upper.includes("UNIVERSIDAD DE EL SALVADOR") || upper === "UES" || upper.includes("AS264720")) return "UES"
  return name
}

function isSummaryRow(row: Record<string, any>): boolean {
  if (!row) return false
  return Object.values(row).some((val) => {
    if (typeof val !== "string") return false
    const s = val.trim().toUpperCase()
    return s === "TOTAL" || s === "GLOBAL (TODOS)"
  })
}

function renderCellContent(column: string, rawValue: string | number | undefined, row?: Record<string, any>) {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return <span className="font-mono text-[11px] text-muted-foreground/50 italic">N/D</span>
  }
  if (rawValue === "-") {
    return <span className="font-mono text-[11px] text-muted-foreground/60">-</span>
  }

  const formatted = formatValue(rawValue)
  const isRowSummary = row ? isSummaryRow(row) : false

  // 1. ISP / Proveedor
  if (/^(ISP|Proveedor|ISP\s*\/\s*Proveedor)$/i.test(column)) {
    const rawStr = String(rawValue).trim()
    if (rawStr.toUpperCase() === "TOTAL" || rawStr.toLowerCase().includes("global")) {
      return (
        <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{rawStr}</span>
        </span>
      )
    }
    const clean = cleanIspName(rawStr)
    const meta = ISP_META[clean]
    if (meta) {
      return (
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot} ring-2 ring-current/20`} />
          <span>{clean}</span>
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground/90">
        <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400/60" />
        <span>{rawStr}</span>
      </span>
    )
  }

  // 2. País / País Registro
  if (/^Pais/i.test(column)) {
    const country = String(rawValue).trim().toUpperCase()
    if (country === "SV") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 inline-block" />
          SV (Local)
        </span>
      )
    }
    if (country && country !== "N/D" && country !== "-") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 inline-block" />
          {country} (Int.)
        </span>
      )
    }
  }

  // 3. Cambio de IP (Episodios de corte)
  if (/Cambio de IP/i.test(column)) {
    const valStr = String(rawValue).trim().toLowerCase()
    if (valStr === "si" || valStr === "sí" || valStr === "true") {
      return (
        <span className="inline-flex items-center rounded-md bg-purple-500/15 px-2 py-0.5 font-sans text-[11px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/30">
          Sí (Dinámica)
        </span>
      )
    }
    if (valStr === "no" || valStr === "false") {
      return (
        <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 font-sans text-[11px] font-medium text-muted-foreground border border-border/40">
          No (Fija)
        </span>
      )
    }
  }

  // 4. Marca (Mayor / Menor mediana)
  if (column === "Marca") {
    const mark = String(rawValue)
    if (mark.includes("Mayor")) {
      return (
        <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
          {mark} (Pico)
        </span>
      )
    }
    if (mark.includes("Menor")) {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-sans text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {mark} (Óptimo)
        </span>
      )
    }
  }

  // 5. Tipo de día
  if (column === "Tipo") {
    const tipo = String(rawValue)
    if (tipo.includes("Laborable")) {
      return (
        <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2 py-0.5 font-sans text-[11px] font-medium text-sky-600 dark:text-sky-400 border border-sky-500/20">
          {tipo}
        </span>
      )
    }
    if (tipo.includes("Fin de semana")) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {tipo}
        </span>
      )
    }
  }

  // 6. Delta / Overhead / Exceso (Path Inflation)
  if (/Delta|Overhead|Exceso/i.test(column)) {
    const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue).replace(/[^\d.-]/g, ""))
    if (!isNaN(num)) {
      if (num >= 40) {
        return (
          <span className="inline-flex items-center rounded-md bg-rose-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30">
            +{num.toFixed(1)} ms
          </span>
        )
      }
      if (num >= 20) {
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/30">
            +{num.toFixed(1)} ms
          </span>
        )
      }
      if (num > 0) {
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            +{num.toFixed(1)} ms
          </span>
        )
      }
      return <span className="font-mono text-muted-foreground/60">0.0 ms</span>
    }
  }

  // 7. Jitter
  if (/Jitter/i.test(column)) {
    const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue).replace(/[^\d.-]/g, ""))
    if (!isNaN(num)) {
      if (num <= 2.0) {
        return <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{num.toFixed(2)} ms</span>
      }
      if (num <= 5.0) {
        return <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{num.toFixed(2)} ms</span>
      }
      return (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          {num.toFixed(2)} ms
        </span>
      )
    }
  }

  // 8. RTT / TTR (Latencia absoluta)
  if (/RTT|TTR/i.test(column)) {
    const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue).replace(/[^\d.-]/g, ""))
    if (!isNaN(num)) {
      if (num < 15) {
        return <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{num.toFixed(1)} ms</span>
      }
      if (num < 40) {
        return <span className="font-mono font-medium text-sky-600 dark:text-sky-400">{num.toFixed(1)} ms</span>
      }
      if (num < 75) {
        return <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{num.toFixed(1)} ms</span>
      }
      return (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25">
          {num.toFixed(1)} ms
        </span>
      )
    }
  }

  // 9. Pérdida de paquetes / Timeouts / Descartes
  if (/Perdid|Timeout|Loss/i.test(column)) {
    const str = String(rawValue).trim()
    if (str.includes("%")) {
      const num = parseFloat(str.replace(/[^\d.-]/g, ""))
      if (!isNaN(num) && num > 0) {
        return (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            {str}
          </span>
        )
      }
      return <span className="font-mono text-muted-foreground/60">{str}</span>
    }
    const num = typeof rawValue === "number" ? rawValue : parseFloat(str)
    if (!isNaN(num)) {
      if (num > 0) {
        return (
          <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            {num}
          </span>
        )
      }
      return <span className="font-mono text-muted-foreground/60">0</span>
    }
  }

  // 10. Éxito / Disponibilidad / Uptime
  if (/Exito|Disponibilidad|Success|Uptime/i.test(column)) {
    const str = String(rawValue).trim()
    const num = parseFloat(str.replace(/[^\d.-]/g, ""))
    if (!isNaN(num)) {
      if (num >= 98) {
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {str}
          </span>
        )
      }
      if (num >= 80) {
        return (
          <span className="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {str}
          </span>
        )
      }
      return (
        <span className="inline-flex items-center rounded px-2 py-0.5 font-mono text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          {str}
        </span>
      )
    }
  }

  // 11. IPs, ASNs y Prefijos
  if (isIpOrAsnValue(rawValue) || /ASN|IP|Prefijo/i.test(column)) {
    const str = String(rawValue).trim()
    if (str.toUpperCase() === "TOTAL" || str === "-") {
      return <span className="font-mono font-bold text-foreground">{str}</span>
    }
    return (
      <span className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] bg-muted/40 text-foreground/90 border border-border/40">
        {str}
      </span>
    )
  }

  if (typeof rawValue === "number" || isNumericColumn(column) || isMonospaceColumn(column)) {
    return <span className={`font-mono ${isRowSummary ? "font-bold text-foreground" : ""}`}>{formatted}</span>
  }

  return isRowSummary ? <span className="font-bold text-foreground">{formatted}</span> : formatted
}

export function ReportTableBlock({ table }: { table: ReportTable & { type?: string } }) {
  const [search, setSearch] = useState("")
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const source = table.source ?? DEFAULT_SOURCE
  const prefix = table.type === "CHART" ? "Figura" : "Tabla"
  const caption = table.caption ?? `${prefix} ${table.id}. ${table.title}. Fuente: ${source}.`

  const rows = table.rows || []
  const columns = table.columns || []
  const isSearchActive = Boolean(search.trim())

  const hasDelta = useMemo(() => columns.some((c) => /Delta|Overhead|Exceso/i.test(c)), [columns])
  const hasJitter = useMemo(() => columns.some((c) => /Jitter/i.test(c)), [columns])
  const hasRtt = useMemo(() => !hasDelta && columns.some((c) => /RTT|TTR/i.test(c)), [columns, hasDelta])
  const hasAvailability = useMemo(() => columns.some((c) => /Exito|Disponibilidad|Success|Uptime|Perdid/i.test(c)), [columns])

  const filteredRows = useMemo(() => {
    if (!isSearchActive) return rows
    const term = search.toLowerCase().trim()
    return rows.filter((row) =>
      columns.some((col) => {
        const val = row[col]
        if (val === undefined || val === null) return false
        return String(val).toLowerCase().includes(term)
      })
    )
  }, [rows, columns, isSearchActive, search])

  const handleCopy = useCallback(async () => {
    if (!columns.length || !rows.length) return

    const headerLine = columns.join("\t")
    const rowsToExport = isSearchActive ? filteredRows : rows

    const rowLines = rowsToExport.map((row) =>
      columns
        .map((col) => {
          const val = row[col]
          if (val === undefined || val === null) return ""
          return String(val).replace(/\t/g, " ").replace(/\r?\n/g, " ")
        })
        .join("\t")
    )

    const tsv = [headerLine, ...rowLines].join("\n")

    try {
      await navigator.clipboard.writeText(tsv)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error al copiar al portapapeles:", err)
    }
  }, [columns, rows, isSearchActive, filteredRows])

  return (
    <figure className="break-inside-avoid print:break-inside-avoid w-full print:my-6">
      <Card className="report-surface border border-border/50 transition-all duration-200 hover:border-border/80 w-full print:border-none print:shadow-none print:bg-transparent print:p-0 print:rounded-none">
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between print:p-0 print:border-none print:mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 print:gap-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary print:hidden">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-semibold print:text-[11pt] print:font-bold print:text-black">
                {prefix} {table.id}. {table.title}.
              </CardTitle>
            </div>
            <CardDescription className="grid gap-1 text-xs print:text-[9pt] print:text-gray-700">
              <span>Fuente: {source}.</span>
              {table.method && <span>Metodo: {table.method}</span>}
              {table.unit && <span>Unidad: {table.unit}</span>}
              {typeof table.sample_size === "number" && (
                <span>Muestra: {table.sample_size.toLocaleString("es")} registros.</span>
              )}

              {/* Leyendas de Color Contextuales (ocultas en impresion para reporte academico) */}
              {hasDelta && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] text-muted-foreground border-t border-border/40 mt-1 print:hidden">
                  <span className="font-semibold text-foreground/90">Path Inflation:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    &lt;20 ms (Óptimo)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    20-40 ms (Desvío regional)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    &ge;40 ms (Path Inflation Severo)
                  </span>
                </div>
              )}
              {hasRtt && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] text-muted-foreground border-t border-border/40 mt-1 print:hidden">
                  <span className="font-semibold text-foreground/90">Latencia RTT:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    &lt;15 ms (Local SV)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    15-40 ms (Regional CA)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    40-75 ms (Tránsito Int.)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    &ge;75 ms (Ultramar / Desvío)
                  </span>
                </div>
              )}
              {hasJitter && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] text-muted-foreground border-t border-border/40 mt-1 print:hidden">
                  <span className="font-semibold text-foreground/90">Estabilidad Jitter:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    &le;2 ms (Estable)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    2-5 ms (Moderado)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    &gt;5 ms (Inestable)
                  </span>
                </div>
              )}
              {hasAvailability && !hasDelta && !hasRtt && !hasJitter && (
                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-[11px] text-muted-foreground border-t border-border/40 mt-1 print:hidden">
                  <span className="font-semibold text-foreground/90">Disponibilidad:</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    &ge;98% (Óptima)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    80-97% (Intermitente)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    &lt;80% (Pérdida/Falla)
                  </span>
                </div>
              )}
            </CardDescription>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 print:hidden">
            {rows.length >= 6 && (
              <div className="relative flex items-center">
                <Search
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar por ISP, IP, país..."
                  className="h-8 w-44 rounded-md border border-input bg-background/80 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground/70 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-56"
                  aria-label={`Filtrar ${prefix} ${table.id}`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Limpiar filtro"
                  >
                    ×
                  </button>
                )}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={`h-8 gap-1.5 text-xs transition-all duration-200 active:scale-[0.98] ${
                copied
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Copiar tabla en formato TSV (para Excel, Word y Google Sheets)"
              aria-label="Copiar tabla en formato TSV"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar tabla</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4 print:p-0 print:pt-1">
          {isSearchActive && (
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground print:hidden">
              <span className="font-mono text-[11px]">
                Mostrando <span className="font-semibold text-foreground">{filteredRows.length}</span> de{" "}
                <span className="font-semibold text-foreground">{rows.length}</span> filas
              </span>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[11px] text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Limpiar filtro
              </button>
            </div>
          )}

          <div className="report-table overflow-x-auto">
            <table
              aria-label={`${prefix} ${table.id}. ${table.title}`}
              className="w-full border-collapse font-sans text-[12px] text-foreground"
            >
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground">
                  {columns.map((column) => (
                    <th
                      key={column}
                      className={`border-b border-border px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider ${
                        isNumericColumn(column) ? "text-right font-mono tabular-nums" : "text-left"
                      }`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={Math.max(columns.length, 1)}
                      className="py-10 text-center text-xs text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <p className="font-medium text-foreground">
                          No se encontraron coincidencias para &ldquo;{search}&rdquo;
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Intente con otro término o restablezca el filtro de búsqueda.
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSearch("")}
                          className="mt-2 h-7 text-xs text-primary"
                        >
                          Restablecer filtro
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const isClippedByLimit = !isSearchActive && !isExpanded && index >= 20
                    const isTotal = isSummaryRow(row)

                    return (
                      <tr
                        key={index}
                        className={`border-b transition-colors duration-150 ${
                          isTotal
                            ? "border-b-2 border-border bg-primary/[0.05] font-semibold text-foreground hover:bg-primary/[0.08]"
                            : "border-border/40 hover:bg-muted/30"
                        } ${isClippedByLimit ? "hidden print:table-row" : ""}`}
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className={`max-w-[360px] whitespace-normal px-4 py-3 align-middle ${
                              isNumericColumn(column) ? "text-right font-mono tabular-nums" : "text-left"
                            }`}
                          >
                            {renderCellContent(column, row[column], row)}
                          </td>
                        ))}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isSearchActive && rows.length > 20 && (
            <div className="mt-3 flex items-center justify-center border-t border-border/40 pt-3 print:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-[0.98]"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Mostrar menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    Mostrar todas las {rows.length} filas
                  </>
                )}
              </Button>
            </div>
          )}

          {table.notes?.length ? (
            <ul className="mt-3 grid gap-1 text-xs text-muted-foreground">
              {table.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
      <figcaption className="mt-2 text-left px-1 text-xs text-muted-foreground break-after-avoid print:break-after-avoid">
        {caption}
      </figcaption>
    </figure>
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
