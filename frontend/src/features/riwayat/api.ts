import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, qs } from "@/lib/api"

export interface RiwayatRow {
	id: string
	no_transaksi: string
	tanggal: string
	total: number
	metode_bayar: string
	status: string
	catatan: string | null
	kasir: { nama: string } | null
	piutang: { nominal: number; sisa: number; status: string } | null
}

export interface RiwayatFilter {
	dari?: string
	sampai?: string
	q?: string
}

/** Daftar transaksi (terbaru dulu) dengan filter tanggal & pencarian no. transaksi. */
export function useRiwayatTransaksi(filter: RiwayatFilter) {
	const { dari, sampai, q } = filter
	return useQuery({
		queryKey: ["riwayat", "list", dari ?? "", sampai ?? "", q ?? ""],
		queryFn: () =>
			api.get<RiwayatRow[]>(`/transaksi${qs({ dari, sampai, q })}`),
	})
}

export interface DetailItem {
	id: string
	qty: number
	harga_jual: number
	subtotal: number
	barang: { nama: string; satuan: string } | null
}

export interface DetailTransaksiHasil {
	items: DetailItem[]
	nama_pelanggan: string | null
}

/** Detail item + nama pelanggan (jika transaksi utang) untuk 1 transaksi. */
export function useDetailTransaksi(transaksiId: string | null) {
	return useQuery({
		queryKey: ["riwayat", "detail", transaksiId ?? ""],
		enabled: !!transaksiId,
		queryFn: () => api.get<DetailTransaksiHasil>(`/transaksi/${transaksiId}/detail`),
	})
}

/** Hapus SATU transaksi. Stok barang otomatis dikembalikan oleh server. Khusus pemilik. */
export function useHapusTransaksi() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.del(`/transaksi/${id}`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["riwayat"] })
			qc.invalidateQueries({ queryKey: ["piutang"] })
			qc.invalidateQueries({ queryKey: ["barang"] })
			qc.invalidateQueries({ queryKey: ["dashboard"] })
		},
	})
}

/** Hapus SEMUA transaksi sekaligus. Stok seluruh barang dikembalikan. Khusus pemilik. */
export function useHapusSemuaTransaksi() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.del(`/transaksi`),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["riwayat"] })
			qc.invalidateQueries({ queryKey: ["piutang"] })
			qc.invalidateQueries({ queryKey: ["barang"] })
			qc.invalidateQueries({ queryKey: ["dashboard"] })
		},
	})
}