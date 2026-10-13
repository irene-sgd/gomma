import type { CSSProperties } from "react";

/**
 * Decorative line motif "Sweep" (docs/design-system.html#decor).
 * Inline SVG: white hairlines that fade toward the text and blend with
 * overlay, so each line is a lighter shade of the surface beneath it.
 * Only for a promo or CTA surface, one per view.
 *
 * Glow and color drift: a soft gradient bloom (.decor-glow) sits behind the
 * lines and its blur, angle and color animate with registered custom
 * properties, drifting between --decor-a and --decor-b (your brand's vivid
 * fills). The lines' tint (--decor-line) follows. Import css/decor-motion.css.
 *
 * Motion: each line rotates a fraction of a degree about its bundle's origin
 * (the .decor-line keyframes in globals.css), with a small phase delay between
 * neighbours so a soft wave travels across the fan. 16s cycle, under 2 degrees
 * at the outer edge, off under prefers-reduced-motion.
 */
export function DecorSweep() {
  return (
    <>
      <div aria-hidden className="decor-glow" />
      <svg
      aria-hidden
      viewBox="0 0 471 257"
      preserveAspectRatio="xMaxYMid slice"
      fill="none"
      className="decor-lines pointer-events-none absolute inset-0 size-full mix-blend-overlay"
    >
      <defs>
        <linearGradient
          id="decor-fade"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="471"
          y2="0"
        >
          <stop offset="0" style={{ stopColor: "var(--decor-line)" }} stopOpacity="0" />
          <stop offset="0.3" style={{ stopColor: "var(--decor-line)" }} stopOpacity="0.1" />
          <stop offset="1" style={{ stopColor: "var(--decor-line)" }} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <g stroke="url(#decor-fade)" strokeWidth="0.8" strokeLinecap="round">
        <path d="M-30 262C140 238 320 130 520 -20" strokeOpacity={1.00} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 0, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139.9 238.1 320 130.2 520 -19.7" strokeOpacity={0.98} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 1, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139.8 238.2 319.9 130.7 520 -19.2" strokeOpacity={0.96} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 2, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139.7 238.4 319.8 131.3 520 -18.5" strokeOpacity={0.94} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 3, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139.5 238.6 319.7 132 520 -17.6" strokeOpacity={0.92} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 4, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139.3 238.9 319.6 132.8 520 -16.7" strokeOpacity={0.90} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 5, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C139 239.2 319.5 133.7 520 -15.6" strokeOpacity={0.88} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 6, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C138.8 239.5 319.4 134.6 520 -14.5" strokeOpacity={0.86} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 7, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C138.5 239.8 319.3 135.6 520 -13.3" strokeOpacity={0.84} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 8, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C138.2 240.1 319.1 136.7 520 -12" strokeOpacity={0.83} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 9, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C137.9 240.5 319 137.9 520 -10.6" strokeOpacity={0.81} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 10, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C137.6 240.9 318.8 139.1 520 -9.1" strokeOpacity={0.79} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 11, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C137.2 241.3 318.6 140.3 520 -7.6" strokeOpacity={0.77} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 12, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C136.9 241.7 318.4 141.6 520 -6" strokeOpacity={0.75} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 13, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C136.5 242.2 318.3 143 520 -4.4" strokeOpacity={0.74} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 14, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C136.2 242.6 318.1 144.4 520 -2.7" strokeOpacity={0.72} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 15, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C135.8 243.1 317.9 145.9 520 -0.9" strokeOpacity={0.70} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 16, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C135.4 243.6 317.7 147.4 520 0.9" strokeOpacity={0.68} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 17, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C134.9 244.1 317.5 149 520 2.8" strokeOpacity={0.67} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 18, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C134.5 244.6 317.3 150.6 520 4.7" strokeOpacity={0.65} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 19, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C134.1 245.1 317 152.2 520 6.7" strokeOpacity={0.64} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 20, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C133.6 245.7 316.8 153.9 520 8.7" strokeOpacity={0.62} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 21, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C133.2 246.2 316.6 155.6 520 10.8" strokeOpacity={0.60} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 22, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C132.7 246.8 316.3 157.4 520 12.9" strokeOpacity={0.59} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 23, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C132.2 247.3 316.1 159.2 520 15.1" strokeOpacity={0.57} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 24, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C131.7 247.9 315.9 161.1 520 17.3" strokeOpacity={0.56} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 25, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C131.2 248.5 315.6 162.9 520 19.5" strokeOpacity={0.54} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 26, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C130.7 249.2 315.4 164.9 520 21.8" strokeOpacity={0.53} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 27, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C130.2 249.8 315.1 166.8 520 24.2" strokeOpacity={0.52} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 28, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C129.7 250.4 314.8 168.8 520 26.6" strokeOpacity={0.50} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 29, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C129.1 251.1 314.6 170.8 520 29" strokeOpacity={0.49} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 30, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C128.6 251.7 314.3 172.9 520 31.5" strokeOpacity={0.48} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 31, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C128 252.4 314 175 520 34" strokeOpacity={0.46} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 32, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C127.4 253.1 313.7 177.1 520 36.5" strokeOpacity={0.45} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 33, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C126.9 253.8 313.4 179.3 520 39.1" strokeOpacity={0.44} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 34, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C126.3 254.5 313.1 181.4 520 41.7" strokeOpacity={0.43} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 35, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C125.7 255.2 312.8 183.7 520 44.4" strokeOpacity={0.42} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 36, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C125.1 255.9 312.5 185.9 520 47.1" strokeOpacity={0.41} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 37, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C124.5 256.6 312.2 188.2 520 49.8" strokeOpacity={0.40} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 38, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C123.9 257.4 311.9 190.5 520 52.6" strokeOpacity={0.39} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 39, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C123.2 258.1 311.6 192.9 520 55.4" strokeOpacity={0.38} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 40, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C122.6 258.9 311.3 195.2 520 58.3" strokeOpacity={0.37} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 41, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C122 259.6 311 197.6 520 61.2" strokeOpacity={0.36} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 42, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C121.3 260.4 310.7 200.1 520 64.1" strokeOpacity={0.36} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 43, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C120.7 261.2 310.3 202.5 520 67" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 44, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M-30 262C120 262 310 205 520 70" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 45, "--a": "0.04deg", "--ox": "-30px", "--oy": "262px" } as CSSProperties} />
        <path d="M150 290C300 250 430 170 520 90" strokeOpacity={1.00} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 0, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C299.9 250.3 430 170.7 520 90.7" strokeOpacity={0.96} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 1, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C299.8 250.8 430 171.9 520 91.9" strokeOpacity={0.93} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 2, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C299.6 251.5 430 173.3 520 93.3" strokeOpacity={0.89} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 3, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C299.4 252.2 430 175 520 95" strokeOpacity={0.86} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 4, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C299.1 253 430 176.8 520 96.8" strokeOpacity={0.83} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 5, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C298.9 253.9 430 178.8 520 98.8" strokeOpacity={0.79} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 6, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C298.6 254.8 430 180.9 520 100.9" strokeOpacity={0.76} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 7, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C298.4 255.8 430 183.2 520 103.2" strokeOpacity={0.73} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 8, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C298.1 256.8 430 185.5 520 105.5" strokeOpacity={0.70} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 9, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C297.7 257.9 430 188 520 108" strokeOpacity={0.66} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 10, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C297.4 259 430 190.6 520 110.6" strokeOpacity={0.63} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 11, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C297.1 260.2 430 193.3 520 113.3" strokeOpacity={0.61} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 12, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C296.7 261.4 430 196 520 116" strokeOpacity={0.58} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 13, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C296.4 262.6 430 198.9 520 118.9" strokeOpacity={0.55} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 14, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C296 263.9 430 201.8 520 121.8" strokeOpacity={0.52} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 15, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C295.7 265.2 430 204.8 520 124.8" strokeOpacity={0.49} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 16, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C295.3 266.6 430 207.9 520 127.9" strokeOpacity={0.47} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 17, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C294.9 268 430 211 520 131" strokeOpacity={0.44} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 18, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C294.5 269.4 430 214.3 520 134.3" strokeOpacity={0.42} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 19, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C294.1 270.8 430 217.6 520 137.6" strokeOpacity={0.40} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 20, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C293.6 272.3 430 220.9 520 140.9" strokeOpacity={0.37} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 21, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C293.2 273.8 430 224.3 520 144.3" strokeOpacity={0.35} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 22, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C292.8 275.3 430 227.8 520 147.8" strokeOpacity={0.33} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 23, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C292.3 276.9 430 231.4 520 151.4" strokeOpacity={0.31} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 24, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C291.9 278.4 430 235 520 155" strokeOpacity={0.30} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 25, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C291.4 280 430 238.7 520 158.7" strokeOpacity={0.28} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 26, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C291 281.7 430 242.4 520 162.4" strokeOpacity={0.27} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 27, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C290.5 283.3 430 246.2 520 166.2" strokeOpacity={0.26} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 28, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
        <path d="M150 290C290 285 430 250 520 170" strokeOpacity={0.25} vectorEffect="non-scaling-stroke" className="decor-line" style={{ "--i": 29, "--a": "0.05deg", "--ox": "150px", "--oy": "290px" } as CSSProperties} />
      </g>
    </svg>
    </>
  );
}
