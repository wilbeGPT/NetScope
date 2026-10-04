"use client"

import { Globe2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type CountryCategory = "local" | "regional" | "backbone"

type Node = {
  isp: string
  hop: number
  ip: string
  owner: string
  country: string
  countryCode: string
  category: CountryCategory
  rttAvg: number
  delta: number
}

function numeric(value: unknown): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeCategory(value: unknown): CountryCategory {
  return value === "local" || value === "regional" || value === "backbone" ? value : "backbone"
}

function CountryBadge({ country, code, category }: { country: string; code: string; category: CountryCategory }) {
  const styles: Record<CountryCategory, string> = {
    local: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    regional: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    backbone: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  }

  return (
    <Badge variant="outline" className={cn("gap-1.5 font-mono text-[10px] uppercase tracking-wider", styles[category])}>
      <Globe2 className="h-3 w-3" aria-hidden="true" />
      <span className="font-semibold">{code}</span>
      <span className="hidden font-normal normal-case tracking-normal sm:inline">- {country}</span>
    </Badge>
  )
}

export function CriticalNodesTable({ nodes = [] }: { nodes?: Node[] }) {
  if (!nodes.length) {
    return <div className="rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">Sin nodos criticos detectados.</div>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Proveedor / ASN</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Hop</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">IP del nodo</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Propietario</TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Pais</TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">RTT promedio (ms)</TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Delta (ms)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => {
            const delta = numeric(node.delta)
            return (
              <TableRow key={`${node.isp}-${node.hop}-${node.ip}`} className="hover:bg-muted/40">
                <TableCell className="font-medium">{node.isp || "N/D"}</TableCell>
                <TableCell className="font-mono text-sm">{node.hop}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{node.ip || "N/D"}</TableCell>
                <TableCell className="text-sm">{node.owner || "Desconocido"}</TableCell>
                <TableCell>
                  <CountryBadge country={node.country || "Desconocido"} code={node.countryCode || "UN"} category={safeCategory(node.category)} />
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">{numeric(node.rttAvg).toFixed(1)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-sm font-medium tabular-nums",
                    delta >= 50
                      ? "text-red-600 dark:text-red-400"
                      : delta >= 20
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  +{delta.toFixed(1)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}