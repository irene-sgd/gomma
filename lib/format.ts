import type { Tone } from "@/lib/types"

export const baht = (n: number) =>
  `฿${Math.round(Math.abs(n)).toLocaleString()}`

export const signedBaht = (n: number) => `${n < 0 ? "−" : "+"}${baht(n)}`

export function badgeVariant(
  tone: Tone
): "default" | "success" | "active" | "danger" {
  if (tone === "success" || tone === "active" || tone === "danger") return tone
  return "default"
}

export const dotClass: Record<Tone, string> = {
  success: "bg-success",
  active: "bg-foreground",
  info: "bg-promo-blue",
  danger: "bg-destructive",
  neutral: "bg-tinted",
}

export function monthLabel(ym: string) {
  const [y, m] = ym.split("-")
  if (!y || !m) return ym
  const name = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", {
    month: "short",
  })
  return `${name} ${y.slice(2)}`
}
