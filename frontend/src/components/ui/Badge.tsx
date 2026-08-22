import { cn } from "@/lib/cn"

type Tone = "neutral" | "accent" | "ok" | "warn" | "danger"

const tones: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-ink-soft border-line",
  accent: "bg-accent-soft text-accent border-accent-line",
  ok: "bg-ok-soft text-ok border-ok/20",
  warn: "bg-warn-soft text-warn border-warn/20",
  danger: "bg-danger-soft text-danger border-danger/20",
}

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
