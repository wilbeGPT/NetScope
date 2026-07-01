"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from "recharts"

interface InflationPoint {
  isp: string
  delta_ms: number
}

/**
 * PathInflationBar — delta RTT (ms) por ISP respecto a la línea base.
 * Barras rojas = inflación positiva, verdes = sin inflación.
 * Línea de referencia en el umbral de 20 ms del paper.
 */
export function PathInflationBar({ data }: { data?: InflationPoint[] }) {
  const sample: InflationPoint[] = data ?? [
    { isp: "AS3356", delta_ms: 8 },
    { isp: "AS6461", delta_ms: 34 },
    { isp: "AS1299", delta_ms: 52 },
    { isp: "AS174",  delta_ms: 12 },
    { isp: "AS3257", delta_ms: 67 },
  ]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={sample} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis dataKey="isp" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit=" ms" />
        <Tooltip formatter={(v: number) => [`${v} ms`, "Δ RTT"]} />
        <ReferenceLine y={20} stroke="hsl(var(--chart-5))" strokeDasharray="4 2" label={{ value: "Umbral 20ms", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Bar dataKey="delta_ms" radius={[4, 4, 0, 0]}>
          {sample.map((entry, i) => (
            <Cell key={i} fill={entry.delta_ms > 20 ? "hsl(var(--chart-1))" : "hsl(var(--chart-3))"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
