import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full font-bold whitespace-nowrap transition-[transform,background-color,color,box-shadow] duration-[33ms] outline-none select-none hover:scale-[1.04] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-100 active:opacity-70 disabled:pointer-events-none disabled:opacity-50 motion-reduce:hover:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        accent: "bg-success text-success-foreground",
        outline:
          "bg-transparent text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--foreground)]",
        secondary: "bg-secondary text-foreground hover:bg-accent",
        ghost:
          "bg-transparent text-muted-foreground hover:scale-100 hover:bg-secondary hover:text-foreground",
        link: "bg-transparent px-0 text-muted-foreground hover:scale-100 hover:text-foreground",
      },
      size: {
        default:
          "h-8 gap-2 px-4 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-12 gap-2 px-8 text-base",
        icon: "size-8",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-6",
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
