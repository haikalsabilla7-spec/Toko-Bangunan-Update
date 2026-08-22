import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react"
import { api, setToken, getToken, setUnauthorizedHandler } from "@/lib/api"
import type { Role } from "@/types/database"

export interface AuthUser {
	id: string
	nama: string
	email: string
	role: Role
}

interface AuthState {
	user: AuthUser | null
	// Alias `profil` & `session` dipertahankan agar komponen lama tetap jalan.
	profil: AuthUser | null
	session: { user: { id: string } } | null
	loading: boolean
	isPemilik: boolean
	role: Role | null
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// Kalau token 401 di tengah pemakaian, otomatis logout.
		setUnauthorizedHandler(() => setUser(null))

		const token = getToken()
		if (!token) {
			setLoading(false)
			return
		}
		api
			.get<{ user: AuthUser }>("/auth/me")
			.then((res) => setUser(res.user))
			.catch(() => {
				setToken(null)
				setUser(null)
			})
			.finally(() => setLoading(false))

		return () => setUnauthorizedHandler(null)
	}, [])

	async function signIn(email: string, password: string) {
		const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
			email,
			password,
		})
		setToken(res.token)
		setUser(res.user)
	}

	async function signOut() {
		setToken(null)
		setUser(null)
	}

	const value: AuthState = {
		user,
		profil: user,
		session: user ? { user: { id: user.id } } : null,
		loading,
		role: user?.role ?? null,
		isPemilik: user?.role === "pemilik",
		signIn,
		signOut,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider")
	return ctx
}
