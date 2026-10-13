import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty"
import {
  TaskStatusChart,
  taskStatusConfig,
} from "@/components/dashboard/charts"
import {
  Metric,
  MetricGrid,
  SectionLabel,
  Tile,
} from "@/components/dashboard/primitives"
import type { LiveData } from "@/lib/types"

export function OperationsTab({ live }: { live?: LiveData }) {
  const counts = live?.taskCounts ?? {
    total: 0,
    done: 0,
    inprog: 0,
    review: 0,
    backlog: 0,
  }
  const pctDone =
    counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0
  const active = live?.activeTasks ?? []

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <SectionLabel>Task performance</SectionLabel>
        </CardHeader>
        <CardContent>
          <MetricGrid>
            <Metric
              label="Completed"
              value={counts.done}
              hint={`${pctDone}% of total`}
              tone={counts.done > 0 ? "success" : "muted"}
            />
            <Metric
              label="In progress"
              value={counts.inprog}
              hint="active now"
            />
            <Metric
              label="Under review"
              value={counts.review}
              hint="awaiting sign-off"
            />
            <Metric label="Backlog" value={counts.backlog} hint="not started" />
          </MetricGrid>
        </CardContent>
      </Card>

      <div className="grid gap-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Active workstreams</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {active.length > 0 ? (
              active.map((t, i) => (
                <Tile
                  key={`${t.name}-${i}`}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {t.name}
                  </span>
                  <Badge variant="active">{t.status}</Badge>
                  <span className="w-20 shrink-0 text-right text-xs text-ink-soft">
                    {t.due}
                  </span>
                </Tile>
              ))
            ) : (
              <Empty className="py-8">
                <EmptyHeader>
                  <EmptyDescription>
                    {live
                      ? "No active tasks."
                      : "No active tasks. Press Refresh to load the latest data."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <TaskStatusChart counts={counts} />
            <ul className="flex flex-col gap-2">
              {(
                Object.keys(
                  taskStatusConfig
                ) as (keyof typeof taskStatusConfig)[]
              ).map((key) => (
                <li key={key} className="flex items-center gap-3 text-sm">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: taskStatusConfig[key].color }}
                  />
                  <span className="flex-1 text-ink-soft">
                    {taskStatusConfig[key].label}
                  </span>
                  <span className="font-bold">{counts[key]}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
