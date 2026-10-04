"use client"

import { BoxStat } from "@/lib/types"

function numeric(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeStat(item: BoxStat): BoxStat | null {
  const min = numeric(item.min)
  const q1 = numeric(item.q1)
  const median = numeric(item.median)
  const q3 = numeric(item.q3)
  const max = numeric(item.max)
  if (min === null || q1 === null || median === null || q3 === null || max === null) return null

  return {
    ...item,
    min,
    q1,
    median,
    q3,
    max,
    outliers: Array.isArray(item.outliers) ? item.outliers.map(numeric).filter((value): value is number => value !== null) : [],
    color: item.color || "var(--chart-1)",
  }
}

export function JitterBoxPlot({ stats = [] }: { stats?: BoxStat[] }) {
  const safeStats = stats.map(normalizeStat).filter((item): item is BoxStat => item !== null)

  if (!safeStats.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Sin datos de jitter disponibles.</p>
  }

  const width = 560
  const height = 280
  const padding = { top: 16, right: 16, bottom: 36, left: 44 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const maxValue = Math.max(
    1,
    ...safeStats.flatMap((s) => [s.min, s.q1, s.median, s.q3, s.max, ...s.outliers]),
  )
  const yMax = Math.ceil(maxValue / 10) * 10
  const yTicks = Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i))
  const colWidth = innerW / safeStats.length
  const boxWidth = Math.min(72, colWidth * 0.55)

  const yScale = (value: number) => padding.top + innerH - (Math.min(value, yMax) / yMax) * innerH

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Boxplot de distribucion de jitter por proveedor"
        className="h-[280px] w-full"
      >
        {yTicks.map((tick) => {
          const y = yScale(tick)
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                fontSize="11"
                fontFamily="var(--font-mono)"
                fill="var(--muted-foreground)"
              >
                {tick}
              </text>
            </g>
          )
        })}

        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="var(--border)" />
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="var(--border)" />

        <text
          transform={`translate(14 ${padding.top + innerH / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted-foreground)"
        >
          Jitter / dispersion (ms)
        </text>

        {safeStats.map((stat, index) => {
          const centerX = padding.left + colWidth * index + colWidth / 2
          const yMin = yScale(stat.min)
          const yQ1 = yScale(stat.q1)
          const yMedian = yScale(stat.median)
          const yQ3 = yScale(stat.q3)
          const yMaxValue = yScale(stat.max)
          const boxTop = Math.min(yQ1, yQ3)
          const boxHeight = Math.max(1, Math.abs(yQ3 - yQ1))

          return (
            <g key={`${stat.isp}-${index}`}>
              <line x1={centerX} x2={centerX} y1={yMaxValue} y2={yMin} stroke={stat.color} strokeWidth={2} />
              <line x1={centerX - boxWidth / 3} x2={centerX + boxWidth / 3} y1={yMaxValue} y2={yMaxValue} stroke={stat.color} strokeWidth={2} />
              <line x1={centerX - boxWidth / 3} x2={centerX + boxWidth / 3} y1={yMin} y2={yMin} stroke={stat.color} strokeWidth={2} />
              <rect
                x={centerX - boxWidth / 2}
                y={boxTop}
                width={boxWidth}
                height={boxHeight}
                fill={stat.color}
                fillOpacity={0.22}
                stroke={stat.color}
                strokeWidth={2}
                rx={3}
              />
              <line x1={centerX - boxWidth / 2} x2={centerX + boxWidth / 2} y1={yMedian} y2={yMedian} stroke={stat.color} strokeWidth={3} />

              {stat.outliers.slice(0, 25).map((outlier, outlierIndex) => (
                <circle
                  key={`${stat.isp}-outlier-${outlierIndex}`}
                  cx={centerX + ((outlierIndex % 5) - 2) * 3}
                  cy={yScale(outlier)}
                  r={2}
                  fill={stat.color}
                  opacity={0.55}
                />
              ))}

              <text
                x={centerX}
                y={height - 10}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-mono)"
                fill="var(--muted-foreground)"
              >
                {stat.isp.length > 18 ? `${stat.isp.slice(0, 18)}...` : stat.isp}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        {safeStats.map((stat) => (
          <div key={`legend-${stat.isp}`} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: stat.color }} aria-hidden="true" />
            <span>{stat.isp}: mediana {stat.median.toFixed(2)} ms</span>
          </div>
        ))}
      </div>
    </div>
  )
}