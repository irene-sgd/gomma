import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Highlight surface: a surface and ink pair with the diagonal sheen, plus
 * optional decorative lines (see decor-sweep.tsx) as children. Reserved for
 * one promo or CTA per view. Pass any brand pair name from brands/*.css, e.g.
 * "blue" (level 3) or "blue-vivid" (level 6): use one, never both.
 * Text, icons and the CTA read --ink and --ink-soft from the pair. The sheen
 * comes from brands/<name>.css for the brand and vivid pairs.
 */
export function TintSurface({
  pair,
  className,
  children,
}: {
  pair: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-pair={pair}
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
