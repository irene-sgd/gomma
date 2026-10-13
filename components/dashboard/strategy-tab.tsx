import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionLabel, Tile } from "@/components/dashboard/primitives"
import type { Project } from "@/lib/types"
import { cn } from "cn"

export function StrategyTab({ project }: { project: Project }) {
  return (
    <div className="flex flex-col gap-2">
      <Card>
        <CardHeader>
          <SectionLabel>Positioning</SectionLabel>
          <CardTitle>Value proposition</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Tile className="p-6">
            <p className="text-base leading-relaxed font-bold">
              {project.strategy}
            </p>
          </Tile>
          <div className="grid gap-2 md:grid-cols-3">
            {project.pillars.map((pillar, i) => (
              <Tile key={pillar} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-ink-soft">
                  Pillar {i + 1}
                </span>
                <span className="text-sm">{pillar}</span>
              </Tile>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionLabel>Quarterly roadmap</SectionLabel>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {project.roadmap.map((r) => (
              <Tile key={r.quarter} className="flex flex-col gap-2">
                <span
                  className={cn(
                    "text-sm font-bold",
                    r.done && "text-success",
                    !r.done && !r.now && "text-ink-soft"
                  )}
                >
                  {r.done ? "✓ " : ""}
                  {r.quarter}
                </span>
                <ul className="flex flex-col gap-1 text-sm text-ink-soft">
                  {r.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Tile>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
