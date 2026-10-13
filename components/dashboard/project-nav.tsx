import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/dashboard/logo"
import type { Project } from "@/lib/types"

export function ProjectNav({
  projects,
  activeKey,
  onSelect,
}: {
  projects: Project[]
  activeKey: string
  onSelect: (key: string) => void
}) {
  return (
    <Card className="gap-4 p-2 [--card-spacing:--spacing(2)] lg:sticky lg:top-2 lg:w-60 lg:shrink-0 lg:self-start">
      <div className="flex flex-col gap-0.5 px-3 pt-2 pb-1">
        <Logo className="h-3 w-20 text-foreground" />
        <span className="text-xs text-ink-soft">BI Dashboard</span>
      </div>
      <nav aria-label="Projects" className="flex flex-wrap gap-0.5 lg:flex-col">
        <Button
          variant="ghost"
          aria-current={activeKey === "leads" ? "page" : undefined}
          onClick={() => onSelect("leads")}
          className="h-9 justify-start rounded-sm px-3 aria-[current=page]:bg-(--pair-raised-surface) aria-[current=page]:text-foreground"
        >
          Leads
        </Button>
        <Button
          variant="ghost"
          aria-current={activeKey === "finance" ? "page" : undefined}
          onClick={() => onSelect("finance")}
          className="h-9 justify-start rounded-sm px-3 aria-[current=page]:bg-(--pair-raised-surface) aria-[current=page]:text-foreground"
        >
          Finance
        </Button>
        {projects.map((p) => (
          <Button
            key={p.key}
            variant="ghost"
            aria-current={p.key === activeKey ? "page" : undefined}
            onClick={() => onSelect(p.key)}
            className="h-9 justify-start rounded-sm px-3 aria-[current=page]:bg-(--pair-raised-surface) aria-[current=page]:text-foreground"
          >
            {p.name}
          </Button>
        ))}
      </nav>
    </Card>
  )
}
