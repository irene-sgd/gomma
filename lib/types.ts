export type Tone = "success" | "active" | "info" | "danger" | "neutral"

export type Project = {
  key: string
  code: string
  name: string
  notionId: string
  kind: string
  location: string
  started: string | null
  badges: { label: string; tone: Tone }[]
  signals: { title: string; detail: string; tone: Tone }[]
  okrs: { title: string; status: string; tone: Tone }[]
  monthly: { month: string; value: number }[]
  strategy: string
  pillars: string[]
  roadmap: { quarter: string; done: boolean; now: boolean; items: string[] }[]
}

export type TaskCounts = {
  total: number
  done: number
  inprog: number
  review: number
  backlog: number
}

export type ActiveTask = { name: string; status: string; due: string }

export type Transaction = {
  name: string
  amount: number
  type: string
  status: string
  category: string
  date: string
}

export type FinanceData = {
  spend: number
  revenue: number
  investment: number
  loan: number
  reimb: number
  txns: Transaction[]
  monthly: Record<string, { expense: number; revenue: number }>
}

export type LiveData = {
  taskCounts: TaskCounts
  activeTasks: ActiveTask[]
  docs: number
  crm: number
  finance: FinanceData
  lastRefresh: Date
}
