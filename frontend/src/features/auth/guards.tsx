import { Navigate, useLocation } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "./AuthProvider"
import { FullScreenLoader } from "@/components/ui/Loader"

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenLoader label="Memuat sesi..." />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

export function RequirePemilik({ children }: { children: ReactNode }) {
  const { isPemilik, loading } = useAuth()
  if (loading) return <FullScreenLoader label="Memuat..." />
  if (!isPemilik) return <Navigate to="/kasir" replace />
  return <>{children}</>
}
