import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface PergerakanStok {
	id: string
	tanggal: string
	barang_nama: string
	jenis: "masuk" | "penyesuaian" | "penjualan"
	qty: number
	keterangan: string
}

export function useRiwayatStok() {
	return useQuery({
		queryKey: ["stok", "riwayat"],
		queryFn: () => api.get<PergerakanStok[]>("/stok/riwayat"),
	})
}

export function useCatatStokMasuk() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (input: {
			barang_id: string
			qty: number
			harga_beli: number
			supplier: string | null
			catatan: string | null
		}) => api.post("/stok/masuk", input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["stok"] })
			qc.invalidateQueries({ queryKey: ["barang"] })
		},
	})
}

export function useCatatPenyesuaian() {
	const qc = useQueryClient()
	return useMutation({
		// user_id di-set otomatis oleh back-end dari token login.
		mutationFn: (input: { barang_id: string; qty_perubahan: number; alasan: string }) =>
			api.post("/stok/penyesuaian", input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["stok"] })
			qc.invalidateQueries({ queryKey: ["barang"] })
		},
	})
}
