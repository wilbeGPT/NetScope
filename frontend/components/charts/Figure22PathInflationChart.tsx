"use client"

import { useState } from "react"
import { Globe, Network } from "lucide-react"
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ReportElement } from "@/lib/types"
import { cn } from "@/lib/utils"

const ISP_COLORS: Record<string, string> = {
  "Claro SV": "#ef4444",      // red
  "Conective SV": "#22c55e",  // green
  "Globalnet HN": "#64748b",  // slate gray
  "Liberty SV": "#06b6d4",    // cyan
  "Movistar SV": "#3b82f6",   // blue
  "Navega GT": "#854d0e",     // brown
  UCA: "#f59e0b",             // orange/amber
  UES: "#9333ea",             // purple
}

const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--muted-foreground, #94a3b8)",
  fontFamily: "var(--font-mono)",
}

const GRID = "var(--border, #263244)"

interface Figure22Props {
  element: ReportElement & {
    subtitle?: string
    target_host?: string
    baseline?: number
    internal_baseline?: number
    rows?: any[]
    dataKeys?: string[]
    thresholds?: Array<{
      label: string
      y1: number
      y2: number
      color: string
      zone: string
    }>
  }
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null

  const sorted = [...payload]
    .filter((item) => Number.isFinite(Number(item.value)))
    .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0))

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 backdrop-blur-md p-3 shadow-2xl min-w-[240px]">
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
        <span className="font-mono text-xs font-bold text-foreground">
          Salto {label} (Hop {label})
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          webdesktop.ufg.edu.sv
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {sorted.map((item: any) => {
          const val = Number(item.value)
          let zoneLabel = "Red local"
          let zoneBadgeClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
          if (val > 80) {
            zoneLabel = "Fuera región"
            zoneBadgeClass = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
          } else if (val >= 40) {
            zoneLabel = "Tránsito intl."
            zoneBadgeClass = "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30"
          } else if (val >= 15) {
            zoneLabel = "Regional"
            zoneBadgeClass = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
          }

          return (
            <div key={item.name} className="flex items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-foreground/90">{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {val.toFixed(2)} ms
                </span>
                <span className={cn("text-[9px] font-mono px-1 py-0.2 rounded border", zoneBadgeClass)}>
                  {zoneLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Figure22PathInflationChart({ element }: Figure22Props) {
  const [activeIsp, setActiveIsp] = useState<string | null>(null)

  const rows = element.rows || []
  const dataKeys = element.dataKeys && element.dataKeys.length > 0
    ? element.dataKeys
    : Object.keys(ISP_COLORS)

  const targetHost = element.subtitle || (element as any).target_host || "webdesktop.ufg.edu.sv"
  const baseline = element.baseline ?? 53.98
  const internalBaseline = element.internal_baseline ?? 0.7

  if (!rows || rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Datos de RTT por hop no disponibles para Figura 22.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-[var(--surface-subtle)] p-4 sm:p-5">
      {/* Header matching thesis */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
              FASE 4: PATH INFLATION
            </span>
            <span className="text-muted-foreground/60">—</span>
            <span className="text-xs font-semibold text-foreground">
              RTT por hop por ISP
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3 w-3 text-primary/70" />
            <span className="font-mono font-medium text-primary/90">{targetHost}</span>
            <span className="text-muted-foreground/60">·</span>
            <span>Rutas internacionales hacia el destino</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="rounded bg-muted/60 px-2 py-0.5 border border-border/50">Hops: 1 - 17</span>
          <span className="rounded bg-muted/60 px-2 py-0.5 border border-border/50">Y-Max: 180 ms</span>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border/30 pb-2.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">
          ISPs:
        </span>
        {dataKeys.map((key) => {
          const color = ISP_COLORS[key] || "#94a3b8"
          const isActive = activeIsp === key
          const isDimmed = activeIsp !== null && activeIsp !== key

          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setActiveIsp(key)}
              onMouseLeave={() => setActiveIsp(null)}
              onClick={() => setActiveIsp((curr) => (curr === key ? null : key))}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-all duration-150 active:scale-95",
                isActive
                  ? "bg-primary/10 ring-1 ring-primary/40 text-foreground font-semibold shadow-xs"
                  : isDimmed
                  ? "text-muted-foreground/40 opacity-50"
                  : "text-foreground/80 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-background shadow-xs shrink-0"
                style={{ backgroundColor: color }}
              />
              <span>{key}</span>
            </button>
          )
        })}
      </div>

      {/* Chart Canvas */}
      <div className="h-[460px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 20, right: 36, left: 16, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke={GRID} opacity={0.5} />

            {/* Latency Threshold Reference Bands */}
            {/* Zone 1: < 15 ms (Red local) */}
            <ReferenceArea
              y1={0}
              y2={15}
              fill="#10b981"
              fillOpacity={0.08}
              stroke="#10b981"
              strokeOpacity={0.25}
              strokeDasharray="2 2"
            >
              <Label
                value="< 15 ms = Red local"
                position="insideBottomLeft"
                fill="#10b981"
                fontSize={11}
                fontWeight={700}
                offset={8}
              />
            </ReferenceArea>

            {/* Zone 2: 15 - 40 ms (Backbone regional) */}
            <ReferenceArea
              y1={15}
              y2={40}
              fill="#eab308"
              fillOpacity={0.08}
              stroke="#eab308"
              strokeOpacity={0.25}
              strokeDasharray="2 2"
            >
              <Label
                value="15-40 ms = Backbone regional"
                position="insideBottomLeft"
                fill="#ca8a04"
                fontSize={11}
                fontWeight={700}
                offset={10}
              />
            </ReferenceArea>

            {/* Zone 3: 40 - 80 ms (Tránsito internacional) */}
            <ReferenceArea
              y1={40}
              y2={80}
              fill="#f97316"
              fillOpacity={0.08}
              stroke="#f97316"
              strokeOpacity={0.25}
              strokeDasharray="2 2"
            >
              <Label
                value="40-80 ms = Tránsito internacional"
                position="insideBottomLeft"
                fill="#ea580c"
                fontSize={11}
                fontWeight={700}
                offset={12}
              />
            </ReferenceArea>

            {/* Zone 4: > 80 ms (Nodo fuera de región) */}
            <ReferenceArea
              y1={80}
              y2={180}
              fill="#ef4444"
              fillOpacity={0.08}
              stroke="#ef4444"
              strokeOpacity={0.25}
              strokeDasharray="2 2"
            >
              <Label
                value="> 80 ms = Nodo fuera de región"
                position="insideBottomLeft"
                fill="#dc2626"
                fontSize={11}
                fontWeight={700}
                offset={14}
              />
            </ReferenceArea>

            {/* Reference Lines */}
            {Number.isFinite(Number(baseline)) && (
              <ReferenceLine
                y={Number(baseline)}
                stroke="#06b6d4"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Línea base Liberty SV (${Number(baseline).toFixed(1)} ms)`,
                  fill: "#06b6d4",
                  fontSize: 10,
                  position: "insideBottomRight",
                  fontWeight: 600,
                }}
              />
            )}
            {Number.isFinite(Number(internalBaseline)) && (
              <ReferenceLine
                y={Number(internalBaseline)}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: `LAN campus (${Number(internalBaseline).toFixed(1)} ms)`,
                  fill: "#10b981",
                  fontSize: 10,
                  position: "insideBottomRight",
                  fontWeight: 600,
                }}
              />
            )}

            {/* X-Axis strictly from 1 to 17 */}
            <XAxis
              dataKey="hop"
              type="number"
              domain={[1, 17]}
              ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]}
              tick={AXIS_TICK}
              stroke="var(--border, #6b7280)"
              axisLine
              tickLine
              label={{
                value: "Número de hop",
                position: "insideBottom",
                offset: -16,
                fill: "var(--foreground, #f8fafc)",
                fontSize: 12,
                fontWeight: 700,
              }}
            />

            {/* Y-Axis strictly from 0 to 180 ms */}
            <YAxis
              domain={[0, 180]}
              ticks={[0, 20, 40, 60, 80, 100, 120, 140, 160, 180]}
              tick={AXIS_TICK}
              stroke="var(--border, #6b7280)"
              axisLine
              tickLine
              label={{
                value: "RTT promedio (ms)",
                angle: -90,
                position: "insideLeft",
                offset: -4,
                fill: "var(--foreground, #f8fafc)",
                fontSize: 12,
                fontWeight: 700,
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* ISP Lines with matching colors and smooth dots */}
            {dataKeys.map((key) => {
              const color = ISP_COLORS[key] || "#94a3b8"
              const isHovered = activeIsp === key
              const isDimmed = activeIsp !== null && activeIsp !== key

              return (
                <Line
                  key={key}
                  name={key}
                  type="monotone"
                  dataKey={key}
                  stroke={color}
                  strokeWidth={isHovered ? 3.5 : 2.2}
                  strokeOpacity={isDimmed ? 0.2 : 1}
                  connectNulls
                  dot={{
                    fill: color,
                    stroke: "var(--card, #0f172a)",
                    strokeWidth: 1.5,
                    r: isHovered ? 5 : 3.5,
                    opacity: isDimmed ? 0.2 : 1,
                  }}
                  activeDot={{
                    r: 6,
                    fill: color,
                    stroke: "var(--foreground, #ffffff)",
                    strokeWidth: 2,
                  }}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Latency Threshold Reference Legend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="font-mono font-bold">&lt; 15 ms</span>
          <span className="text-muted-foreground">· Red local</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-amber-600 dark:text-amber-400">
          <span className="font-mono font-bold">15-40 ms</span>
          <span className="text-muted-foreground">· Backbone reg.</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 text-orange-600 dark:text-orange-400">
          <span className="font-mono font-bold">40-80 ms</span>
          <span className="text-muted-foreground">· Tránsito intl.</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-rose-600 dark:text-rose-400">
          <span className="font-mono font-bold">&gt; 80 ms</span>
          <span className="text-muted-foreground">· Fuera de región</span>
        </div>
      </div>
    </div>
  )
}
