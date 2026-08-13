import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { CheckCircle2, XCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/cn"

type ToastType = "success" | "error" | "info"
interface Toast {
  id: number
  type: ToastType
  message: string
}

const ToastCtx = createContext<{
  toast: (message: string, type?: ToastType) => void
} | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-md border bg-surface px-3 py-2 text-sm shadow-card",
              t.type === "success" && "border-ok/30",
              t.type === "error" && "border-danger/30",
              t.type === "info" && "border-line",
            )}
          >
            {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-ok" />}
            {t.type === "error" && <XCircle className="h-4 w-4 text-danger" />}
            {t.type === "info" && <Info className="h-4 w-4 text-ink-muted" />}
            <span className="text-ink">{t.message}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              <X className="h-3.5 w-3.5 text-ink-muted" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error("useToast harus dipakai di dalam ToastProvider")
  return ctx.toast
}
