"use client"

import { Bar, BarChart, Pie, PieChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { baht } from "@/lib/format"
import type { TaskCounts } from "@/lib/types"

const cashFlowConfig = {
  expense: { label: "Expenses", color: "var(--chart-3)" },
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

export function CashFlowChart({
  data,
}: {
  data: { month: string; expense: number; revenue: number }[]
}) {
  return (
    <ChartContainer config={cashFlowConfig} className="aspect-auto h-52 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => baht(v)}
        />
        <ChartTooltip
          cursor={{ fill: "var(--accent)" }}
          content={
            <ChartTooltipContent
              hideLabel={false}
              formatter={(value, name) => (
                <span className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">
                    {cashFlowConfig[name as keyof typeof cashFlowConfig]
                      ?.label ?? name}
                  </span>
                  <span className="font-bold">{baht(Number(value))}</span>
                </span>
              )}
            />
          }
        />
        <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

export const taskStatusConfig = {
  done: { label: "Done", color: "var(--chart-1)" },
  inprog: { label: "In progress", color: "var(--chart-2)" },
  review: { label: "Review", color: "var(--chart-3)" },
  backlog: { label: "Backlog", color: "var(--chart-4)" },
} satisfies ChartConfig

export function TaskStatusChart({ counts }: { counts: TaskCounts }) {
  const data = (
    Object.keys(taskStatusConfig) as (keyof typeof taskStatusConfig)[]
  ).map((key) => ({
    status: key,
    value: counts[key],
    fill: `var(--color-${key})`,
  }))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-48">
      <ChartContainer
        config={taskStatusConfig}
        className="aspect-square size-full"
      >
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent hideLabel nameKey="status" />}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            innerRadius="65%"
            outerRadius="100%"
            stroke="none"
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl leading-none font-bold">{counts.total}</span>
        <span className="text-xs text-muted-foreground">tasks</span>
      </div>
    </div>
  )
}
