"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DailyRttPoint {
  date: string
  [isp: string]: string | number
}

/**
 * DailyRttChart — RTT promedio diario a lo largo de los días de medición.
 * Permite detectar tendencias de path inflation sostenida (Fase 5 — Estabilidad).
 */
export function DailyRttChart({ data }: { data?: DailyRttPoint[] }) {
  const sample: DailyRttPoint[] = data ?? Array.from({ length: 14 }, (_, i) => {
    const d = new Date(2024, 0, i + 1)
    return {
      date: d.toLocaleDateString("es-SV", { month: "short", day: "numeric" }),
      "ISP-A": 42 + Math.round(Math.random() * 10),
      "ISP-B": 68 + Math.round(Math.random() * 18),
    }
  })

  const isps = Object.keys(sample[0] ?? {}).filter((k) => k !== "date")
  const colors = [
    { stroke: "hsl(var(--chart-1))", fill: "hsl(var(--chart-1) / 0.15)" },
    { stroke: "hsl(var(--chart-2))", fill: "hsl(var(--chart-2) / 0.15)" },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={sample} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" ms" />
        <Tooltip formatter={(v: number) => [`${v} ms`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {isps.map((isp, i) => (
          <Area
            key={isp}
            type="monotone"
            dataKey={isp}
            stroke={colors[i % colors.length].stroke}
            fill={colors[i % colors.length].fill}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
