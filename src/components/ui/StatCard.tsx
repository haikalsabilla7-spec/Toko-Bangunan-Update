import type { LucideIcon } from "lucide-react"

type Tone = "neutral" | "accent" | "ok" | "warn" | "danger"

const toneCls: Record<Tone, string> = {
  neutral: "text-ink-muted",
  accent: "text-accent",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
}

/** Kartu statistik ringkas — dipakai di Dashboard & Laporan. */
export function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone = "neutral",
  size = "lg",
}: {
  icon: LucideIcon
  label: string
  value: string
  suffix?: string
  tone?: Tone
  size?: "md" | "lg"
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</span>
        <Icon className={`h-4 w-4 ${toneCls[tone]}`} />
      </div>
      <p
        className={`num mt-2 font-grotesk font-bold text-ink ${
          size === "lg" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        }`}
      >
        {value}
      </p>
      {suffix && <p className="text-xs text-ink-muted">{suffix}</p>}
    </div>
  )
}
