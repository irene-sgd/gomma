import { cn } from "cn"

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  )
}

export function Tile({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-md bg-secondary p-4", className)} {...props} />
  )
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{children}</div>
}

export function Metric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: React.ReactNode
  hint: string
  tone?: "default" | "success" | "muted"
}) {
  return (
    <Tile className="flex flex-col gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-2xl leading-tight font-bold",
          tone === "success" && "text-success",
          tone === "muted" && "text-muted-foreground"
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Tile>
  )
}
