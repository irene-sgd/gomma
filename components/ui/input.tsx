import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-full bg-secondary px-4 py-3 text-base text-foreground transition-colors duration-100 outline-none placeholder:text-muted-foreground hover:bg-accent focus-visible:outline-3 focus-visible:outline-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:outline-3 aria-invalid:outline-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
