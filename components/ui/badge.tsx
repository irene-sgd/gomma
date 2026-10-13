import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-(--ink) text-(--surface)",
        secondary: "bg-(--pair-raised-surface) text-(--pair-raised-ink)",
        destructive: "bg-(--pair-danger-surface) text-(--pair-danger-ink)",
        warning: "bg-(--pair-warning-surface) text-(--pair-warning-ink)",
        neutral: "bg-(--pair-press-surface) text-(--pair-press-ink)",
        outline:
          "border-border-essential text-(--ink) [a]:hover:bg-(--pair-raised-surface)",
        ghost:
          "text-(--ink-soft) hover:bg-(--pair-raised-surface) hover:text-(--ink)",
        link: "text-link underline-offset-4 hover:underline",
        // Dashboard statuses: saved, current, failed.
        success: "bg-success text-success-foreground",
        active: "bg-(--ink) text-(--surface)",
        danger: "bg-(--pair-danger-surface) text-(--pair-danger-ink)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
