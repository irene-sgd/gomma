"use client"

import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
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
  type FinanceMonth,
} from "@/lib/finance"
import { cn } from "cn"

const sum = (months: FinanceMonth[], name: string, key: "actual" | "forecast") =>
  months.reduce((total, m) => total + (line(m, name)?.[key] ?? 0), 0)

const netFlow = (months: FinanceMonth[], key: "actual" | "forecast") =>
  sum(months, "Revenue", key) -
  sum(months, "Operating costs", key) -
  sum(months, "Tax reserve", key) -
  sum(months, "Owner salary", key) -
  sum(months, "Norway transfer", key)

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
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </Shell>
    )
  }

  const elapsed = data.months.filter((m) => m.status !== "future")
  const latest = elapsed.at(-1)
  const cash = line(latest, "Closing Reserve cash")
  const burn =
    (line(latest, "Operating costs")?.forecast ?? 0) +
    (line(latest, "Owner salary")?.forecast ?? 0)
  const runway = burn > 0 && cash ? cash.actual / burn : null
  const detail = data.months.find((m) => m.month === selected)!

  const flow = data.months.map((m) => ({
    month: monthName(m.month),
    revenue: m.status === "future" ? null : (line(m, "Revenue")?.actual ?? 0),
    costs: m.status === "future" ? null : (line(m, "Operating costs")?.actual ?? 0),
    revenueForecast: line(m, "Revenue")?.forecast ?? 0,
    costsForecast: line(m, "Operating costs")?.forecast ?? 0,
  }))
  const cashSeries = data.months.map((m) => ({
    month: monthName(m.month),
    actual: m.status === "future" ? null : (line(m, "Closing Reserve cash")?.actual ?? null),
    forecast: line(m, "Closing Reserve cash")?.forecast ?? 0,
  }))

  return (
    <Shell>
      <div className="flex flex-col gap-2">
        <ReviewWidget months={data.months} />
        <MetricGrid>
          <Metric
            label="Cash"
            value={money(cash?.actual ?? 0)}
            hint={runway === null ? money(cash?.forecast ?? 0) : `${runway.toFixed(1)} months runway`}
            tone={(cash?.actual ?? 0) < 0 ? "default" : "success"}
          />
          <Metric
            label="Revenue to date"
            value={money(sum(elapsed, "Revenue", "actual"))}
            hint={money(sum(elapsed, "Revenue", "forecast"))}
          />
          <Metric
            label="Operating costs to date"
            value={money(sum(elapsed, "Operating costs", "actual"))}
            hint={money(sum(elapsed, "Operating costs", "forecast"))}
          />
          <Metric
            label="Net cash flow to date"
            value={money(netFlow(elapsed, "actual"))}
            hint={money(netFlow(elapsed, "forecast"))}
          />
        </MetricGrid>

        <Card>
          <CardHeader>
            <SectionLabel>Months</SectionLabel>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Costs</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">On track</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elapsed.map((m) => {
                  const rev = line(m, "Revenue")
                  const cost = line(m, "Operating costs")
                  const c = line(m, "Closing Reserve cash")
                  return (
                    <TableRow
                      key={m.month}
                      role="button"
                      tabIndex={0}
                      aria-pressed={m.month === selected}
                      onClick={() => setSelected(m.month)}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(m.month)}
                      className={cn("cursor-pointer", m.month === selected && "bg-secondary")}
                    >
                      <TableCell className="font-bold">
                        {monthName(m.month)}
                        {m.status === "current" && (
                          <Badge className="ml-2">Partial</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{money(rev?.actual ?? 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {money(rev?.forecast ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">{money(cost?.actual ?? 0)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {money(cost?.forecast ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">{money(c?.actual ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={m.off === 0 ? "success" : "danger"}>
                          {m.onTrack} / {m.lines.length}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
              <CashChart data={cashSeries} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <CardTitle>Month detail</CardTitle>
            <label className="flex items-center gap-2">
              <span className="sr-only">Month</span>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="h-9 rounded-full bg-secondary px-4 font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {data.months.map((m) => (
                  <option key={m.month} value={m.month}>
                    {monthName(m.month)}
                  </option>
                ))}
              </select>
            </label>
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
                {detail.lines.map((l) => (
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

// The review is done on the 1st, for the month that just closed. Until a month has closed,
// the running month is shown as a preview with its review date.
function ReviewWidget({ months }: { months: FinanceMonth[] }) {
  const closed = months.filter((m) => m.status === "past").at(-1)
  const month = closed ?? months.find((m) => m.status === "current") ?? months[0]
  const [y, m] = month.month.split("-").map(Number)
  const reviewDate = `1 ${monthName(`${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, "0")}`)}`
  const total = month.lines.length
  const off = month.lines
    .filter((l) => l.off)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
  const key = ["Revenue", "Operating costs", "Closing Reserve cash"]
    .map((name) => line(month, name))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <SectionLabel>Monthly actuals vs forecast review</SectionLabel>
        <div className="flex items-center gap-2">
          {!closed && <Badge>Partial</Badge>}
          <Badge variant="default">{reviewDate}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{monthName(month.month)}</p>
              <p className="text-3xl font-bold">
                {month.onTrack} / {total}
              </p>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-tinted"
              role="img"
              aria-label={`${month.onTrack} of ${total} lines on track`}
            >
              <div
                className="h-full bg-success"
                style={{ width: `${(month.onTrack / total) * 100}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {key.map((l) => (
              <div key={l.line} className="rounded-md bg-secondary p-4">
                <p className="text-sm text-muted-foreground">{l.line}</p>
                <p className="text-xl font-bold">{money(l.actual)}</p>
                <p className="text-xs text-muted-foreground">
                  {money(l.forecast)} · {signedMoney(l.difference)}
                </p>
              </div>
            ))}
          </div>
        </div>
        {off.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Off forecast</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Difference</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {off.map((l) => (
                <TableRow key={l.line}>
                  <TableCell className="font-bold">{l.line}</TableCell>
                  <TableCell className="text-right">{money(l.actual)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {money(l.forecast)}
                  </TableCell>
                  <TableCell className="text-right">{signedMoney(l.difference)}</TableCell>
                  <TableCell className="text-right">
                    {l.forecast === 0
                      ? "—"
                      : `${l.difference < 0 ? "−" : "+"}${Math.round((Math.abs(l.difference) / Math.abs(l.forecast)) * 100)}%`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-success">All lines within 10%</p>
        )}
      </CardContent>
    </Card>
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
