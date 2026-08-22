import { type ReactNode, useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/cn"

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg"
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div
        className={cn(
          "w-full rounded-t-md bg-surface shadow-card sm:rounded-md",
          width,
          "max-h-[92vh] overflow-hidden flex flex-col",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="font-grotesk text-base font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-surface-sunken" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-4 py-3">{footer}</div>}
      </div>
    </div>
  )
}
