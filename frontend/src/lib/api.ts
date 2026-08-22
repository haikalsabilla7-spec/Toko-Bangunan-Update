// ============================================================
// Klien HTTP tunggal ke back-end. Ini SATU-SATUNYA pintu ke server.
// Kalau alamat/aturan server berubah, cukup ubah file ini.
// ============================================================

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
const TOKEN_KEY = "tb_token"

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
	if (token) localStorage.setItem(TOKEN_KEY, token)
	else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
	status: number
	constructor(status: number, message: string) {
		super(message)
		this.status = status
	}
}

// Dipanggil saat token ditolak (401) supaya AuthProvider bisa memaksa logout.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: (() => void) | null) {
	onUnauthorized = fn
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const headers: Record<string, string> = {}
	const token = getToken()
	if (token) headers["Authorization"] = `Bearer ${token}`

	const opts: RequestInit = { method, headers }
	if (body !== undefined) {
		headers["Content-Type"] = "application/json"
		opts.body = JSON.stringify(body)
	}

	const res = await fetch(`${BASE}${path}`, opts)
	const text = await res.text()
	const data = text ? JSON.parse(text) : null

	if (!res.ok) {
		if (res.status === 401) {
			setToken(null)
			onUnauthorized?.()
		}
		throw new ApiError(res.status, data?.error ?? "Terjadi kesalahan")
	}
	return data as T
}

export const api = {
	get: <T>(path: string) => request<T>("GET", path),
	post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
	put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
	del: <T>(path: string) => request<T>("DELETE", path),
}

// Bantu bangun query string dari objek (mengabaikan nilai kosong).
export function qs(params: Record<string, string | undefined>): string {
	const sp = new URLSearchParams()
	for (const [k, v] of Object.entries(params)) {
		if (v !== undefined && v !== "") sp.set(k, v)
	}
	const s = sp.toString()
	return s ? `?${s}` : ""
}
