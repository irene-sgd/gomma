"use client"

import { Bar, CartesianGrid, ComposedChart, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { money } from "@/lib/finance"

const flowConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  costs: { label: "Operating costs", color: "var(--chart-3)" },
  revenueForecast: { label: "Revenue forecast", color: "var(--chart-2)" },
  costsForecast: { label: "Costs forecast", color: "var(--chart-5)" },
} satisfies ChartConfig

const cashConfig = {
  actual: { label: "Actual", color: "var(--chart-1)" },
  forecast: { label: "Forecast", color: "var(--chart-2)" },
} satisfies ChartConfig

const tooltip = (config: ChartConfig) => (
  <ChartTooltipContent
    formatter={(value, name) => (
      <span className="flex w-full items-center justify-between gap-4">
        <span className="text-muted-foreground">
          {config[name as string]?.label ?? name}
        </span>
        <span className="font-bold">{money(Number(value))}</span>
      </span>
    )}
  />
)

export function FlowChart({
  data,
}: {
  data: {
    month: string
    revenue: number | null
    costs: number | null
    revenueForecast: number
    costsForecast: number
  }[]
}) {
  return (
    <ChartContainer config={flowConfig} className="aspect-auto h-56 w-full">
      <ComposedChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--tinted)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => money(v)}
        />
        <ChartTooltip cursor={{ fill: "var(--accent)" }} content={tooltip(flowConfig)} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="costs" fill="var(--color-costs)" radius={4} />
        <Line
          dataKey="revenueForecast"
          stroke="var(--color-revenueForecast)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          dataKey="costsForecast"
          stroke="var(--color-costsForecast)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </ComposedChart>
    </ChartContainer>
  )
}

export function CashChart({
  data,
}: {
  data: { month: string; actual: number | null; forecast: number }[]
}) {
  return (
    <ChartContainer config={cashConfig} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--tinted)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => money(v)}
        />
        <ChartTooltip content={tooltip(cashConfig)} />
        <Line
          dataKey="forecast"
          stroke="var(--color-forecast)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          dataKey="actual"
          stroke="var(--color-actual)"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
