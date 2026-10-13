"use client";

import { useEffect, useRef, useState } from "react";
import { DecorSweep } from "@/components/ui/decor-sweep";
import { createDecorShader, type DecorMotif } from "@/lib/decor-shader";

/**
 * The drifting gradient and the Bezier ribbon texture as one fragment shader (see
 * lib/decor-shader.ts). The two colors it drifts between come from the
 * --decor-a and --decor-b custom properties. Falls back to the CSS and SVG
 * decor (DecorSweep) when WebGL2 is unavailable.
 */
export function DecorShader({ motif = "sweep" }: { motif?: DecorMotif }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const handle = createDecorShader(canvas, { motif });
    if (!handle) {
      const id = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(id);
    }
    return () => handle.destroy();
  }, [motif]);

  if (failed) return <DecorSweep />;
  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full mix-blend-screen"
    />
  );
}
