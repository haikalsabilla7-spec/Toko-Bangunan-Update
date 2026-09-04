import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Role } from "@/types/database"

export interface Pengguna {
	id: string
	email: string
	nama: string
	role: Role
	created_at: string
}

export const penggunaKeys = {
	all: ["pengguna"] as const,
	list: () => ["pengguna", "list"] as const,
}

export function usePenggunaList() {
	return useQuery({
		queryKey: penggunaKeys.list(),
		queryFn: () => api.get<Pengguna[]>("/users"),
	})
}

export interface PenggunaCreateInput {
	email: string
	nama: string
	role: Role
	password: string
}

export interface PenggunaUpdateInput {
	nama: string
	role: Role
	password?: string
}

export function useSimpanPengguna() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (
			args:
				| { mode: "create"; input: PenggunaCreateInput }
				| { mode: "update"; id: string; input: PenggunaUpdateInput },
		) => {
			if (args.mode === "create") await api.post("/users", args.input)
			else await api.put(`/users/${args.id}`, args.input)
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: penggunaKeys.all }),
	})
}

export function useHapusPengguna() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.del(`/users/${id}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: penggunaKeys.all }),
	})
}