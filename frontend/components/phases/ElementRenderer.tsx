import { ReportElement } from "@/lib/types"
import { ReportTableBlock } from "@/components/phases/ReportTableBlock"
import { ReportPngFigure } from "@/components/phases/ReportFigureBlock"
import { ReportChartFigure } from "@/components/phases/ReportChartFigure"
import { Figure22PathInflationChart } from "@/components/charts/Figure22PathInflationChart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  ErrorBar,
  LabelList,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const ISP_COLORS: Record<string, string> = {
  "Movistar SV": "var(--chart-1, #3b82f6)",
  "Claro SV": "var(--chart-5, #ef4444)",
  "Conective SV": "var(--chart-3, #10b981)",
  "Conective S.A.": "var(--chart-3, #10b981)",
  UCA: "var(--chart-4, #f59e0b)",
  UES: "#8b5cf6",
  "Liberty SV": "var(--chart-2, #06b6d4)",
  "Liberty Networks SV": "var(--chart-2, #06b6d4)",
  "Navega GT": "#a855f7",
  "Globalnet HN": "#64748b",
}

const FALLBACK_COLORS = [
  "var(--chart-1, #3b82f6)",
  "var(--chart-2, #06b6d4)",
  "var(--chart-3, #10b981)",
  "var(--chart-4, #f59e0b)",
  "var(--chart-5, #ef4444)",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
]

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground, #94a3b8)", fontFamily: "var(--font-mono)" }
const GRID = "var(--border, #263244)"

function colorFor(name: string, index = 0): string {
  return ISP_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function tooltipStyle() {
  return {
    backgroundColor: "var(--card, #0f172a)",
    border: "1px solid var(--border, #1e293b)",
    borderRadius: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  }
}

function cleanIspLabel(name: string): string {
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
  if (name.length > 18) return name.slice(0, 16) + "…"
  return name
}

function formatCategoryLabel(value: any): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  const match = str.match(/^(\d+)\s*\((.+)\)$/)
  if (match) {
    return `${match[1]} (${cleanIspLabel(match[2])})`
  }
  return cleanIspLabel(str)
}

function ChartSurface({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 h-[410px] w-full rounded-xl border border-border bg-[var(--surface-subtle)] p-4 print:mt-2 print:h-auto print:min-h-[300px] print:border-none print:bg-transparent print:p-0 print:block">{children}</div>
}

function BoxPlotSvg({ rows }: { rows: any[] }) {
  const width = 940
  const height = 370
  const margin = { top: 34, right: 30, bottom: 85, left: 60 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const yMax = 20
  const scaleY = (value: number) => margin.top + plotH - (Math.min(Math.max(value, 0), yMax) / yMax) * plotH
  const step = plotW / Math.max(rows.length, 1)
  const boxW = Math.min(52, step * 0.45)
  const bottomAxisY = margin.top + plotH

  return (
    <div className="relative flex flex-col w-full h-full print:block">
      <div className="relative flex-1 w-full min-h-[300px] print:block print:w-full print:h-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible print:h-auto print:max-h-[370px]" preserveAspectRatio="xMidYMid meet" role="img">
          <rect x="0" y="0" width={width} height={height} fill="transparent" />
          {[0, 5, 10, 15, 20].map((tick) => (
            <g key={tick}>
              <line x1={margin.left} x2={width - margin.right} y1={scaleY(tick)} y2={scaleY(tick)} stroke={GRID} strokeDasharray="3 3" />
          <text x={margin.left - 10} y={scaleY(tick) + 4} textAnchor="end" fill="var(--muted-foreground, #94a3b8)" fontSize="11" fontFamily="var(--font-mono)">{tick}</text>
        </g>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={bottomAxisY} stroke="var(--border, #6b7280)" />
      <line x1={margin.left} x2={width - margin.right} y1={bottomAxisY} y2={bottomAxisY} stroke="var(--border, #6b7280)" />
      <text x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} fill="var(--foreground, #f8fafc)" fontSize="12" fontWeight="600" textAnchor="middle">Jitter (ms)</text>

      {/* Top disclaimer placed safely above the 20ms line */}
      <text x={width - margin.right} y={margin.top - 12} textAnchor="end" fill="var(--muted-foreground, #94a3b8)" fontSize="11" fontStyle="italic">
        Nota: Outliers extremos cortados en 20 ms para legibilidad
      </text>

      {rows.map((row, index) => {
        const x = margin.left + step * index + step / 2
        const minY = scaleY(Number(row.min))
        const q1Y = scaleY(Number(row.q1))
        const medY = scaleY(Number(row.median))
        const q3Y = scaleY(Number(row.q3))
        const maxY = scaleY(Number(row.max))
        const ispName = cleanIspLabel(String(row.isp ?? ""))
        const fill = colorFor(ispName, index)
        const labelY = bottomAxisY + 14

        return (
          <g key={row.isp ?? index}>
            <line x1={x} x2={x} y1={maxY} y2={minY} stroke="var(--foreground, #f8fafc)" strokeWidth="1.2" />
            <line x1={x - boxW / 3} x2={x + boxW / 3} y1={maxY} y2={maxY} stroke="var(--foreground, #f8fafc)" strokeWidth="1.2" />
            <line x1={x - boxW / 3} x2={x + boxW / 3} y1={minY} y2={minY} stroke="var(--foreground, #f8fafc)" strokeWidth="1.2" />
            <rect x={x - boxW / 2} y={q3Y} width={boxW} height={Math.max(2, q1Y - q3Y)} fill={fill} opacity="0.8" stroke="var(--border, #6b7280)" rx="2" />
            <line x1={x - boxW / 2} x2={x + boxW / 2} y1={medY} y2={medY} stroke="var(--foreground, #ffffff)" strokeWidth="2" />
            <text
              x={x}
              y={labelY}
              textAnchor="end"
              transform={`rotate(-32 ${x} ${labelY})`}
              fill="var(--foreground, #f8fafc)"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--font-sans)"
            >
              {ispName}
            </text>
            {Number(row.outlierCount || 0) > 0 && (
              <text x={x} y={margin.top + 16} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">
                +{row.outlierCount}
              </text>
            )}
          </g>
        )
      })}
    </svg>
      </div>
    </div>
  )
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function GanttChartSvg({ rows, probeId }: { rows: any[]; probeId?: string }) {
  if (!rows || rows.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Datos de cronograma no disponibles.</div>
  }

  const width = 940
  const height = 300
  const margin = { top: 32, right: 30, bottom: 60, left: 100 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const startTimes = rows.map((r) => Number(r.start_time)).filter(Number.isFinite)
  const endTimes = rows.map((r) => Number(r.end_time)).filter(Number.isFinite)
  const minT = Math.min(...startTimes)
  const maxT = Math.max(...endTimes)
  const totalDuration = maxT - minT

  if (totalDuration <= 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Datos de tiempo insuficientes.</div>
  }

  const scaleX = (t: number) => margin.left + ((t - minT) / totalDuration) * plotW

  const lane1Y = margin.top + 20
  const lane2Y = margin.top + 105
  const laneHeight = 44

  const dayTicks: { time: number; label: string; subLabel: string }[] = []
  const stepSeconds = 86400
  const firstDayCst = Math.floor((minT - 6 * 3600) / stepSeconds) * stepSeconds + 6 * 3600
  for (let t = firstDayCst; t <= maxT + stepSeconds; t += stepSeconds) {
    if (t >= minT - stepSeconds * 0.15 && t <= maxT + stepSeconds * 0.15) {
      const d = new Date((t - 6 * 3600) * 1000)
      const day = d.getUTCDate().toString().padStart(2, "0")
      const month = MONTHS_ES[d.getUTCMonth()] || "Feb"
      dayTicks.push({ time: t, label: `${day} ${month}`, subLabel: "12:00 AM" })
    }
  }

  const outages = rows.filter((r) => r.status === "Apagada")
  const totalOutageSeconds = outages.reduce((acc, r) => acc + (Number(r.end_time) - Number(r.start_time)), 0)
  const totalOutageHours = (totalOutageSeconds / 3600).toFixed(1)

  return (
    <div className="relative flex flex-col w-full h-full print:block">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs print:mb-2 print:flex">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">Sonda:</span>
          <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
            {probeId || rows[0]?.probe_id || "N/D"}
          </span>
          <span className="hidden sm:inline print:inline text-muted-foreground">
            ({outages.length} caídas · {totalOutageHours} hrs totales fuera de servicio)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            <span className="text-xs text-muted-foreground font-medium">Activa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            <span className="text-xs text-muted-foreground font-medium">Apagada</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-[260px] print:block print:w-full print:h-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible print:h-auto print:max-h-[300px]" preserveAspectRatio="xMidYMid meet" role="img">
          <rect x="0" y="0" width={width} height={height} fill="transparent" />

          {dayTicks.map((dt, idx) => {
            const x = scaleX(dt.time)
            if (x < margin.left - 5 || x > width - margin.right + 5) return null
            return (
              <g key={idx}>
                <line x1={x} x2={x} y1={margin.top} y2={margin.top + plotH} stroke={GRID} strokeDasharray="3 3" opacity={0.6} />
                <text x={x} y={margin.top + plotH + 20} textAnchor="middle" fill="var(--foreground, #f8fafc)" fontSize="11" fontFamily="var(--font-mono)" fontWeight={600}>
                  {dt.label}
                </text>
                <text x={x} y={margin.top + plotH + 34} textAnchor="middle" fill="var(--muted-foreground, #94a3b8)" fontSize="10" fontFamily="var(--font-mono)">
                  {dt.subLabel}
                </text>
              </g>
            )
          })}

          <rect x={margin.left} y={lane1Y - 4} width={plotW} height={laneHeight + 8} rx={6} fill="var(--card, #0f172a)" fillOpacity={0.6} stroke={GRID} strokeWidth={1} />
          <rect x={margin.left} y={lane2Y - 4} width={plotW} height={laneHeight + 8} rx={6} fill="var(--card, #0f172a)" fillOpacity={0.6} stroke={GRID} strokeWidth={1} />

          <line x1={margin.left} x2={width - margin.right} y1={margin.top + plotH} y2={margin.top + plotH} stroke="var(--border, #6b7280)" />
          <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotH} stroke="var(--border, #6b7280)" />

          <g>
            <circle cx={margin.left - 75} cy={lane1Y + laneHeight / 2} r="4" fill="#10b981" />
            <text x={margin.left - 14} y={lane1Y + laneHeight / 2 + 5} textAnchor="end" fill="#10b981" fontSize="13" fontWeight="600" fontFamily="var(--font-sans)">
              Activa
            </text>
          </g>
          <g>
            <circle cx={margin.left - 85} cy={lane2Y + laneHeight / 2} r="4" fill="#ef4444" />
            <text x={margin.left - 14} y={lane2Y + laneHeight / 2 + 5} textAnchor="end" fill="#ef4444" fontSize="13" fontWeight="600" fontFamily="var(--font-sans)">
              Apagada
            </text>
          </g>

          {rows.map((row, index) => {
            const isActiva = row.status === "Activa"
            const xStart = scaleX(Number(row.start_time))
            const xEnd = scaleX(Number(row.end_time))
            const barW = Math.max(xEnd - xStart, 3)
            const barY = isActiva ? lane1Y : lane2Y
            const durationHours = (Number(row.end_time) - Number(row.start_time)) / 3600

            return (
              <g key={index} className="transition-opacity duration-150 hover:opacity-90">
                <rect
                  x={xStart}
                  y={barY}
                  width={barW}
                  height={laneHeight}
                  rx={4}
                  fill={isActiva ? "#10b981" : "#ef4444"}
                  fillOpacity={isActiva ? 0.85 : 0.9}
                  stroke={isActiva ? "#059669" : "#dc2626"}
                  strokeWidth={0.75}
                >
                  <title>{`${row.status}: ${durationHours.toFixed(2)} h`}</title>
                </rect>

                {!isActiva && durationHours >= 1.5 && (
                  <g transform={`translate(${xStart + barW / 2}, ${barY + laneHeight / 2})`}>
                    <rect
                      x={-28}
                      y={-11}
                      width={56}
                      height={22}
                      rx={4}
                      fill="var(--card, #0f172a)"
                      stroke="#ef4444"
                      strokeWidth={1}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                    />
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      fill="var(--foreground, #f8fafc)"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight={700}
                    >
                      {durationHours.toFixed(1)} hrs
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export function ElementRenderer({ element }: { element: ReportElement }) {
  if (element.type === "TABLE" || element.type === "DATA_TABLE") {
    return <ReportTableBlock table={element as any} />
  }

  if (element.type === "PNG") {
    if (element.id === "6" && (element as any).rows && (element as any).rows.length > 0) {
      return (
        <ReportChartFigure id={element.id} title={element.title} description={element.caption ?? ""} caption={element.caption} source={element.source} method={element.method} notes={element.notes}>
          <ChartSurface>
            <GanttChartSvg rows={(element as any).rows} probeId={(element as any).probe_id} />
          </ChartSurface>
        </ReportChartFigure>
      )
    }

    if (!element.url) {
      return (
        <ReportChartFigure id={element.id} title={element.title} description={element.caption ?? ""} caption={element.caption} source={element.source} method={element.method} notes={element.notes}>
          <div className="py-8 text-center text-sm text-muted-foreground">Grafico PNG no disponible en este entorno.</div>
        </ReportChartFigure>
      )
    }

    return <ReportPngFigure id={element.id} title={element.title} description={element.caption ?? ""} url={element.url} source={element.source} method={element.method} notes={element.notes} />
  }

  if (element.type === "CHART") {
    if (element.id === "22") {
      return (
        <ReportChartFigure
          id={element.id}
          title={element.title}
          description={element.caption ?? ""}
          caption={element.caption}
          source={element.source}
          method={element.method}
          notes={element.notes}
        >
          <Figure22PathInflationChart element={element as any} />
        </ReportChartFigure>
      )
    }

    if (element.kind === "table") return <ReportTableBlock table={element as any} />

    const { kind, rows, dataKey, dataKeys, categoryKey, baseline, probe_id } = element as any
    const keysToRender = dataKeys && Array.isArray(dataKeys) ? dataKeys : dataKey ? [dataKey] : []
    let chartContent = <div className="py-8 text-center text-sm text-muted-foreground">Grafico dinamico no disponible.</div>

    const canRenderStandardChart = rows && rows.length > 0 && keysToRender.length > 0 && categoryKey
    const canRenderSpecialChart = rows && rows.length > 0 && (kind === "boxplot" || kind === "gantt" || element.id === "6" || (kind === "dailyBarLine" && categoryKey))

    if (canRenderStandardChart || canRenderSpecialChart) {
      chartContent = (
        <ChartSurface>
          {kind === "gantt" || element.id === "6" ? (
            <GanttChartSvg rows={rows} probeId={probe_id} />
          ) : kind === "boxplot" ? (
            <BoxPlotSvg rows={rows as any[]} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
            {kind === "dailyBarLine" ? (
              <ComposedChart data={rows} margin={{ top: 20, right: 36, left: 6, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={70} tickMargin={5} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "var(--foreground, #f8fafc)" }} labelStyle={{ color: "var(--foreground, #f8fafc)", fontWeight: 600 }} />
                {Number.isFinite(Number(baseline)) && (
                  <ReferenceLine
                    y={Number(baseline)}
                    stroke="var(--muted-foreground, #6b7280)"
                    strokeDasharray="5 5"
                    label={{ value: "Linea base del analisis", fill: "var(--foreground, #f8fafc)", fontSize: 11, position: "right" }}
                  />
                )}
                <Bar dataKey="RTT mediano diario" name="RTT mediano diario" fill="var(--chart-1, #3b82f6)" maxBarSize={48} />
                <Line type="monotone" dataKey="Promedio RTT" name="Promedio +/- StdDev" stroke="var(--chart-5, #ef4444)" strokeWidth={2} dot={{ fill: "var(--chart-5, #ef4444)", r: 4 }}>
                  <ErrorBar dataKey="StdDev" width={4} stroke="var(--chart-5, #ef4444)" />
                </Line>
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "var(--foreground, #f8fafc)" }} />
              </ComposedChart>
            ) : kind === "boxplot" ? (
              <BoxPlotSvg rows={rows as any[]} />
            ) : kind === "horizontalBar" ? (
              <BarChart data={rows} layout="vertical" margin={{ top: 20, right: 86, left: 24, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <YAxis type="category" dataKey={categoryKey} width={112} tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "var(--foreground, #f8fafc)" }} labelStyle={{ color: "var(--foreground, #f8fafc)", fontWeight: 600 }} formatter={(value: number | string) => [`${Number(value).toFixed(1)} ms`, dataKey ?? "Overhead"]} />
                <ReferenceLine x={60} stroke="var(--chart-5, #ef4444)" strokeDasharray="5 5" label={{ value: "Umbral critico (60 ms)", fill: "var(--chart-5, #ef4444)", fontSize: 11, position: "top" }} />
                {Number.isFinite(Number(baseline)) && <ReferenceLine x={Number(baseline)} stroke="var(--chart-1, #3b82f6)" strokeDasharray="4 4" label={{ value: "Linea base del analisis", fill: "var(--chart-1, #3b82f6)", fontSize: 11, position: "insideTop" }} />}
                <Bar dataKey={dataKey} name={dataKey} radius={[0, 0, 0, 0]} maxBarSize={28}>
                  {rows.map((row: any, index: number) => <Cell key={`cell-${index}`} fill={colorFor(String(row[categoryKey]), index)} />)}
                  <LabelList dataKey={dataKey} position="right" formatter={(value: number | string) => `${Number(value).toFixed(1)} ms`} style={{ fill: "var(--foreground, #f8fafc)", fontSize: 11, fontWeight: 600 }} />
                </Bar>
              </BarChart>
            ) : kind === "bar" ? (
              <BarChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 85 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-32} textAnchor="end" height={80} tickMargin={8} tickFormatter={formatCategoryLabel} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "var(--foreground, #f8fafc)" }} labelStyle={{ color: "var(--foreground, #f8fafc)", fontWeight: 600 }} />
                {keysToRender.length > 1 && (
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "var(--foreground, #f8fafc)" }} />
                )}
                {keysToRender.map((key: string, index: number) => (
                  <Bar key={key} dataKey={key} name={key} fill={colorFor(key, index)} maxBarSize={60}>
                    {rows.map((entry: any, i: number) => (
                      <Cell key={`cell-${i}`} fill={entry.fill || colorFor(key, index)} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            ) : kind === "line" ? (
              <LineChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={62} tickMargin={5} tickFormatter={formatCategoryLabel} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "var(--foreground, #f8fafc)" }} labelStyle={{ color: "var(--foreground, #f8fafc)", fontWeight: 600 }} />
                {keysToRender.length > 1 && (
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "var(--foreground, #f8fafc)" }} />
                )}
                {keysToRender.map((key: string, index: number) => <Line key={key} name={key} type="monotone" dataKey={key} stroke={colorFor(key, index)} strokeWidth={2.4} dot={{ fill: colorFor(key, index), strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: colorFor(key, index) }} />)}
              </LineChart>
            ) : kind === "area" ? (
              <AreaChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 55 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={62} tickMargin={5} tickFormatter={formatCategoryLabel} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "var(--foreground, #f8fafc)" }} labelStyle={{ color: "var(--foreground, #f8fafc)", fontWeight: 600 }} />
                {keysToRender.length > 1 && (
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: "12px", fontSize: "12px", color: "var(--foreground, #f8fafc)" }} />
                )}
                {keysToRender.map((key: string, index: number) => <Area key={key} name={key} type="monotone" dataKey={key} stroke={colorFor(key, index)} strokeWidth={2.2} fill={colorFor(key, index)} fillOpacity={0.18} />)}
              </AreaChart>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Tipo de grafico dinamico no soportado ({kind}).</div>
            )}
          </ResponsiveContainer>
        )}
      </ChartSurface>
      )
    }

    return (
      <ReportChartFigure id={element.id} title={element.title} description={element.caption ?? ""} caption={element.caption} source={element.source} method={element.method} notes={element.notes}>
        {chartContent}
      </ReportChartFigure>
    )
  }

  if (element.type === "INTERPRETATION_BLOCK") {
    const text = element.description || element.content || "Sin descripcion disponible."
    const isNumberedFigure = /^\d+$/.test(String(element.id || ""))
    const displayTitle = isNumberedFigure
      ? `Figura ${element.id}. ${element.title || "Interpretación Metodológica"}.`
      : element.title || "Interpretación Metodológica"
    const figureSource = element.source || "elaboración propia con datos procesados por NetScope desde RIPE Atlas"
    const figureCaption = `${element.caption || displayTitle} Fuente: ${figureSource}.`

    return (
      <figure className="break-inside-avoid w-full print:my-6 print:break-inside-avoid">
        <Card className="report-surface border border-border/50 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:border-border/80 w-full print:rounded-none print:border-none print:shadow-none print:bg-transparent print:p-0 print:my-2 print:break-inside-avoid">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 border-b border-border pb-3 print:border-none print:p-0 print:pb-1.5">
            <div className="flex items-center gap-2 print:gap-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary print:hidden">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-base font-semibold print:text-[11pt] print:font-bold print:text-black print:mb-1">
                {displayTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 print:p-0 print:pt-1">
            <p className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90 print:text-[10pt] print:leading-[1.65] print:text-black print:text-justify font-sans">
              {text}
            </p>
          </CardContent>
        </Card>
        {isNumberedFigure && (
          <figcaption className="mt-2 text-left px-1 text-xs text-muted-foreground print:text-[9pt] print:italic print:text-gray-700 print:mt-1.5">
            {figureCaption}
          </figcaption>
        )}
      </figure>
    )
  }

  return null
}
