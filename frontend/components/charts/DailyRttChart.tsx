"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DailyRttPoint {
  date: string
  [isp: string]: string | number
}

export function DailyRttChart({ data = [] }: { data?: DailyRttPoint[] }) {
  if (!data.length) {
    return <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Sin datos temporales diarios.</div>
  }

  const isps = Object.keys(data[0] ?? {}).filter((key) => key !== "date")
  const colors = [
    { stroke: "hsl(var(--chart-1))", fill: "hsl(var(--chart-1) / 0.15)" },
    { stroke: "hsl(var(--chart-2))", fill: "hsl(var(--chart-2) / 0.15)" },
    { stroke: "hsl(var(--chart-3))", fill: "hsl(var(--chart-3) / 0.15)" },
    { stroke: "hsl(var(--chart-4))", fill: "hsl(var(--chart-4) / 0.15)" },
    { stroke: "hsl(var(--chart-5))", fill: "hsl(var(--chart-5) / 0.15)" },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" ms" />
        <Tooltip formatter={(v: number) => [`${v} ms`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {isps.map((isp, i) => (
          <Area key={isp} type="monotone" dataKey={isp} stroke={colors[i % colors.length].stroke} fill={colors[i % colors.length].fill} strokeWidth={2} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}