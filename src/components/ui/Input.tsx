import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  right?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, right, className, id, ...rest },
  ref,
) {
  const inputId = id || rest.name
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "input-base",
            error && "border-danger focus:border-danger focus:ring-danger/30",
            right && "pr-10",
            className,
          )}
          {...rest}
        />
        {right && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{right}</span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  )
})
