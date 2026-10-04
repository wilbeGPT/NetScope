import { ReportElement } from "@/lib/types"
import { ReportTableBlock } from "@/components/phases/ReportTableBlock"
import { ReportPngFigure } from "@/components/phases/ReportFigureBlock"
import { ReportChartFigure } from "@/components/phases/ReportChartFigure"
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
  "Movistar SV": "#2196F3",
  "Claro SV": "#F44336",
  "Conective SV": "#4CAF50",
  "Conective S.A.": "#4CAF50",
  UCA: "#FF9800",
  UES: "#9C27B0",
  "Liberty SV": "#00BCD4",
  "Liberty Networks SV": "#00BCD4",
  "Navega GT": "#795548",
  "Globalnet HN": "#607D8B",
}

const FALLBACK_COLORS = ["#2196F3", "#F44336", "#4CAF50", "#FF9800", "#9C27B0", "#00BCD4", "#795548", "#607D8B"]
const AXIS_TICK = { fontSize: 11, fill: "#94a3b8", fontFamily: "var(--font-mono)" }
const GRID = "#263244"

function colorFor(name: string, index = 0): string {
  return ISP_COLORS[name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

function tooltipStyle() {
  return {
    backgroundColor: "#111827",
    border: "1px solid #334155",
    borderRadius: "10px",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.32)",
    color: "#f8fafc",
  }
}

function ChartSurface({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 h-[390px] w-full rounded-xl border border-border bg-[var(--surface-subtle)] p-4">{children}</div>
}

function BoxPlotSvg({ rows }: { rows: any[] }) {
  const width = 940
  const height = 360
  const margin = { top: 28, right: 28, bottom: 92, left: 58 }
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom
  const yMax = 20
  const scaleY = (value: number) => margin.top + plotH - (Math.min(Math.max(value, 0), yMax) / yMax) * plotH
  const step = plotW / Math.max(rows.length, 1)
  const boxW = Math.min(54, step * 0.45)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" role="img">
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />
      {[0, 5, 10, 15, 20].map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={width - margin.right} y1={scaleY(tick)} y2={scaleY(tick)} stroke={GRID} strokeDasharray="3 3" />
          <text x={margin.left - 10} y={scaleY(tick) + 4} textAnchor="end" fill="#374151" fontSize="11">{tick}</text>
        </g>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotH} stroke="#6b7280" />
      <line x1={margin.left} x2={width - margin.right} y1={margin.top + plotH} y2={margin.top + plotH} stroke="#6b7280" />
      <text x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} fill="#111827" fontSize="12" textAnchor="middle">Jitter (ms)</text>
      {rows.map((row, index) => {
        const x = margin.left + step * index + step / 2
        const minY = scaleY(Number(row.min))
        const q1Y = scaleY(Number(row.q1))
        const medY = scaleY(Number(row.median))
        const q3Y = scaleY(Number(row.q3))
        const maxY = scaleY(Number(row.max))
        const fill = colorFor(String(row.isp ?? ""), index)
        return (
          <g key={row.isp ?? index}>
            <line x1={x} x2={x} y1={maxY} y2={minY} stroke="#111827" strokeWidth="1.2" />
            <line x1={x - boxW / 3} x2={x + boxW / 3} y1={maxY} y2={maxY} stroke="#111827" strokeWidth="1.2" />
            <line x1={x - boxW / 3} x2={x + boxW / 3} y1={minY} y2={minY} stroke="#111827" strokeWidth="1.2" />
            <rect x={x - boxW / 2} y={q3Y} width={boxW} height={Math.max(2, q1Y - q3Y)} fill={fill} opacity="0.75" stroke="#111827" />
            <line x1={x - boxW / 2} x2={x + boxW / 2} y1={medY} y2={medY} stroke="#000000" strokeWidth="2" />
            <text x={x} y={height - 44} textAnchor="end" transform={`rotate(-35 ${x} ${height - 44})`} fill="#111827" fontSize="10">
              {row.isp || ""}
            </text>
            {Number(row.outlierCount || 0) > 0 && (
              <text x={x} y={margin.top + 10} textAnchor="middle" fill="#6b7280" fontSize="10">+{row.outlierCount}</text>
            )}
          </g>
        )
      })}
      <text x={width - margin.right} y={margin.top + 8} textAnchor="end" fill="#6b7280" fontSize="11">Outliers extremos cortados en 20 ms para legibilidad</text>
    </svg>
  )
}

export function ElementRenderer({ element }: { element: ReportElement }) {
  if (element.type === "TABLE" || element.type === "DATA_TABLE") {
    return <ReportTableBlock table={element as any} />
  }

  if (element.type === "PNG") {
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
    if (element.kind === "table") return <ReportTableBlock table={element as any} />

    const { kind, rows, dataKey, dataKeys, categoryKey, baseline } = element as any
    const keysToRender = dataKeys && Array.isArray(dataKeys) ? dataKeys : dataKey ? [dataKey] : []
    let chartContent = <div className="py-8 text-center text-sm text-muted-foreground">Grafico dinamico no disponible.</div>

    const canRenderStandardChart = rows && rows.length > 0 && keysToRender.length > 0 && categoryKey
    const canRenderSpecialChart = rows && rows.length > 0 && (kind === "boxplot" || (kind === "dailyBarLine" && categoryKey))

    if (canRenderStandardChart || canRenderSpecialChart) {
      chartContent = (
        <ChartSurface>
          <ResponsiveContainer width="100%" height="100%">
            {kind === "dailyBarLine" ? (
              <ComposedChart data={rows} margin={{ top: 20, right: 36, left: 6, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={70} tickMargin={5} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "#111827" }} />
                {Number.isFinite(Number(baseline)) && <ReferenceLine y={Number(baseline)} stroke="#111827" strokeDasharray="5 5" label={{ value: "Linea base del analisis", fill: "#111827", fontSize: 11, position: "right" }} />}
                <Bar dataKey="RTT mediano diario" name="RTT mediano diario" fill="#2196F3" maxBarSize={48} />
                <Line type="monotone" dataKey="Promedio RTT" name="Promedio +/- StdDev" stroke="#F44336" strokeWidth={2} dot={{ fill: "#F44336", r: 4 }}>
                  <ErrorBar dataKey="StdDev" width={4} stroke="#F44336" />
                </Line>
                <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#111827" }} />
              </ComposedChart>
            ) : kind === "boxplot" ? (
              <BoxPlotSvg rows={rows as any[]} />
            ) : kind === "horizontalBar" ? (
              <BarChart data={rows} layout="vertical" margin={{ top: 20, right: 86, left: 24, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
                <XAxis type="number" tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <YAxis type="category" dataKey={categoryKey} width={112} tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "#111827" }} formatter={(value: number | string) => [`${Number(value).toFixed(1)} ms`, dataKey ?? "Overhead"]} />
                <ReferenceLine x={60} stroke="#F44336" strokeDasharray="5 5" label={{ value: "Umbral critico (60 ms)", fill: "#F44336", fontSize: 11, position: "top" }} />
                {Number.isFinite(Number(baseline)) && <ReferenceLine x={Number(baseline)} stroke="#2196F3" strokeDasharray="4 4" label={{ value: "Linea base del analisis", fill: "#2196F3", fontSize: 11, position: "insideTop" }} />}
                <Bar dataKey={dataKey} name={dataKey} radius={[0, 0, 0, 0]} maxBarSize={28}>
                  {rows.map((row: any, index: number) => <Cell key={`cell-${index}`} fill={colorFor(String(row[categoryKey]), index)} />)}
                  <LabelList dataKey={dataKey} position="right" formatter={(value: number | string) => `${Number(value).toFixed(1)} ms`} style={{ fill: "#111827", fontSize: 11, fontWeight: 700 }} />
                </Bar>
              </BarChart>
            ) : kind === "bar" ? (
              <BarChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={62} tickMargin={5} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "#111827" }} />
                {keysToRender.length > 1 && <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#111827" }} />}
                {keysToRender.map((key: string, index: number) => <Bar key={key} dataKey={key} name={key} fill={colorFor(key, index)} maxBarSize={60} />)}
              </BarChart>
            ) : kind === "line" ? (
              <LineChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={62} tickMargin={5} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "#111827" }} />
                {keysToRender.length > 1 && <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#111827" }} />}
                {keysToRender.map((key: string, index: number) => <Line key={key} name={key} type="monotone" dataKey={key} stroke={colorFor(key, index)} strokeWidth={2.4} dot={{ fill: colorFor(key, index), strokeWidth: 1, r: 3 }} activeDot={{ r: 5, fill: colorFor(key, index) }} />)}
              </LineChart>
            ) : kind === "area" ? (
              <AreaChart data={rows} margin={{ top: 20, right: 30, left: 6, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
                <XAxis dataKey={categoryKey} tick={AXIS_TICK} stroke="#6b7280" angle={-25} textAnchor="end" height={62} tickMargin={5} />
                <YAxis tick={AXIS_TICK} stroke="#6b7280" axisLine tickLine />
                <Tooltip contentStyle={tooltipStyle()} itemStyle={{ color: "#111827" }} />
                {keysToRender.length > 1 && <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px", color: "#111827" }} />}
                {keysToRender.map((key: string, index: number) => <Area key={key} name={key} type="monotone" dataKey={key} stroke={colorFor(key, index)} strokeWidth={2.2} fill={colorFor(key, index)} fillOpacity={0.18} />)}
              </AreaChart>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">Tipo de grafico dinamico no soportado ({kind}).</div>
            )}
          </ResponsiveContainer>
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
    return (
      <div className="mb-8">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span>??</span> {element.title}
        </h3>
        <div className="mb-4 border-y border-dashed border-slate-600 py-3">
          <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-200">{element.description || element.content || "Sin descripcion disponible."}</p>
        </div>
      </div>
    )
  }

  return null
}
