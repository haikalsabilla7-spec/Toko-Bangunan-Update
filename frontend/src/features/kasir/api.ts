import { useMutation, useQuery } from "@tanstack/react-query"
import { api, qs } from "@/lib/api"
import { queryClient } from "@/lib/queryClient"
import type { SimpanTransaksiInput } from "@/types/database"

export interface HasilTransaksi {
	id: string
	no_transaksi: string
	tanggal: string
}

/** Simpan transaksi secara atomik di back-end (POST /transaksi). */
export function useSimpanTransaksi() {
	return useMutation({
		mutationFn: (payload: SimpanTransaksiInput) =>
			api.post<HasilTransaksi>("/transaksi", payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["barang"] })
			queryClient.invalidateQueries({ queryKey: ["dashboard"] })
			queryClient.invalidateQueries({ queryKey: ["piutang"] })
		},
	})
}

/** ID barang paling laris (untuk grid tombol cepat). */
export function useBarangLaris(topN = 8) {
	return useQuery({
		queryKey: ["kasir", "laris", topN],
		queryFn: () => api.get<string[]>(`/transaksi/laris${qs({ top: String(topN) })}`),
	})
}
