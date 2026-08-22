import { Loader2 } from "lucide-react"

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return <Loader2 className={`animate-spin text-ink-muted ${className}`} />
}

export function FullScreenLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-surface-sunken">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <Spinner className="h-7 w-7" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  )
}

export function InlineLoader({ label = "Memuat data..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-muted">
      <Spinner /> {label}
    </div>
  )
}
