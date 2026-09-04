import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PembayaranUtang, Utang } from "@/types/database"

export function useUtangList() {
	return useQuery({
		queryKey: ["utang", "list"],
		queryFn: () => api.get<Utang[]>("/utang"),
	})
}

export function useSimpanUtang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: {
			supplier: string
			nominal: number
			jatuh_tempo: string | null
			catatan: string | null
		}) => api.post("/utang", input),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
	})
}

export function usePembayaranUtang(utangId: string | null) {
	return useQuery({
		queryKey: ["utang", "bayar", utangId],
		enabled: !!utangId,
		queryFn: () => api.get<PembayaranUtang[]>(`/utang/${utangId}/pembayaran`),
	})
}

export function useCatatPembayaranUtang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: { utang_id: string; nominal: number }) =>
			api.post(`/utang/${input.utang_id}/bayar`, { nominal: input.nominal }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
	})
}

/** Hapus SATU utang (pembayaran ikut terhapus). Khusus pemilik. */
export function useHapusUtang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.del(`/utang/${id}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
	})
}

/** Hapus SEMUA utang sekaligus. Khusus pemilik. */
export function useHapusSemuaUtang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.del(`/utang`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
	})
}