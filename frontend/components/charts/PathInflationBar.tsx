"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts"

interface InflationPoint {
  isp: string
  delta_ms: number
}

export function PathInflationBar({ data = [] }: { data?: InflationPoint[] }) {
  if (!data.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Sin datos de overhead.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="isp" tick={{ fontSize: 11, fill: "var(--muted-foreground, #94a3b8)" }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground, #94a3b8)" }} unit=" ms" />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--card, #0f172a)", border: "1px solid var(--border, #1e293b)", borderRadius: "8px" }}
          itemStyle={{ color: "var(--foreground, #f8fafc)" }}
          formatter={(v: number) => [`${v} ms`, "Delta RTT"]}
        />
        <ReferenceLine
          y={20}
          stroke="var(--color-chart-5, #ef4444)"
          strokeDasharray="4 2"
          label={{ value: "Umbral 20ms", fontSize: 10, fill: "var(--muted-foreground, #94a3b8)" }}
        />
        <Bar dataKey="delta_ms" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={`${entry.isp}-${i}`}
              fill={entry.delta_ms > 20 ? "var(--color-chart-1, #2563eb)" : "var(--color-chart-3, #10b981)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}