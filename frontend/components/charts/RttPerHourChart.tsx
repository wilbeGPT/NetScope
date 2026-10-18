"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RttPerHourPoint {
  hour: string
  [isp: string]: string | number
}

export function RttPerHourChart({ data = [] }: { data?: RttPerHourPoint[] }) {
  if (!data.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Sin datos temporales por hora.</div>
  }

  const isps = Object.keys(data[0] ?? {}).filter((key) => key !== "hour")
  const colors = [
    "var(--color-chart-1, #2563eb)",
    "var(--color-chart-2, #06b6d4)",
    "var(--color-chart-3, #10b981)",
    "var(--color-chart-4, #f59e0b)",
    "var(--color-chart-5, #ef4444)",
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted-foreground, #94a3b8)" }} interval={3} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground, #94a3b8)" }} unit=" ms" />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--card, #0f172a)", border: "1px solid var(--border, #1e293b)", borderRadius: "8px" }}
          itemStyle={{ color: "var(--foreground, #f8fafc)" }}
          formatter={(v: number) => [`${v} ms`]}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--foreground, #f8fafc)" }} />
        {isps.map((isp, i) => (
          <Line key={isp} type="monotone" dataKey={isp} stroke={colors[i % colors.length]} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}