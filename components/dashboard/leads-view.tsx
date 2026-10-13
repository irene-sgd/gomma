"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tile } from "@/components/dashboard/primitives"
import {
  fetchLeads,
  qualifyLead,
  screenLead,
  syncScreenings,
  type Lead,
  type LeadState,
} from "@/lib/leads"

// Matches SESSION_BUDGET_CENTS in wrangler.toml.
const SESSION_CAP_USD = 3

const STATE_LABEL: Record<LeadState, string> = {
  unscreened: "Not screened",
  screening: "Screening",
  failed: "Failed",
  pass: "Pass",
  unclear: "Unclear",
  decline: "Decline",
  qualified: "Qualified",
}
const STATE_VARIANT: Record<
  LeadState,
  "default" | "success" | "active" | "danger"
> = {
  unscreened: "default",
  screening: "default",
  failed: "danger",
  pass: "success",
  unclear: "active",
  decline: "danger",
  qualified: "success",
}

const canQualify = (lead: Lead) =>
  lead.state === "pass" || lead.state === "unclear"

const canScreen = (lead: Lead) =>
  lead.state === "unscreened" || lead.state === "failed"

const received = (iso: string) =>
  new Date(iso).toLocaleDateString("en", { day: "numeric", month: "short" })

export function LeadsView({ token }: { token: string }) {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [working, setWorking] = useState<Set<string>>(new Set())
  const [syncing, setSyncing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showQualified, setShowQualified] = useState(false)
  const [qualifying, setQualifying] = useState<Set<string>>(new Set())

  const reload = useCallback(
    async (includeQualified = showQualified) => {
      try {
        setLeads(await fetchLeads(token, includeQualified))
        setError(null)
      } catch {
        setError("Couldn't load leads. Please try again.")
      }
    },
    [token, showQualified]
  )

  useEffect(() => {
    let cancelled = false
    async function open() {
      try {
        let list = await fetchLeads(token)
        if (list.some((l) => l.state === "screening")) {
          await syncScreenings(token).catch(() => undefined)
          list = await fetchLeads(token)
        }
        if (!cancelled) setLeads(list)
      } catch {
        if (!cancelled) setError("Couldn't load leads. Please try again.")
      }
    }
    void open()
    return () => {
      cancelled = true
    }
  }, [token])

  const screenable = (leads ?? []).filter(canScreen)
  const picked = screenable.filter((l) => selected.has(l.id))
  const allPicked = screenable.length > 0 && picked.length === screenable.length

  function toggle(id: string, on: boolean) {
    setConfirming(false)
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function selectAll() {
    setConfirming(false)
    setSelected(new Set(screenable.map((l) => l.id)))
  }

  function clearSelection() {
    setConfirming(false)
    setSelected(new Set())
  }

  async function toggleQualified() {
    const next = !showQualified
    setShowQualified(next)
    await reload(next)
  }

  async function qualify(lead: Lead) {
    setQualifying((prev) => new Set(prev).add(lead.id))
    const done = await qualifyLead(token, lead.id)
    setQualifying((prev) => {
      const next = new Set(prev)
      next.delete(lead.id)
      return next
    })
    setStatus(
      done
        ? `${lead.name} moved to Master CRM.`
        : `Couldn't move ${lead.name} to Master CRM. Please try again.`
    )
    await reload()
  }

  async function sync() {
    setSyncing(true)
    try {
      const r = await syncScreenings(token)
      setStatus(
        r.checked === 0
          ? "Nothing is being screened right now."
          : `Synced: ${r.finished} finished, ${r.running} still running, ${r.failed} failed.`
      )
      await reload()
    } catch {
      setStatus("Couldn't sync. Please try again.")
    } finally {
      setSyncing(false)
    }
  }

  async function screen(ids: string[]) {
    setConfirming(false)
    setSelected(new Set())
    setWorking(new Set(ids))
    let failed = 0
    for (const id of ids) {
      if (!(await screenLead(token, id))) failed++
      setWorking((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
    setStatus(
      failed
        ? `${failed} of ${ids.length} could not start. Try those again.`
        : `Started ${ids.length} screening${ids.length === 1 ? "" : "s"}. Press Sync in a few minutes to bring the results back.`
    )
    await reload()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl leading-tight">Leads</CardTitle>
        <CardDescription>
          {leads
            ? `${leads.length} inbound lead${leads.length === 1 ? "" : "s"} · ${screenable.length} to screen`
            : "Raw inquiries from the quote form"}
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={toggleQualified}>
            {showQualified ? "Hide qualified" : "Show qualified"}
          </Button>
          <Button variant="secondary" onClick={sync} disabled={syncing}>
            {syncing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCwIcon data-icon="inline-start" />
            )}
            Sync
          </Button>
          <Button
            disabled={picked.length === 0 || working.size > 0}
            onClick={() => setConfirming(true)}
          >
            Screen selected ({picked.length})
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {screenable.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-2 text-muted-foreground" aria-live="polite">
              {picked.length} of {screenable.length} selected
            </span>
            <Button
              variant="secondary"
              onClick={selectAll}
              disabled={allPicked}
            >
              Select all
            </Button>
            <Button
              variant="ghost"
              onClick={clearSelection}
              disabled={picked.length === 0}
            >
              Clear
            </Button>
          </div>
        )}

        {confirming && picked.length > 0 && (
          <Tile className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              Screen {picked.length} lead{picked.length === 1 ? "" : "s"}? Each
              costs up to ${SESSION_CAP_USD}, so up to $
              {picked.length * SESSION_CAP_USD} in total.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => screen(picked.map((l) => l.id))}>
                Start screening
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </div>
          </Tile>
        )}

        {status && (
          <p role="status" className="text-sm text-muted-foreground">
            {status}
          </p>
        )}

        {error ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyDescription>{error}</EmptyDescription>
            </EmptyHeader>
            <Button variant="secondary" onClick={() => reload()}>
              Try again
            </Button>
          </Empty>
        ) : leads === null ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyDescription>
                No inbound leads yet. Inquiries sent from gomma.cc/quote appear
                here. Qualified leads move to Master CRM.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all leads that can be screened"
                    checked={allPicked}
                    indeterminate={picked.length > 0 && !allPicked}
                    disabled={screenable.length === 0}
                    onCheckedChange={(on) =>
                      on ? selectAll() : clearSelection()
                    }
                  />
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Failed flags</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  data-state={
                    selected.has(lead.id) && canScreen(lead)
                      ? "selected"
                      : undefined
                  }
                >
                  <TableCell>
                    {canScreen(lead) && (
                      <Checkbox
                        aria-label={`Select ${lead.name}`}
                        checked={selected.has(lead.id)}
                        disabled={working.has(lead.id)}
                        onCheckedChange={(on) => toggle(lead.id, on)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    <div className="font-bold">{lead.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {[lead.contactName, lead.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {lead.project && (
                      <div className="mt-1 line-clamp-2 text-xs">
                        {lead.project}
                      </div>
                    )}
                    {lead.state === "failed" && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {lead.failure}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATE_VARIANT[lead.state]}>
                      {lead.state === "screening" && <Spinner />}
                      {STATE_LABEL[lead.state]}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {lead.flags.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        lead.flags.map((flag) => (
                          <Badge key={flag}>{flag}</Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {received(lead.created)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {canScreen(lead) && (
                        <Button
                          disabled={working.has(lead.id)}
                          onClick={() => screen([lead.id])}
                        >
                          {working.has(lead.id) && (
                            <Spinner data-icon="inline-start" />
                          )}
                          {lead.state === "failed" ? "Retry" : "Screen"}
                        </Button>
                      )}
                      {canQualify(lead) && (
                        <Button
                          disabled={qualifying.has(lead.id)}
                          onClick={() => qualify(lead)}
                        >
                          {qualifying.has(lead.id) && (
                            <Spinner data-icon="inline-start" />
                          )}
                          Qualify
                        </Button>
                      )}
                      {lead.crmUrl && (
                        <Button
                          variant="ghost"
                          nativeButton={false}
                          render={
                            <a
                              href={lead.crmUrl}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Open ${lead.name} in Master CRM`}
                            />
                          }
                        >
                          Open CRM
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        nativeButton={false}
                        render={
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Open ${lead.name} in Notion`}
                          />
                        }
                      >
                        Open
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
