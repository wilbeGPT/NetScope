"use client"

// Custom SVG box plot since Recharts has no native box plot.
// Each entry contains quartile statistics derived from RIPE Atlas jitter samples.
type BoxStat = {
  isp: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  color: string
}

const defaultStats: BoxStat[] = [
  { isp: "Tigo", min: 1.2, q1: 4.8, median: 8.6, q3: 14.2, max: 22.4, outliers: [31.5, 38.7], color: "var(--chart-1)" },
  { isp: "Claro", min: 0.9, q1: 3.6, median: 6.4, q3: 11.8, max: 19.1, outliers: [27.3], color: "var(--chart-2)" },
  { isp: "Movistar", min: 0.6, q1: 2.4, median: 4.2, q3: 7.6, max: 13.4, outliers: [21.8], color: "var(--chart-3)" },
  { isp: "Digicel", min: 1.5, q1: 5.4, median: 9.8, q3: 16.4, max: 25.7, outliers: [34.2, 41.6, 47.8], color: "var(--chart-4)" },
]

const Y_MAX = 50
const Y_TICKS = [0, 10, 20, 30, 40, 50]

export function JitterBoxPlot({ stats = defaultStats }: { stats?: BoxStat[] }) {
  // viewBox-based responsive SVG
  const width = 560
  const height = 280
  const padding = { top: 16, right: 16, bottom: 36, left: 44 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const colWidth = innerW / stats.length
  const boxWidth = Math.min(72, colWidth * 0.55)

  const yScale = (v: number) => padding.top + innerH - (v / Y_MAX) * innerH

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Box plot de distribución de jitter por ISP"
        className="h-[280px] w-full"
      >
        {/* Y axis grid + ticks */}
        {Y_TICKS.map((t) => {
          const y = yScale(t)
          return (
            <g key={t}>
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
                {t}
              </text>
            </g>
          )
        })}

        {/* Y axis label */}
        <text
          transform={`translate(12 ${padding.top + innerH / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize="11"
          fill="var(--muted-foreground)"
        >
          Jitter (ms)
        </text>

        {/* Boxes per ISP */}
        {stats.map((s, i) => {
          const cx = padding.left + colWidth * i + colWidth / 2
          const xLeft = cx - boxWidth / 2
          const yMin = yScale(s.min)
          const yQ1 = yScale(s.q1)
          const yMed = yScale(s.median)
          const yQ3 = yScale(s.q3)
          const yMax = yScale(s.max)

          return (
            <g key={s.isp}>
              {/* Whisker line */}
              <line x1={cx} x2={cx} y1={yMax} y2={yMin} stroke={s.color} strokeWidth={1.5} />
              {/* Min cap */}
              <line x1={cx - 14} x2={cx + 14} y1={yMin} y2={yMin} stroke={s.color} strokeWidth={1.5} />
              {/* Max cap */}
              <line x1={cx - 14} x2={cx + 14} y1={yMax} y2={yMax} stroke={s.color} strokeWidth={1.5} />
              {/* Box (Q1-Q3) */}
              <rect
                x={xLeft}
                y={yQ3}
                width={boxWidth}
                height={Math.max(2, yQ1 - yQ3)}
                fill={s.color}
                fillOpacity={0.18}
                stroke={s.color}
                strokeWidth={1.5}
                rx={2}
              />
              {/* Median */}
              <line
                x1={xLeft}
                x2={xLeft + boxWidth}
                y1={yMed}
                y2={yMed}
                stroke={s.color}
                strokeWidth={2.5}
              />
              {/* Outliers */}
              {s.outliers.map((o, idx) => (
                <circle
                  key={idx}
                  cx={cx}
                  cy={yScale(Math.min(o, Y_MAX))}
                  r={3}
                  fill="var(--background)"
                  stroke={s.color}
                  strokeWidth={1.5}
                />
              ))}
              {/* X label */}
              <text
                x={cx}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--font-mono)"
                fill="var(--foreground)"
              >
                {s.isp}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend / summary */}
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.isp} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
            <span className="font-mono text-foreground">{s.isp}</span>
            <span className="ml-auto font-mono">μ={s.median} ms</span>
          </div>
        ))}
      </div>
    </div>
  )
}
