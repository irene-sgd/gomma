"use client"

import { useEffect, useState } from "react"
import { ChevronDownIcon, RefreshCwIcon, SparklesIcon, XIcon } from "lucide-react"

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
import { Metric, SectionLabel } from "@/components/dashboard/primitives"
import { CashChart, FlowChart, MarginChart } from "@/components/finance/finance-charts"
import {
  fetchFinance,
  fetchReports,
  improvements,
  line,
  margin,
  money,
  monthName,
  pct,
  pnl,
  saveReport,
  signedMoney,
  type FinanceData,
  type FinanceMonth,
  type StoredReport,
} from "@/lib/finance"
import { cn } from "cn"

export function FinanceView() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [reports, setReports] = useState<Record<string, StoredReport>>({})
  const [storage, setStorage] = useState(true)
  const [archive, setArchive] = useState(false)

  useEffect(() => {
    fetchReports().then((list) => {
      if (list === null) setStorage(false)
      else setReports(Object.fromEntries(list.map((r) => [r.month, r])))
    })
  }, [])

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
  const cash = line(latest, "Closing cash")
  const burn =
    (line(latest, "Operating costs")?.forecast ?? 0) +
    (line(latest, "Owner salary")?.forecast ?? 0)
  const runway = burn > 0 && cash ? cash.actual / burn : null
  const detail = data.months.find((m) => m.month === selected)!
  const actual = pnl(elapsed, "actual")
  const plan = pnl(elapsed, "forecast")
  const opMargin = margin(actual.operating, actual.revenue)
  const opPlanMargin = margin(plan.operating, plan.revenue)
  const netMargin = margin(actual.net, actual.revenue)
  const netPlanMargin = margin(plan.net, plan.revenue)

  const marginSeries = data.months.map((m) => {
    const a = pnl([m], "actual")
    const f = pnl([m], "forecast")
    const pc = (v: number | null) => (v === null ? null : Math.round(v * 1000) / 10)
    const done = m.status !== "future"
    return {
      month: monthName(m.month),
      operating: done ? pc(margin(a.operating, a.revenue)) : null,
      net: done ? pc(margin(a.net, a.revenue)) : null,
      operatingForecast: pc(margin(f.operating, f.revenue)),
      netForecast: pc(margin(f.net, f.revenue)),
    }
  })

  const flow = data.months.map((m) => ({
    month: monthName(m.month),
    revenue: m.status === "future" ? null : (line(m, "Revenue")?.actual ?? 0),
    costs: m.status === "future" ? null : (line(m, "Operating costs")?.actual ?? 0),
    revenueForecast: line(m, "Revenue")?.forecast ?? 0,
    costsForecast: line(m, "Operating costs")?.forecast ?? 0,
  }))
  const cashSeries = data.months.map((m) => ({
    month: monthName(m.month),
    actual: m.status === "future" ? null : (line(m, "Closing cash")?.actual ?? null),
    forecast: line(m, "Closing cash")?.forecast ?? 0,
  }))

  return (
    <Shell
      action={
        Object.keys(reports).length > 0 ? (
          <button
            type="button"
            onClick={() => setArchive((v) => !v)}
            aria-pressed={archive}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-secondary px-4 font-bold outline-none transition-colors hover:bg-tinted focus-visible:ring-[3px] focus-visible:ring-ring aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            <SparklesIcon className="size-4" aria-hidden />
            Reports
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-2">
        <ReviewWidget
          key={archive ? "archive" : "bar"}
          archive={archive}
          onArchiveClose={() => setArchive(false)}
          months={data.months}
          reports={reports}
          storage={storage}
          onSave={async (month) => {
            const saved = await saveReport(month)
            setReports((prev) => ({ ...prev, [saved.month]: saved }))
          }}
        />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <Metric
            label="Cash"
            value={money(cash?.actual ?? 0)}
            hint={runway === null ? money(cash?.forecast ?? 0) : `${runway.toFixed(1)} months runway`}
            tone={(cash?.actual ?? 0) < 0 ? "default" : "success"}
          />
          <Metric
            label="Revenue"
            value={money(actual.revenue)}
            hint={`Forecast ${money(plan.revenue)}`}
          />
          <Metric
            label="Operating profit"
            value={money(actual.operating)}
            hint={`${pct(opMargin)} margin · forecast ${pct(opPlanMargin)}`}
            tone={actual.operating < 0 ? "default" : "success"}
          />
          <Metric
            label="Net profit"
            value={money(actual.net)}
            hint={`${pct(netMargin)} margin · forecast ${pct(netPlanMargin)}`}
            tone={actual.net < 0 ? "default" : "success"}
          />
          <Metric
            label="Net cash flow"
            value={money(actual.cashFlow)}
            hint={`Forecast ${money(plan.cashFlow)}`}
          />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Profit and loss</CardTitle>
            <Badge>To date</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead />
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Forecast</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  [
                    ["Revenue", actual.revenue, plan.revenue, true],
                    ["Operating costs", -actual.costs, -plan.costs, false],
                    ["Operating profit", actual.operating, plan.operating, true],
                    ["Tax reserve", -actual.tax, -plan.tax, false],
                    ["Owner salary", -actual.salary, -plan.salary, false],
                    ["Net profit", actual.net, plan.net, true],
                    ["Owner transfers", -actual.transfers, -plan.transfers, false],
                    ["Net cash flow", actual.cashFlow, plan.cashFlow, true],
                  ] as [string, number, number, boolean][]
                ).map(([name, a, f, strong]) => (
                  <TableRow key={name} className={cn(strong && "bg-secondary")}>
                    <TableCell className={cn(strong && "font-bold")}>{name}</TableCell>
                    <TableCell className={cn("text-right", strong && "font-bold")}>
                      {money(a)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{money(f)}</TableCell>
                    <TableCell className="text-right">{signedMoney(a - f)}</TableCell>
                  </TableRow>
                ))}
                {(
                  [
                    ["Operating margin", opMargin, opPlanMargin],
                    ["Net margin", netMargin, netPlanMargin],
                  ] as [string, number | null, number | null][]
                ).map(([name, a, f]) => (
                  <TableRow key={name}>
                    <TableCell>{name}</TableCell>
                    <TableCell className="text-right">{pct(a)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{pct(f)}</TableCell>
                    <TableCell className="text-right">
                      {a === null || f === null
                        ? "—"
                        : `${a - f < 0 ? "−" : "+"}${Math.round(Math.abs(a - f) * 100)} pts`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Cash</TableHead>
                  <TableHead className="text-right">On track</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {elapsed.map((m) => {
                  const rev = line(m, "Revenue")
                  const cost = line(m, "Operating costs")
                  const c = line(m, "Closing cash")
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
                      <TableCell className="text-right">
                        {pct(margin(pnl([m], "actual").operating, pnl([m], "actual").revenue))}
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

        <Card>
          <CardHeader>
            <SectionLabel>Revenue and costs</SectionLabel>
          </CardHeader>
          <CardContent>
            <FlowChart data={flow} />
          </CardContent>
        </Card>
        <div className="grid gap-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <SectionLabel>Margin</SectionLabel>
            </CardHeader>
            <CardContent>
              <MarginChart data={marginSeries} />
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

// The monthly report. The whole bar is the button. Closing it with the X saves that month's
// actuals vs forecast to the database; saved months are shown as they were saved.
function reviewMonthOf(months: FinanceMonth[]) {
  const closed = months.filter((m) => m.status === "past").at(-1)
  return {
    closed,
    month: closed ?? months.find((m) => m.status === "current") ?? months[0],
  }
}

const savedOn = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" })

function ReviewWidget({
  months,
  reports,
  storage,
  archive,
  onArchiveClose,
  onSave,
}: {
  months: FinanceMonth[]
  reports: Record<string, StoredReport>
  storage: boolean
  archive: boolean
  onArchiveClose: () => void
  onSave: (month: string) => Promise<void>
}) {
  const { closed, month: reviewMonth } = reviewMonthOf(months)
  const [open, setOpen] = useState(archive)
  const [dismissed, setDismissed] = useState(false)
  const [picked, setPicked] = useState(
    archive ? (Object.keys(reports).sort().at(-1) ?? reviewMonth.month) : reviewMonth.month
  )
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const live = months.find((m) => m.month === picked)
  const stored = reports[picked]
  // A report saved while the month was still running is not final once the month has closed.
  const stale = Boolean(stored && stored.data.status !== "past" && live?.status === "past")
  const saved = Boolean(stored) && !stale
  const month = (!stale ? stored?.data : undefined) ?? live ?? reviewMonth

  const choices = (
    archive ? Object.keys(reports) : Array.from(new Set([reviewMonth.month, ...Object.keys(reports)]))
  ).sort((a, b) => (a < b ? 1 : -1))

  async function save() {
    setBusy(true)
    setFailed(false)
    try {
      await onSave(picked)
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setBusy(false)
    }
  }

  // Closing saves the report and removes the bar from the page; the report stays in the database.
  async function closeReport() {
    if (archive) return onArchiveClose()
    if ((!stored || (stale && !archive)) && storage && !(await save())) return
    setOpen(false)
    setDismissed(true)
  }

  const [y, m] = reviewMonth.month.split("-").map(Number)
  const reviewDate = `1 ${monthName(`${m === 12 ? y + 1 : y}-${String((m % 12) + 1).padStart(2, "0")}`)}`
  const total = month.lines.length
  const todo = improvements(month)
  const off = month.lines
    .filter((l) => l.off)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
  const key = ["Revenue", "Operating costs", "Closing cash"]
    .map((name) => line(month, name))
    .filter((l): l is NonNullable<typeof l> => Boolean(l))
  const reportActual = pnl([month], "actual")
  const reportPlan = pnl([month], "forecast")
  const reportMargin = margin(reportActual.operating, reportActual.revenue)
  const reportPlanMargin = margin(reportPlan.operating, reportPlan.revenue)
  const reviewReport = reports[reviewMonth.month]
  const reviewSaved = Boolean(
    reviewReport && (reviewReport.data.status === "past" || reviewMonth.status !== "past")
  )
  if (!archive && (reviewSaved || dismissed)) return null

  return (
    <section className="rounded-lg bg-accent">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="finance-report"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg p-5 text-left outline-none transition-colors hover:bg-tinted focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <SparklesIcon className="size-5 shrink-0" aria-hidden />
            <span className="text-lg font-bold">
              {archive ? "Saved reports" : "Monthly report"}
            </span>
            {!archive && (
              <>
                <Badge>{monthName(reviewMonth.month)}</Badge>
                {!closed && <Badge>Partial</Badge>}
                <Badge variant={reviewMonth.off === 0 ? "success" : "danger"}>
                  {reviewMonth.onTrack} / {reviewMonth.lines.length}
                </Badge>
              </>
            )}
            {archive ? (
              <Badge variant="success">Saved</Badge>
            ) : (
              <Badge variant="active">{reviewDate}</Badge>
            )}
          </span>
          {!open && (
            <ChevronDownIcon className="size-5 shrink-0" aria-hidden />
          )}
        </button>
        {open && (
          <button
            type="button"
            onClick={closeReport}
            disabled={busy}
            aria-label={saved || !storage || archive ? "Close report" : "Save and close report"}
            className="m-3 flex size-10 shrink-0 items-center justify-center self-center rounded-full bg-primary text-primary-foreground outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
          >
            <XIcon className="size-5" aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div id="finance-report" className="flex flex-col gap-4 px-5 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="sr-only">Report month</span>
              <select
                value={picked}
                onChange={(e) => setPicked(e.target.value)}
                className="h-9 rounded-full bg-secondary px-4 font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                {choices.map((c) => (
                  <option key={c} value={c}>
                    {monthName(c)}
                    {reports[c] ? " · Saved" : ""}
                  </option>
                ))}
              </select>
            </label>
            {saved && stored && <Badge variant="success">Saved {savedOn(stored.savedAt)}</Badge>}
            {!saved && storage && <Badge>Not saved</Badge>}
            {!storage && <Badge>Storage unavailable</Badge>}
            {failed && <Badge variant="danger">Not saved</Badge>}
            {busy && <Badge>Saving</Badge>}
            {stored && live && storage && (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-secondary px-4 font-bold outline-none transition-colors hover:bg-tinted focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
              >
                <RefreshCwIcon className="size-4" aria-hidden />
                Update
              </button>
            )}
          </div>

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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {key.map((l) => (
                <div key={l.line} className="rounded-md bg-secondary p-4">
                  <p className="text-sm text-muted-foreground">{l.line}</p>
                  <p className="text-xl font-bold">{money(l.actual)}</p>
                  <p className="text-xs text-muted-foreground">
                    {money(l.forecast)} · {signedMoney(l.difference)}
                  </p>
                </div>
              ))}
              <div className="rounded-md bg-secondary p-4">
                <p className="text-sm text-muted-foreground">Operating margin</p>
                <p className="text-xl font-bold">{pct(reportMargin)}</p>
                <p className="text-xs text-muted-foreground">{pct(reportPlanMargin)} forecast</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-secondary p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
              <SparklesIcon className="size-3" aria-hidden />
              To improve
            </p>
            {todo.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {todo.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-success">All lines within 10%</p>
            )}
          </div>

          {off.length > 0 && (
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
          )}
        </div>
      )}
    </section>
  )
}

function Shell({
  children,
  action,
}: {
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <h1 className="text-2xl font-bold">Finance</h1>
        {action}
      </div>
      {children}
    </div>
  )
}
