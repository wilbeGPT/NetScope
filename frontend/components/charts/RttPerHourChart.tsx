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
  const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
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