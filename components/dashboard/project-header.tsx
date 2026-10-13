import { RefreshCwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { badgeVariant } from "@/lib/format"
import type { LiveData, Project } from "@/lib/types"

export function ProjectHeader({
  project,
  live,
  status,
  refreshing,
  onRefresh,
}: {
  project: Project
  live?: LiveData
  status: string
  refreshing: boolean
  onRefresh: () => void
}) {
  return (
    <Card className="[--card-spacing:--spacing(8)]">
      <CardContent className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {project.code} · Business Intelligence
          </p>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.kind} · {project.location}
            {project.started ? ` · Started ${project.started}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.badges.map((b) => (
              <Badge key={b.label} variant={badgeVariant(b.tone)}>
                {b.label}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end md:text-right">
          <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
            <span>{live ? `${live.taskCounts.total} tasks` : "— tasks"}</span>
            <span>{live ? `${live.docs} documents` : "— documents"}</span>
            {live && live.crm > 0 && <span>{live.crm} CRM contacts</span>}
          </div>
          <Button onClick={onRefresh} disabled={refreshing}>
            {refreshing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RefreshCwIcon data-icon="inline-start" />
            )}
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <p role="status" className="text-xs text-muted-foreground">
            {status}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
