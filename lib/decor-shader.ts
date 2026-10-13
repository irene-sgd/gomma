/**
 * Decor shader: the glow and the ribbon texture as one WebGL2 fragment shader.
 * (docs/design-system.html#decor). Copy lib/ and react/ into a project's src/.
 *
 * - Gradient: a soft mesh of color fields that drift slowly across the right
 *   of the surface, trading two brand colors back and forth. There are no
 *   angular terms, so it never pinches into a radial or conic pattern.
 * - Ribbons: bundles of hairlines that are the exact Bezier ribbons of the SVG
 *   decor. A bundle is a patch S(t, v) = A(t) + (B(t) - A(t)) * v between two
 *   cubic edges, so each hairline is a constant-v curve. Per pixel, Newton's
 *   method inverts the patch to (t, v); the lines are then drawn as constant
 *   pixel-width iso-lines of v, brighter toward the top edge, each breathing
 *   with a travelling phase, fading out toward the copy side.
 *
 * Motifs: "sweep" (two bundles fanning up from the bottom-left) and "veil"
 * (one wide S-curve band). The canvas is composited with mix-blend-mode:
 * screen over the surface, so the surface keeps its own color. Renders one
 * static frame under prefers-reduced-motion, pauses offscreen and in hidden
 * tabs, caps at 30fps and 2x pixel ratio. createDecorShader returns null when
 * WebGL2 is missing so the caller can fall back to the CSS and SVG decor.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_dpr;
uniform int u_motif; // 0 = sweep, 1 = veil
uniform vec3 u_a;
uniform vec3 u_b;
out vec4 outColor;

vec2 bez(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float s = 1.0 - t;
  return s * s * s * p0 + 3.0 * s * s * t * p1 + 3.0 * s * t * t * p2 + t * t * t * p3;
}
vec2 dbez(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
  float s = 1.0 - t;
  return 3.0 * s * s * (p1 - p0) + 6.0 * s * t * (p2 - p1) + 3.0 * t * t * (p3 - p2);
}

// One ribbon bundle between cubic edges A and B, n hairlines spaced by an
// ease. Returns coverage * opacity for this pixel (p is in art pixels).
float bundle(vec2 p,
             vec2 a0, vec2 a1, vec2 a2, vec2 a3,
             vec2 b0, vec2 b1, vec2 b2, vec2 b3,
             float n, float ease, float base, float gamma, float tm) {
  // initial guess from the chords, then Newton on S(t, v) = p
  vec2 ca = a3 - a0;
  vec2 cb = b3 - b0;
  float t = clamp(dot(p - a0, ca) / dot(ca, ca), 0.0, 1.0);
  float dA = (ca.x * (p.y - a0.y) - ca.y * (p.x - a0.x)) / length(ca);
  float dB = (cb.x * (p.y - b0.y) - cb.y * (p.x - b0.x)) / length(cb);
  float den = dA - dB;
  if (abs(den) < 1e-3) den = 1e-3;
  float v = dA / den;
  for (int i = 0; i < 6; i++) {
    vec2 A = bez(a0, a1, a2, a3, t);
    vec2 B = bez(b0, b1, b2, b3, t);
    vec2 dAt = dbez(a0, a1, a2, a3, t);
    vec2 dBt = dbez(b0, b1, b2, b3, t);
    vec2 S = A + (B - A) * v;
    vec2 St = dAt + (dBt - dAt) * v;
    vec2 Sv = B - A;
    vec2 F = S - p;
    float det = St.x * Sv.y - St.y * Sv.x;
    if (abs(det) < 1e-4) break;
    t -= (F.x * Sv.y - F.y * Sv.x) / det;
    v -= (St.x * F.y - St.y * F.x) / det;
    t = clamp(t, -0.3, 1.3);
  }
  float mV = smoothstep(-0.02, 0.02, v) * (1.0 - smoothstep(0.98, 1.02, v));
  float mT = smoothstep(0.0, 0.05, t);
  float u = pow(clamp(v, 0.0, 1.0), 1.0 / ease);   // 0..1 across the bundle
  float x = u * (n - 1.0);                          // hairlines at integers
  float id = floor(x + 0.5);
  float phase = 0.10 * sin(tm * 0.39 + id * 0.22);  // each line breathes
  float w = max(fwidth(x), 1e-4);                   // cells per device pixel
  float dpx = abs(x - id - phase) / w;              // distance to line, in px
  float cov = clamp(0.4 * u_dpr - dpx + 0.5, 0.0, 1.0);
  cov *= smoothstep(1.2, 3.0, 1.0 / w);             // no moire when too dense
  float op = base + (1.0 - base) * pow(1.0 - u, gamma);
  return cov * op * mV * mT;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float t = u_time;

  // color drift: the two brand colors slowly trade places
  float k = 0.5 + 0.5 * sin(t * 0.22);
  vec3 cA = mix(u_a, u_b, k);
  vec3 cB = mix(u_b, u_a, k);
  vec3 col = mix(u_a, u_b, 0.5 + 0.5 * sin(t * 0.22));

  // dynamic gradient: a few soft color fields drifting across the surface,
  // under a gentle domain warp. No angular terms, so no pinch points or rays.
  vec2 g = uv + 0.05 * vec2(sin(uv.y * 3.0 + t * 0.21), cos(uv.x * 2.6 - t * 0.17));
  vec2 d1 = (g - vec2(0.80 + 0.07 * sin(t * 0.13), 0.32 + 0.16 * sin(t * 0.17 + 1.0))) / vec2(0.36, 0.60);
  vec2 d2 = (g - vec2(0.93 + 0.05 * cos(t * 0.11), 0.70 + 0.15 * cos(t * 0.15))) / vec2(0.30, 0.55);
  vec2 d3 = (g - vec2(0.64 + 0.09 * sin(t * 0.09 + 2.0), 0.52 + 0.18 * sin(t * 0.12 + 4.0))) / vec2(0.32, 0.75);
  float w1 = exp(-dot(d1, d1)) * 0.30;
  float w2 = exp(-dot(d2, d2)) * 0.26;
  float w3 = exp(-dot(d3, d3)) * 0.14;
  float wsum = w1 + w2 + w3;
  vec3 gCol = (cA * w1 + cB * w2 + mix(cA, cB, 0.5) * w3) / max(wsum, 1e-3);
  gCol = mix(gCol, vec3(1.0), 0.12);
  // keep the copy side clear
  float gA = clamp(wsum, 0.0, 0.42) * smoothstep(0.12, 0.7, uv.x);

  // ribbons live in a 471 x 257 art space that covers the box and is anchored
  // right, like the SVG decor (preserveAspectRatio xMaxYMid slice); y is up
  float scale = max(u_res.x / 471.0, u_res.y / 257.0);
  vec2 art = vec2(471.0 - (u_res.x - gl_FragCoord.x) / scale,
                  128.5 + (gl_FragCoord.y - 0.5 * u_res.y) / scale);
  float rib = 0.0;
  if (u_motif == 0) {
    float b1 = bundle(art,
      vec2(-30.0, -5.0), vec2(140.0, 19.0), vec2(320.0, 127.0), vec2(520.0, 277.0),
      vec2(-30.0, -5.0), vec2(120.0, -5.0), vec2(310.0, 52.0), vec2(520.0, 187.0),
      46.0, 1.5, 0.35, 1.4, t);
    float b2 = bundle(art,
      vec2(150.0, -33.0), vec2(300.0, 7.0), vec2(430.0, 87.0), vec2(520.0, 167.0),
      vec2(150.0, -33.0), vec2(290.0, -28.0), vec2(430.0, 7.0), vec2(520.0, 87.0),
      30.0, 1.4, 0.25, 1.4, t + 3.0);
    rib = max(b1, b2 * 0.9);
  } else {
    rib = bundle(art,
      vec2(-20.0, 197.0), vec2(150.0, 247.0), vec2(300.0, 107.0), vec2(500.0, 187.0),
      vec2(-20.0, 107.0), vec2(160.0, 117.0), vec2(310.0, 7.0), vec2(500.0, 57.0),
      62.0, 1.0, 0.30, 1.1, t);
  }
  float fadeX = smoothstep(0.28, 1.0, uv.x);
  float lA = clamp(rib * fadeX * 1.15, 0.0, 1.0);
  vec3 lCol = mix(vec3(1.0), col, 0.45);

  float a = clamp(gA + lA, 0.0, 1.0);
  vec3 rgb = min(gCol * gA + lCol * lA, vec3(a));
  outColor = vec4(rgb, a);
}`;

type RGB = [number, number, number];

function readColor(el: Element, prop: string, fallback: string): RGB {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [1, 1, 1];
  ctx.fillStyle = fallback;
  const raw = getComputedStyle(el).getPropertyValue(prop).trim();
  if (raw) ctx.fillStyle = raw; // an invalid value keeps the fallback
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("decor shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export type DecorShaderHandle = { destroy: () => void };

export type DecorMotif = "sweep" | "veil";

export function createDecorShader(
  canvas: HTMLCanvasElement,
  opts: { motif?: DecorMotif } = {},
): DecorShaderHandle | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uDpr = gl.getUniformLocation(prog, "u_dpr");
  const uMotif = gl.getUniformLocation(prog, "u_motif");
  const uA = gl.getUniformLocation(prog, "u_a");
  const uB = gl.getUniformLocation(prog, "u_b");

  const a = readColor(canvas, "--decor-a", "#3b82f6");
  const b = readColor(canvas, "--decor-b", "#14b8a6");
  gl.uniform3f(uA, a[0], a[1], a[2]);
  gl.uniform3f(uB, b[0], b[1], b[2]);
  gl.uniform1i(uMotif, opts.motif === "veil" ? 1 : 0);
  gl.clearColor(0, 0, 0, 0);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const STATIC_T = 11; // a good-looking still frame
  let raf = 0;
  let visible = true;
  let onScreen = true;
  let last = 0;
  const t0 = performance.now();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uDpr, dpr);
  };

  const draw = (t: number) => {
    gl.uniform1f(uTime, t);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    raf = 0;
    if (!visible || !onScreen || reduced.matches) return;
    if (now - last >= 33) {
      last = now;
      draw((now - t0) / 1000);
    }
    raf = requestAnimationFrame(frame);
  };

  const sync = () => {
    resize();
    if (reduced.matches) {
      draw(STATIC_T);
    } else if (!raf && visible && onScreen) {
      raf = requestAnimationFrame(frame);
    }
  };

  const ro = new ResizeObserver(sync);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    sync();
  });
  io.observe(canvas);
  const onVis = () => {
    visible = document.visibilityState === "visible";
    sync();
  };
  document.addEventListener("visibilitychange", onVis);
  reduced.addEventListener("change", sync);
  sync();

  return {
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      reduced.removeEventListener("change", sync);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
