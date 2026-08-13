import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profil, Role } from "@/types/database"

interface AuthState {
  session: Session | null
  profil: Profil | null
  loading: boolean
  isPemilik: boolean
  role: Role | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfil(userId: string) {
    const { data } = await supabase.from("profil").select("*").eq("id", userId).maybeSingle()
    setProfil(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadProfil(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s?.user) await loadProfil(s.user.id)
      else setProfil(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(mapAuthError(error.message))
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfil(null)
  }

  const value: AuthState = {
    session,
    profil,
    loading,
    role: profil?.role ?? null,
    isPemilik: profil?.role === "pemilik",
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function mapAuthError(msg: string): string {
  if (msg.includes("Invalid login")) return "Email atau kata sandi salah."
  if (msg.includes("Email not confirmed")) return "Email belum dikonfirmasi."
  return "Gagal masuk. Coba lagi."
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider")
  return ctx
}
