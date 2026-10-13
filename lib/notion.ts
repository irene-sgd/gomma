import type {
  ActiveTask,
  FinanceData,
  LiveData,
  Project,
  TaskCounts,
  Transaction,
} from "@/lib/types"

// Same origin in production (dashboard.gomma.cc serves both the app and the API).
// For local development set NEXT_PUBLIC_API_BASE to a running Worker.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ""
const TOKEN_KEY = "notion_bi_token"
const TASKS_DB = "2fc7286d055f816abd4fe98440f1ed86"
const FINANCE_DB = "2fc7286d055f812d85b6fc8a4ca87d4d"

type RichText = { plain_text: string }[]
type Prop = {
  title?: RichText
  number?: number | null
  select?: { name: string } | null
  status?: { name: string } | null
  date?: { start: string } | null
  relation?: unknown[]
}
type Page = { properties?: Record<string, Prop | undefined> }
type QueryResponse = {
  results?: Page[]
  has_more?: boolean
  next_cursor?: string | null
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

export function request(path: string, token: string, body?: unknown) {
  return fetch(`${API_BASE}/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await request("users/me", token)
    return res.ok
  } catch {
    return false
  }
}

async function queryAll(
  db: string,
  token: string,
  body: Record<string, unknown>
): Promise<Page[]> {
  const pages: Page[] = []
  let cursor: string | null = null
  for (;;) {
    const res = await request(`databases/${db}/query`, token, {
      ...body,
      ...(cursor ? { start_cursor: cursor } : {}),
    })
    const data = (await res.json()) as QueryResponse
    if (!data.results) break
    pages.push(...data.results)
    if (!data.has_more) break
    cursor = data.next_cursor ?? null
  }
  return pages
}

const text = (title?: RichText) =>
  title ? title.map((r) => r.plain_text).join("") : ""
const cleanId = (id: string) => id.replace(/-/g, "")

function countTasks(tasks: Page[]): TaskCounts {
  const counts: TaskCounts = {
    total: tasks.length,
    done: 0,
    inprog: 0,
    review: 0,
    backlog: 0,
  }
  for (const t of tasks) {
    const s = t.properties?.Status?.status?.name ?? ""
    if (s === "Completed" || s === "Archived") counts.done++
    else if (s === "In Progress") counts.inprog++
    else if (s === "Review") counts.review++
    else counts.backlog++
  }
  return counts
}

async function fetchFinance(
  project: Project,
  token: string
): Promise<FinanceData> {
  const empty: FinanceData = {
    spend: 0,
    revenue: 0,
    investment: 0,
    loan: 0,
    reimb: 0,
    txns: [],
    monthly: {},
  }
  try {
    const pages = await queryAll(FINANCE_DB, token, {
      filter: {
        property: "Master Project Dashboard",
        relation: { contains: cleanId(project.notionId) },
      },
      page_size: 50,
    })
    const out: FinanceData = { ...empty, txns: [], monthly: {} }
    for (const t of pages) {
      const p = t.properties ?? {}
      const amount = p.Amount?.number ?? 0
      const type = p.Type?.select?.name ?? ""
      const status = p.Status?.status?.name ?? ""
      const date = p.Date?.date?.start ?? ""

      if (type === "Expense") out.spend += amount
      else if (type === "Revenue") out.revenue += amount
      else if (type === "Investment") out.investment += amount
      else if (type === "Loan") out.loan += amount
      if (status === "Awaiting Reimbursement") out.reimb += amount

      if (date) {
        const month = date.substring(0, 7)
        const m = (out.monthly[month] ??= { expense: 0, revenue: 0 })
        if (type === "Expense") m.expense += amount
        else if (type === "Revenue") m.revenue += amount
      }

      const txn: Transaction = {
        name: text(p.Transaction?.title) || "Untitled",
        amount,
        type,
        status,
        category: p.Category?.select?.name ?? "",
        date,
      }
      out.txns.push(txn)
    }
    out.txns.sort((a, b) => (b.date > a.date ? 1 : -1))
    return out
  } catch (e) {
    console.error("Finance fetch error:", e)
    return empty
  }
}

export async function fetchProjectLiveData(
  project: Project,
  token: string
): Promise<LiveData> {
  const pageRes = await request(`pages/${project.notionId}`, token)
  if (!pageRes.ok) throw new Error(`Request failed: ${pageRes.status}`)
  const page = (await pageRes.json()) as Page
  const props = page.properties ?? {}

  const [tasks, finance] = await Promise.all([
    queryAll(TASKS_DB, token, {
      filter: {
        property: "Parent Project",
        relation: { contains: cleanId(project.notionId) },
      },
      page_size: 100,
    }),
    fetchFinance(project, token),
  ])

  const activeTasks: ActiveTask[] = tasks
    .filter((t) => {
      const s = t.properties?.Status?.status?.name ?? ""
      return s === "In Progress" || s === "Review"
    })
    .slice(0, 8)
    .map((t) => ({
      name: text(t.properties?.Task?.title) || "Untitled",
      status: t.properties?.Status?.status?.name ?? "",
      due: t.properties?.["Due Date"]?.date?.start ?? "—",
    }))

  return {
    taskCounts: countTasks(tasks),
    activeTasks,
    docs: props["Document Hub"]?.relation?.length ?? 0,
    crm: props["Master CRM"]?.relation?.length ?? 0,
    finance,
    lastRefresh: new Date(),
  }
}
