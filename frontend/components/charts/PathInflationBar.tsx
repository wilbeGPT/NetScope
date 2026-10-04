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
        <XAxis dataKey="isp" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" ms" />
        <Tooltip formatter={(v: number) => [`${v} ms`, "Delta RTT"]} />
        <ReferenceLine y={20} stroke="hsl(var(--chart-5))" strokeDasharray="4 2" label={{ value: "Umbral 20ms", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Bar dataKey="delta_ms" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={`${entry.isp}-${i}`} fill={entry.delta_ms > 20 ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}