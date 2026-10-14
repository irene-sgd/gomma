"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

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
} satisfies ChartConfig

const cashConfig = {
  cash: { label: "Closing cash", color: "var(--chart-1)" },
} satisfies ChartConfig

const marginConfig = {
  operating: { label: "Operating margin", color: "var(--chart-1)" },
  net: { label: "Net margin", color: "var(--chart-2)" },
} satisfies ChartConfig

const tooltip = (config: ChartConfig, format: (n: number) => string) => (
  <ChartTooltipContent
    formatter={(value, name) => (
      <span className="flex w-full items-center justify-between gap-4">
        <span className="text-muted-foreground">
          {config[name as string]?.label ?? name}
        </span>
        <span className="font-bold">{format(Number(value))}</span>
      </span>
    )}
  />
)

export function FlowChart({
  data,
}: {
  data: { month: string; revenue: number; costs: number }[]
}) {
  return (
    <ChartContainer config={flowConfig} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--tinted)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(v: number) => money(v)}
        />
        <ChartTooltip
          cursor={{ fill: "var(--accent)" }}
          content={tooltip(flowConfig, money)}
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
        <Bar dataKey="costs" fill="var(--color-costs)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

export function CashChart({ data }: { data: { month: string; cash: number }[] }) {
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
        <ChartTooltip content={tooltip(cashConfig, money)} />
        <Line dataKey="cash" stroke="var(--color-cash)" strokeWidth={2} dot />
      </LineChart>
    </ChartContainer>
  )
}

export function MarginChart({
  data,
}: {
  data: { month: string; operating: number | null; net: number | null }[]
}) {
  return (
    <ChartContainer config={marginConfig} className="aspect-auto h-56 w-full">
      <LineChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--tinted)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v: number) => `${v}%`}
        />
        <ChartTooltip
          content={tooltip(marginConfig, (n) => `${Math.round(n)}%`)}
        />
        <Line dataKey="operating" stroke="var(--color-operating)" strokeWidth={2} dot />
        <Line dataKey="net" stroke="var(--color-net)" strokeWidth={2} dot />
      </LineChart>
    </ChartContainer>
  )
}
