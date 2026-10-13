import { API_BASE, request } from "@/lib/notion"

// Inbound Leads database (raw form leads). Qualified leads move to Master CRM.
const INBOX_DATABASE_ID = "ca33d8ba4ea84f9e8757ebfefcf22975"

export type LeadState =
  | "unscreened"
  | "screening"
  | "failed"
  | "pass"
  | "unclear"
  | "decline"
  | "qualified"

export type Lead = {
  id: string
  url: string
  crmUrl: string
  name: string
  contactName: string
  email: string
  project: string
  flags: string[]
  state: LeadState
  failure: string
  created: string
}

type RichText = { plain_text: string }[]
type LeadPage = {
  id: string
  url: string
  created_time: string
  properties: Record<
    string,
    | {
        title?: RichText
        rich_text?: RichText
        email?: string | null
        select?: { name: string } | null
        multi_select?: { name: string }[]
        relation?: { id: string }[]
      }
    | undefined
  >
}

const text = (prop?: { title?: RichText; rich_text?: RichText }) =>
  (prop?.title ?? prop?.rich_text ?? []).map((t) => t.plain_text).join("")

function stateOf(
  stage: string,
  result: string,
  session: string,
  note: string
): LeadState {
  if (stage === "Qualified") return "qualified"
  if (result === "Pass") return "pass"
  if (result === "Unclear") return "unclear"
  if (result === "Decline") return "decline"
  if (session) return "screening"
  return /^Screening (failed|could not start)/.test(note)
    ? "failed"
    : "unscreened"
}

// Notes written by the Worker look like "Screening failed (<time>): <reason>. Session ..."
function failureReason(note: string) {
  const reason =
    /^Screening (?:failed|could not start) \([^)]*\): ([^.]*)/.exec(note)?.[1]
  return reason ? reason.charAt(0).toUpperCase() + reason.slice(1) : note
}

function toLead(page: LeadPage): Lead {
  const p = page.properties
  const note = text(p["Note"])
  const crmId = p["Master CRM"]?.relation?.[0]?.id
  return {
    id: page.id,
    url: page.url,
    crmUrl: crmId ? `https://www.notion.so/${crmId.replace(/-/g, "")}` : "",
    name: text(p["Name"]) || "Untitled",
    contactName: text(p["Contact Name"]),
    email: p["Email"]?.email ?? "",
    project: text(p["Topic"]),
    flags: (p["Failed Flags"]?.multi_select ?? []).map((f) => f.name),
    state: stateOf(
      p["Stage"]?.select?.name ?? "",
      p["Screening Result"]?.select?.name ?? "",
      text(p["Screening Session"]),
      note
    ),
    failure: failureReason(note),
    created: page.created_time,
  }
}

export async function fetchLeads(
  token: string,
  includeQualified = false
): Promise<Lead[]> {
  const res = await request(`databases/${INBOX_DATABASE_ID}/query`, token, {
    ...(includeQualified
      ? {}
      : {
          filter: {
            property: "Stage",
            select: { does_not_equal: "Qualified" },
          },
        }),
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 50,
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const data = (await res.json()) as { results?: LeadPage[] }
  return (data.results ?? []).map(toLead)
}

function api(path: string, token: string, body?: unknown) {
  return fetch(`${API_BASE}/api/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function screenLead(token: string, pageId: string) {
  return (await api("screening/start", token, { pageId })).ok
}

export async function qualifyLead(token: string, pageId: string) {
  return (await api("leads/qualify", token, { pageId })).ok
}

export type SyncSummary = {
  checked: number
  running: number
  finished: number
  failed: number
  errors: number
}

export async function syncScreenings(token: string): Promise<SyncSummary> {
  const res = await api("screening/sync", token)
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`)
  return (await res.json()) as SyncSummary
}
