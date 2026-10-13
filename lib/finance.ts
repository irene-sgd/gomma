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
  transactions: FinanceTxn[]
}

export async function fetchFinance(): Promise<FinanceData> {
  const res = await fetch(`${API_BASE}/api/finance`, { credentials: "include" })
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
