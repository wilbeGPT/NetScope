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

// Simulated RTT (ms) per hop per ISP, derived from RIPE Atlas traceroutes
const defaultData = [
  { hop: 1, Tigo: 4.2, Claro: 5.1, Movistar: 4.8, Digicel: 6.3 },
  { hop: 2, Tigo: 9.8, Claro: 11.4, Movistar: 10.2, Digicel: 13.1 },
  { hop: 3, Tigo: 18.6, Claro: 21.7, Movistar: 19.3, Digicel: 24.8 },
  { hop: 4, Tigo: 32.4, Claro: 38.9, Movistar: 35.1, Digicel: 41.2 },
  { hop: 5, Tigo: 54.1, Claro: 100.2, Movistar: 58.7, Digicel: 63.4 },
  { hop: 6, Tigo: 141.5, Claro: 118.3, Movistar: 82.9, Digicel: 89.7 },
  { hop: 7, Tigo: 152.8, Claro: 124.6, Movistar: 95.4, Digicel: 102.3 },
  { hop: 8, Tigo: 158.2, Claro: 129.1, Movistar: 108.6, Digicel: 115.8 },
  { hop: 9, Tigo: 162.7, Claro: 132.4, Movistar: 118.2, Digicel: 124.5 },
  { hop: 10, Tigo: 165.3, Claro: 134.8, Movistar: 124.7, Digicel: 131.2 },
]

const chartConfig = {
  Tigo: { label: "Tigo SV", color: "var(--chart-1)" },
  Claro: { label: "Claro SV", color: "var(--chart-2)" },
  Movistar: { label: "Movistar SV", color: "var(--chart-3)" },
  Digicel: { label: "Digicel SV", color: "var(--chart-4)" },
} satisfies ChartConfig

export function RttLineChart({ data = defaultData }: { data?: any[] }) {
  // Generate dynamic chart config and lines based on data keys
  const keys = data.length > 0 ? Object.keys(data[0]).filter(k => k !== "hop") : []
  const dynamicConfig = keys.reduce((acc, key, i) => {
    acc[key] = { label: key, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    return acc
  }, {} as ChartConfig)
  
  const activeConfig = data === defaultData ? chartConfig : dynamicConfig

  return (
    <ChartContainer config={activeConfig} className="aspect-auto h-[280px] w-full">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis
          dataKey="hop"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
          label={{
            value: "Número de hop",
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
        {Object.keys(activeConfig).map((key) => (
          <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
