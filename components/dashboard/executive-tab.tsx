import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Metric,
  MetricGrid,
  SectionLabel,
  Tile,
} from "@/components/dashboard/primitives"
import { badgeVariant, dotClass } from "@/lib/format"
import type { LiveData, Project } from "@/lib/types"
import { cn } from "cn"

export function ExecutiveTab({
  project,
  live,
}: {
  project: Project
  live?: LiveData
}) {
  const counts = live?.taskCounts
  const pctDone =
    counts && counts.total > 0
      ? Math.round((counts.done / counts.total) * 100)
      : 0

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <SectionLabel>Health snapshot</SectionLabel>
        </CardHeader>
        <CardContent>
          <MetricGrid>
            <Metric
              label="Total tasks"
              value={counts ? counts.total : "—"}
              hint="across all workstreams"
            />
            <Metric
              label="Completion rate"
              value={`${pctDone}%`}
              hint={`${counts?.done ?? 0} of ${counts ? counts.total : "—"} done`}
              tone={pctDone > 0 ? "success" : "muted"}
            />
            <Metric
              label="In progress"
              value={counts?.inprog ?? 0}
              hint="active workstreams"
            />
            <Metric
              label="Documents"
              value={live ? live.docs : "—"}
              hint="in document hub"
            />
          </MetricGrid>
        </CardContent>
      </Card>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Business signals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {project.signals.map((s) => (
              <Tile key={s.title} className="flex gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    dotClass[s.tone]
                  )}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{s.title}</span>
                  <span className="text-sm text-ink-soft">
                    {s.detail}
                  </span>
                </div>
              </Tile>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>OKRs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {project.okrs.map((o) => (
              <Tile
                key={o.title}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="min-w-0 text-sm">{o.title}</span>
                <Badge variant={badgeVariant(o.tone)}>{o.status}</Badge>
              </Tile>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
