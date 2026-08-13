import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { HardHat } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "./AuthProvider"

const schema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const { signIn, session } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (session) {
    return <Navigate to="/kasir" replace />
  }

  async function onSubmit(values: FormValues) {
    setAuthError(null)
    try {
      await signIn(values.email, values.password)
      navigate("/kasir", { replace: true })
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Gagal masuk")
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panel kiri industrial */}
      <div className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <p className="font-grotesk text-lg font-bold leading-none">Toko Bangunan</p>
            <p className="text-2xs uppercase tracking-widest text-white/50">Sistem Kasir</p>
          </div>
        </div>
        <div className="max-w-sm">
          <h1 className="font-grotesk text-3xl font-bold leading-tight">
            Kasir cepat untuk toko material.
          </h1>
          <p className="mt-3 text-sm text-white/60">
            Scan, hitung, cetak struk. Kelola stok besi, semen, cat, dan pipa dalam satu layar.
          </p>
        </div>
        <p className="text-2xs text-white/40">v1.0 · Dibuat untuk tablet & scanner Bluetooth</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-surface-sunken p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-accent">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-grotesk text-xl font-bold">Toko Bangunan</h1>
          </div>
          <h2 className="font-grotesk text-lg font-bold">Masuk</h2>
          <p className="mb-5 text-sm text-ink-muted">Gunakan akun yang terdaftar di toko.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="nama@toko.com"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Kata sandi"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            {authError && (
              <p className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                {authError}
              </p>
            )}
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
