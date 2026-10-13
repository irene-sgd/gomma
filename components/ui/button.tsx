import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-bold whitespace-nowrap transition-[transform,background-color,color,box-shadow] duration-100 outline-none select-none hover:scale-[1.04] focus-visible:ring-3 focus-visible:ring-foreground active:scale-100 active:opacity-70 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-3 aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The CTA on any surface and ink pair: ink fill, surface-colored label.
        default: "bg-(--ink) text-(--surface)",
        // Outline marks an optional, secondary action: the only bordered control.
        outline:
          "border-border-essential bg-transparent text-(--ink) hover:border-(--ink) aria-expanded:border-(--ink)",
        // Fill steps up the neutral pairs: raised, then press.
        secondary:
          "bg-(--pair-raised-surface) text-(--pair-raised-ink) hover:scale-100 hover:bg-(--pair-press-surface) aria-expanded:bg-(--pair-press-surface)",
        ghost:
          "text-(--ink-soft) hover:scale-100 hover:bg-(--pair-raised-surface) hover:text-(--pair-raised-ink) aria-expanded:bg-(--pair-raised-surface) aria-expanded:text-(--pair-raised-ink) aria-current:bg-(--pair-raised-surface) aria-current:text-(--pair-raised-ink)",
        destructive:
          "bg-(--pair-danger-surface) text-(--pair-danger-ink) hover:bg-(--pair-danger-surface)/80",
        link: "text-link underline-offset-4 hover:scale-100 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-6 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-8",
        icon: "size-10",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
