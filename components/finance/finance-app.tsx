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
      .then(setData)
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <Shell>
        <p className="text-muted-foreground">Unavailable</p>
      </Shell>
    )
  }
  if (!data) {
    return (
      <Shell>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Shell>
    )
  }

  // Everything below is actuals only. Forecast lives in the monthly report at the top.
  const elapsed = data.months.filter((m) => m.status !== "future")
  const total = pnl(elapsed, "actual")
  const cash = line(elapsed.at(-1), "Closing cash")?.actual ?? 0
  const opMargin = margin(total.operating, total.revenue)
  const netMargin = margin(total.net, total.revenue)
  const share = (n: number) => pct(margin(n, total.revenue))

  const rows = elapsed.map((m) => {
    const a = pnl([m], "actual")
    return {
      month: m,
      a,
      margin: margin(a.operating, a.revenue),
      netMargin: margin(a.net, a.revenue),
      cash: line(m, "Closing cash")?.actual ?? 0,
    }
  })
  const point = (v: number | null) => (v === null ? null : Math.round(v * 1000) / 10)

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
            value={money(cash)}
            hint="Business accounts"
            tone={cash < 0 ? "default" : "success"}
          />
          <Metric label="Revenue" value={money(total.revenue)} hint="To date" />
          <Metric
            label="Operating profit"
            value={money(total.operating)}
            hint={`${pct(opMargin)} margin`}
            tone={total.operating < 0 ? "default" : "success"}
          />
          <Metric
            label="Net profit"
            value={money(total.net)}
            hint={`${pct(netMargin)} margin`}
            tone={total.net < 0 ? "default" : "success"}
          />
          <Metric label="Net cash flow" value={money(total.cashFlow)} hint="To date" />
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
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">% of revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  [
                    ["Revenue", total.revenue, true],
                    ["Operating costs", -total.costs, false],
                    ["Operating profit", total.operating, true],
                    ["Tax reserve", -total.tax, false],
                    ["Owner salary", -total.salary, false],
                    ["Net profit", total.net, true],
                    ["Owner transfers", -total.transfers, false],
                    ["Net cash flow", total.cashFlow, true],
                  ] as [string, number, boolean][]
                ).map(([name, amount, strong]) => (
                  <TableRow key={name} className={cn(strong && "bg-secondary")}>
                    <TableCell className={cn(strong && "font-bold")}>{name}</TableCell>
                    <TableCell className={cn("text-right", strong && "font-bold")}>
                      {money(amount)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {share(amount)}
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
                  <TableHead className="text-right">Operating costs</TableHead>
                  <TableHead className="text-right">Operating profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Net cash flow</TableHead>
                  <TableHead className="text-right">Closing cash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.month.month}>
                    <TableCell className="font-bold">
                      {monthName(r.month.month)}
                      {r.month.status === "current" && <Badge className="ml-2">Partial</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{money(r.a.revenue)}</TableCell>
                    <TableCell className="text-right">{money(r.a.costs)}</TableCell>
                    <TableCell className="text-right">{money(r.a.operating)}</TableCell>
                    <TableCell className="text-right">{pct(r.margin)}</TableCell>
                    <TableCell className="text-right">{money(r.a.cashFlow)}</TableCell>
                    <TableCell className="text-right">{money(r.cash)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionLabel>Revenue and costs</SectionLabel>
          </CardHeader>
          <CardContent>
            <FlowChart
              data={rows.map((r) => ({
                month: monthName(r.month.month),
                revenue: r.a.revenue,
                costs: r.a.costs,
              }))}
            />
          </CardContent>
        </Card>
        <div className="grid gap-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <SectionLabel>Margin</SectionLabel>
            </CardHeader>
            <CardContent>
              <MarginChart
                data={rows.map((r) => ({
                  month: monthName(r.month.month),
                  operating: point(r.margin),
                  net: point(r.netMargin),
                }))}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <SectionLabel>Closing cash</SectionLabel>
            </CardHeader>
            <CardContent>
              <CashChart
                data={rows.map((r) => ({
                  month: monthName(r.month.month),
                  cash: r.cash,
                }))}
              />
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
    <section className="rounded-lg bg-(--pair-press-surface)">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="finance-report"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg p-5 text-left outline-none transition-colors hover:bg-(--pair-strong-surface) focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <SparklesIcon className="size-5 shrink-0" aria-hidden />
            <span className="text-lg font-bold">
              {archive ? "Saved reports" : "Monthly report"}
            </span>
            {!archive && (
              <>
                <Badge variant="secondary">{monthName(reviewMonth.month)}</Badge>
                {!closed && <Badge variant="secondary">Partial</Badge>}
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
            className="m-3 flex size-10 shrink-0 items-center justify-center self-center rounded-full bg-ink text-surface outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
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
                className="h-9 rounded-full bg-(--pair-raised-surface) px-4 font-bold text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
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
            {!saved && storage && <Badge variant="secondary">Not saved</Badge>}
            {!storage && <Badge variant="secondary">Storage unavailable</Badge>}
            {failed && <Badge variant="danger">Not saved</Badge>}
            {busy && <Badge variant="secondary">Saving</Badge>}
            {stored && live && storage && (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-(--pair-raised-surface) px-4 font-bold outline-none transition-colors hover:bg-(--pair-strong-surface) focus-visible:ring-[3px] focus-visible:ring-ring disabled:opacity-50"
              >
                <RefreshCwIcon className="size-4" aria-hidden />
                Update
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-ink-soft">{monthName(month.month)}</p>
                <p className="text-3xl font-bold">
                  {month.onTrack} / {total}
                </p>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-(--pair-strong-surface)"
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
                <div key={l.line} className="rounded-md bg-(--pair-raised-surface) p-4">
                  <p className="text-sm text-ink-soft">{l.line}</p>
                  <p className="text-xl font-bold">{money(l.actual)}</p>
                  <p className="text-xs text-ink-soft">
                    {money(l.forecast)} · {signedMoney(l.difference)}
                  </p>
                </div>
              ))}
              <div className="rounded-md bg-(--pair-raised-surface) p-4">
                <p className="text-sm text-ink-soft">Operating margin</p>
                <p className="text-xl font-bold">{pct(reportMargin)}</p>
                <p className="text-xs text-ink-soft">{pct(reportPlanMargin)} forecast</p>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-(--pair-raised-surface) p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold tracking-widest text-ink-soft uppercase">
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
                    <TableCell className="text-right text-ink-soft">
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
