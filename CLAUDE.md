@AGENTS.md

# Design system: spotify-developed-gomma

This is the contract every session follows. The full reference is `docs/design-system.html`.

## Always use surface and ink pairs

Every surface is a pair: `--surface`, `--ink` and `--ink-soft`, set by `data-pair="<name>"`. Pairs live in `app/design-system/pairs.css` (neutral and status) and `app/design-system/brands/indigo.css` (the brand, generated from #4338ca with vivid #818cf8 by the base folder's `tools/brand.py`).

- A new surface gets a pair first. Components read `--surface`, `--ink` and `--ink-soft` from it. Never set a text or fill color directly with `text-white`, `text-zinc-*`, `bg-[#...]`, or a fixed token like `text-foreground` on a surface.
- Secondary text is `text-ink-soft`. Hierarchy otherwise comes from size and weight, not extra greys.
- The default button is the CTA: ink fill, surface-colored label. Fills step up the neutral pairs: raised, then press, then strong. Status uses the `warning` and `danger` pairs.
- Nested surfaces step up one neutral pair, with that pair's ink. Do not reuse the parent's ink on a new fill.
- The only color outside a pair is the link color `text-link`, on the neutral pairs.
- A new pair: choose surface and ink together and verify at least 4.5:1 for the ink and the soft ink. For pairs with the sheen, test the worst point across the gradient. `tools/brand.py` does this for brand pairs. Add the pair to the design system and the CSS in the same change.

## Other rules

- No borders or shadows on surfaces. Separation is a fill step and an 8px gap. The only border is the outline on secondary actions (`border-essential`).
- Decoration (sheen, arcs, decorative lines) is only for one highlight surface per view: a brand pair or its vivid pair, never both. It sits at the top of the page content, under the navbar and above the page header. The decor is a shader (`lib/decor-shader.ts`, `react/decor-shader.tsx`): a subtle mesh gradient drifting between `--decor-a` and `--decor-b` (the brand's two vivid fills), with exact ribbon lines on top, composited with `mix-blend-screen`. Never radial or conic gradients. It draws one static frame under `prefers-reduced-motion`, and falls back to the SVG decor without WebGL2. One shader canvas per view; nothing else in the chrome animates.
- Typography is two weights, 400 and 700, in the project's typeface (`--font-ui`). Hierarchy comes from size and weight, not color.
- Controls are pills (`rounded-full`). Containers are 8px (`rounded-lg`).
- Do not mock a surface color to "look right". If a surface is missing, add a pair.

## Dev notes

- After editing the global CSS, a dev server can serve stale CSS. Restart only this project's server, by PID. Never `pkill` by a broad pattern; other projects' dev servers may be running.
