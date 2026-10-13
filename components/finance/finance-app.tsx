"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Metric, MetricGrid, SectionLabel } from "@/components/dashboard/primitives"
import { CashChart, FlowChart } from "@/components/finance/finance-charts"
import {
  fetchFinance,
  line,
  money,
  monthName,
  signedMoney,
  type FinanceData,
} from "@/lib/finance"
import { cn } from "cn"

export function FinanceView() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    fetchFinance()
      .then((d) => {
        setData(d)
        const has = d.months.some((m) => m.month === d.currentMonth)
        setSelected(has ? d.currentMonth : (d.months.at(-1)?.month ?? null))
      })
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <Shell>
        <p className="text-muted-foreground">Unavailable</p>
      </Shell>
    )
  }
  if (!data || !selected) {
    return (
      <Shell>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </Shell>
    )
  }

  const month = data.months.find((m) => m.month === selected)!
  const elapsed = data.months.filter((m) => m.status !== "future")
  const flow = elapsed.map((m) => ({
    month: monthName(m.month),
    revenue: line(m, "Revenue")?.actual ?? 0,
    costs: line(m, "Operating costs")?.actual ?? 0,
  }))
  const cash = data.months.map((m) => ({
    month: monthName(m.month),
    actual: m.status === "future" ? null : (line(m, "Closing Reserve cash")?.actual ?? null),
    forecast: line(m, "Closing Reserve cash")?.forecast ?? 0,
  }))
  const closing = line(month, "Closing Reserve cash")

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {data.months.map((m) => (
            <Button
              key={m.month}
              role="tab"
              aria-selected={m.month === selected}
              variant={m.month === selected ? "default" : "secondary"}
              onClick={() => setSelected(m.month)}
              className="shrink-0"
            >
              {monthName(m.month)}
            </Button>
          ))}
        </div>

        <MetricGrid>
          <Metric
            label="Revenue"
            value={money(line(month, "Revenue")?.actual ?? 0)}
            hint={money(line(month, "Revenue")?.forecast ?? 0)}
          />
          <Metric
            label="Operating costs"
            value={money(line(month, "Operating costs")?.actual ?? 0)}
            hint={money(line(month, "Operating costs")?.forecast ?? 0)}
          />
          <Metric
            label="Closing cash"
            value={money(closing?.actual ?? 0)}
            hint={money(closing?.forecast ?? 0)}
          />
          <Metric
            label="On track"
            value={`${month.onTrack} / ${month.lines.length}`}
            hint={`${month.off} off`}
            tone={month.off === 0 ? "success" : "default"}
          />
        </MetricGrid>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{monthName(month.month)}</CardTitle>
            {month.status === "current" && <Badge>Partial</Badge>}
            {month.status === "future" && <Badge>Forecast</Badge>}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {month.lines.map((l) => (
                  <TableRow key={l.line} className={cn(l.off && "bg-destructive/20")}>
                    <TableCell className="font-bold">{l.line}</TableCell>
                    <TableCell className="text-right">{money(l.actual)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {money(l.forecast)}
                    </TableCell>
                    <TableCell className="text-right">{signedMoney(l.difference)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={l.off ? "danger" : "success"}>
                        {l.off ? "Off" : "On track"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <SectionLabel>Revenue and costs</SectionLabel>
            </CardHeader>
            <CardContent>
              <FlowChart data={flow} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SectionLabel>Closing cash</SectionLabel>
            </CardHeader>
            <CardContent>
              <CashChart data={cash} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.slice(0, 25).map((t, i) => {
                  const inflow = t.type === "Revenue" || t.type === "Transfer In"
                  return (
                    <TableRow key={`${t.date}-${i}`}>
                      <TableCell className="text-muted-foreground">{t.date}</TableCell>
                      <TableCell className="max-w-72 truncate">{t.transaction}</TableCell>
                      <TableCell className="text-muted-foreground">{t.category}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.account} {t.accountMask}
                      </TableCell>
                      <TableCell className={cn("text-right", inflow && "text-success")}>
                        {inflow ? "+" : "−"}฿{Math.round(t.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="px-2 pt-2 text-2xl font-bold">Finance</h1>
      {children}
    </div>
  )
}
