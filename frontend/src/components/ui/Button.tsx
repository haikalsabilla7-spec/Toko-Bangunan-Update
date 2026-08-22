import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"
import { Loader2 } from "lucide-react"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline"
type Size = "sm" | "md" | "lg"

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:bg-accent-hover border border-transparent",
  secondary: "bg-ink text-white hover:bg-ink-soft border border-transparent",
  outline: "bg-surface text-ink border border-line-strong hover:bg-surface-sunken",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-sunken border border-transparent",
  danger: "bg-surface text-danger border border-danger/30 hover:bg-danger/5",
}

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-14 px-6 text-base gap-2 font-semibold",
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium select-none",
        "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
