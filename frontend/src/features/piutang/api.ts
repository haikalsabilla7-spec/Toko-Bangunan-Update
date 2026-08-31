import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { PembayaranPiutang, Piutang } from "@/types/database"

export function usePiutangList() {
	return useQuery({
		queryKey: ["piutang", "list"],
		queryFn: () => api.get<Piutang[]>("/piutang"),
	})
}

export function usePembayaranPiutang(piutangId: string | null) {
	return useQuery({
		queryKey: ["piutang", "bayar", piutangId],
		enabled: !!piutangId,
		queryFn: () => api.get<PembayaranPiutang[]>(`/piutang/${piutangId}/pembayaran`),
	})
}

export function useCatatPembayaranPiutang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: { piutang_id: string; nominal: number }) =>
			api.post(`/piutang/${input.piutang_id}/bayar`, { nominal: input.nominal }),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["piutang"] }),
	})
}

/** Hapus SATU piutang (pembayaran ikut terhapus). Khusus pemilik. */
export function useHapusPiutang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.del(`/piutang/${id}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["piutang"] }),
	})
}

/** Hapus SEMUA piutang sekaligus. Khusus pemilik. */
export function useHapusSemuaPiutang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.del(`/piutang`),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["piutang"] }),
	})
}