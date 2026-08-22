import { useQuery } from "@tanstack/react-query"
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
