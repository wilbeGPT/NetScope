"use client"

import { Globe2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

const defaultNodes: Node[] = [
  {
    isp: "Tigo",
    hop: 3,
    ip: "190.86.123.4",
    owner: "Tigo El Salvador",
    country: "El Salvador",
    countryCode: "SV",
    category: "local",
    rttAvg: 18.6,
    delta: 8.8,
  },
  {
    isp: "Tigo",
    hop: 5,
    ip: "200.115.198.42",
    owner: "Cable & Wireless",
    country: "Panamá",
    countryCode: "PA",
    category: "regional",
    rttAvg: 54.1,
    delta: 21.7,
  },
  {
    isp: "Tigo",
    hop: 6,
    ip: "4.69.219.118",
    owner: "Level3 / Lumen",
    country: "Estados Unidos",
    countryCode: "US",
    category: "backbone",
    rttAvg: 141.5,
    delta: 87.4,
  },
  {
    isp: "Claro",
    hop: 4,
    ip: "201.220.146.3",
    owner: "Claro El Salvador",
    country: "El Salvador",
    countryCode: "SV",
    category: "local",
    rttAvg: 38.9,
    delta: 17.2,
  },
  {
    isp: "Claro",
    hop: 5,
    ip: "200.34.96.118",
    owner: "Telmex / AS-6762",
    country: "México",
    countryCode: "MX",
    category: "regional",
    rttAvg: 100.2,
    delta: 62.1,
  },
  {
    isp: "Movistar",
    hop: 4,
    ip: "200.74.144.21",
    owner: "Movistar SV",
    country: "El Salvador",
    countryCode: "SV",
    category: "local",
    rttAvg: 35.1,
    delta: 15.8,
  },
  {
    isp: "Movistar",
    hop: 6,
    ip: "129.250.4.179",
    owner: "NTT Communications",
    country: "Estados Unidos",
    countryCode: "US",
    category: "backbone",
    rttAvg: 82.9,
    delta: 24.2,
  },
  {
    isp: "Digicel",
    hop: 5,
    ip: "190.124.27.66",
    owner: "Columbus Networks",
    country: "Trinidad y Tobago",
    countryCode: "TT",
    category: "regional",
    rttAvg: 63.4,
    delta: 22.2,
  },
  {
    isp: "Digicel",
    hop: 7,
    ip: "62.115.61.5",
    owner: "Telia Carrier",
    country: "Reino Unido",
    countryCode: "GB",
    category: "backbone",
    rttAvg: 102.3,
    delta: 38.9,
  },
]

function CountryBadge({
  country,
  code,
  category,
}: {
  country: string
  code: string
  category: CountryCategory
}) {
  const styles: Record<CountryCategory, string> = {
    // Verde: El Salvador (SV)
    local:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
    // Amarillo: tránsito regional
    regional:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    // Rojo: backbone internacional
    backbone:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-[10px] uppercase tracking-wider", styles[category])}
    >
      <Globe2 className="h-3 w-3" aria-hidden="true" />
      <span className="font-semibold">{code}</span>
      <span className="hidden font-normal normal-case tracking-normal sm:inline">· {country}</span>
    </Badge>
  )
}

export function CriticalNodesTable({ nodes = defaultNodes }: { nodes?: Node[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              ISP
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Hop
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              IP del nodo
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Propietario
            </TableHead>
            <TableHead className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              País
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              RTT promedio (ms)
            </TableHead>
            <TableHead className="text-right font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Delta (ms)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((n) => (
            <TableRow key={`${n.isp}-${n.hop}-${n.ip}`} className="hover:bg-muted/40">
              <TableCell className="font-medium">{n.isp}</TableCell>
              <TableCell className="font-mono text-sm">{n.hop}</TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">{n.ip}</TableCell>
              <TableCell className="text-sm">{n.owner}</TableCell>
              <TableCell>
                <CountryBadge country={n.country} code={n.countryCode} category={n.category} />
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">
                {n.rttAvg.toFixed(1)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono text-sm font-medium tabular-nums",
                  n.delta >= 50
                    ? "text-red-600 dark:text-red-400"
                    : n.delta >= 20
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400",
                )}
              >
                +{n.delta.toFixed(1)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
