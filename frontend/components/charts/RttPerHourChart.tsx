"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RttPerHourPoint {
  hour: string
  [isp: string]: string | number
}

/**
 * RttPerHourChart — RTT promedio por hora del día, segmentado por ISP.
 * Muestra patrones diurnos/nocturnos de latencia del paper.
 */
export function RttPerHourChart({ data }: { data?: RttPerHourPoint[] }) {
  const sample: RttPerHourPoint[] = data ?? Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    "ISP-A": 40 + Math.round(Math.sin(i / 4) * 12),
    "ISP-B": 65 + Math.round(Math.cos(i / 3) * 18),
  }))

  const isps = Object.keys(sample[0] ?? {}).filter((k) => k !== "hour")
  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={sample} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
        <YAxis tick={{ fontSize: 11 }} unit=" ms" />
        <Tooltip formatter={(v: number) => [`${v} ms`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {isps.map((isp, i) => (
          <Line key={isp} type="monotone" dataKey={isp} stroke={colors[i % colors.length]} dot={false} strokeWidth={2} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
