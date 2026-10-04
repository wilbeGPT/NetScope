"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export function RttPerHopChart({ data = [] }: { data?: any[] }) {
  if (!data.length) {
    return <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Sin datos de RTT por hop.</div>
  }

  const keys = Object.keys(data[0]).filter((key) => key !== "hop")
  const config = keys.reduce((acc, key, i) => {
    acc[key] = { label: key, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    return acc
  }, {} as ChartConfig)

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="hop"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          label={{
            value: "Numero de hop",
            position: "insideBottom",
            offset: -2,
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          label={{
            value: "RTT (ms)",
            angle: -90,
            position: "insideLeft",
            offset: 12,
            fontSize: 11,
            fill: "var(--muted-foreground)",
          }}
        />
        <ChartTooltip cursor={{ stroke: "var(--border)" }} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}