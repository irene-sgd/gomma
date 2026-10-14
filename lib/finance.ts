import { API_BASE } from "@/lib/notion"

export type FinanceLine = {
  line: string
  actual: number
  forecast: number
  difference: number
  off: boolean
}

export type FinanceMonth = {
  month: string
  lines: FinanceLine[]
  onTrack: number
  off: number
  status: "past" | "current" | "future"
}

export type FinanceTxn = {
  date: string
  type: "Revenue" | "Expense" | "Transfer In" | "Transfer Out"
  amount: number
  category: string
  transaction: string
  account: string
  accountMask: string
}

export type FinanceData = {
  generatedAt: string
  currentMonth: string
  months: FinanceMonth[]
  spend?: { category: string; amount: number }[]
  transactions: FinanceTxn[]
}

export async function fetchFinance(): Promise<FinanceData> {
  const res = await fetch(`${API_BASE}/api/finance`, { credentials: "include" })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

export type StoredReport = {
  month: string
  savedAt: string
  data: FinanceMonth
}

// null means saved reports are unavailable (storage not configured); the page still works live.
export async function fetchReports(): Promise<StoredReport[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/finance/reports`, { credentials: "include" })
    if (!res.ok) return null
    return ((await res.json()) as { reports: StoredReport[] }).reports
  } catch {
    return null
  }
}

export async function saveReport(month: string): Promise<StoredReport> {
  const res = await fetch(`${API_BASE}/api/finance/reports/${month}`, {
    method: "PUT",
    credentials: "include",
  })
  if (!res.ok) throw new Error(String(res.status))
  return res.json()
}

export const money = (n: number) =>
  `${n < 0 ? "−" : ""}฿${Math.round(Math.abs(n)).toLocaleString()}`

export const signedMoney = (n: number) =>
  n === 0 ? "฿0" : `${n < 0 ? "−" : "+"}฿${Math.round(Math.abs(n)).toLocaleString()}`

export const monthName = (ym: string) => {
  const [y, m] = ym.split("-")
  return `${new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", { month: "short" })} ${y.slice(2)}`
}

export const line = (m: FinanceMonth | undefined, name: string) =>
  m?.lines.find((l) => l.line === name)

export type Pnl = {
  revenue: number
  costs: number
  operating: number
  tax: number
  salary: number
  net: number
  transfers: number
  cashFlow: number
}

// Profit and loss for a set of months, from the seven lines.
// Operating profit = revenue - operating costs. Net profit also takes the tax reserve and owner
// salary. Owner transfers are a distribution, so they only enter net cash flow.
export function pnl(months: FinanceMonth[], key: "actual" | "forecast"): Pnl {
  const add = (name: string) =>
    months.reduce((total, m) => total + (line(m, name)?.[key] ?? 0), 0)
  const revenue = add("Revenue")
  const costs = add("Operating costs")
  const tax = add("Tax reserve")
  const salary = add("Owner salary")
  const transfers = add("Owner transfers")
  const operating = revenue - costs
  const net = operating - tax - salary
  return { revenue, costs, operating, tax, salary, net, transfers, cashFlow: net - transfers }
}

export const margin = (profit: number, revenue: number) =>
  revenue > 0 ? profit / revenue : null

export const pct = (n: number | null) =>
  n === null ? "—" : `${n < 0 ? "−" : ""}${Math.round(Math.abs(n) * 100)}%`

// Plain-language check-up for one month. Rules only, no model: every sentence comes from the numbers.
export function improvements(month: FinanceMonth): string[] {
  const get = (name: string) => line(month, name)
  const gap = (l: FinanceLine) => Math.abs(l.actual - l.forecast)
  const out: string[] = []

  const revenue = get("Revenue")
  if (revenue?.off && revenue.actual < revenue.forecast)
    out.push(
      `Revenue is ${money(gap(revenue))} below forecast. Chase open invoices and confirm the next billings.`
    )
  const costs = get("Operating costs")
  if (costs?.off && costs.actual > costs.forecast)
    out.push(
      `Operating costs are ${money(gap(costs))} over forecast. Review the largest expenses.`
    )
  const tax = get("Tax reserve")
  if (tax?.off && tax.actual < tax.forecast)
    out.push(`Tax reserve is ${money(gap(tax))} short of plan. Set it aside before the next spend.`)
  const equipment = get("Equipment fund")
  if (equipment?.off && equipment.actual < equipment.forecast)
    out.push(`Equipment fund is ${money(gap(equipment))} short of plan.`)
  const salary = get("Owner salary")
  if (salary?.off && salary.actual > salary.forecast)
    out.push(`Owner salary is ${money(gap(salary))} above plan.`)
  const transfers = get("Owner transfers")
  if (transfers?.off && transfers.actual > transfers.forecast)
    out.push(`Owner transfers are ${money(gap(transfers))} above plan.`)
  const cash = get("Closing cash")
  if (cash?.off && cash.actual < cash.forecast)
    out.push(`Closing cash is ${money(gap(cash))} below forecast.`)
  const a = pnl([month], "actual")
  const f = pnl([month], "forecast")
  const am = margin(a.operating, a.revenue)
  const fm = margin(f.operating, f.revenue)
  if (am !== null && fm !== null && fm - am > 0.1)
    out.push(`Operating margin is ${pct(am)} against ${pct(fm)} in the forecast.`)

  return out
}
