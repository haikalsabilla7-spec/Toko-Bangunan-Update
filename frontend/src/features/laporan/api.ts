import { useQuery } from "@tanstack/react-query"
import { api, qs } from "@/lib/api"

export interface Periode {
	dari: string // ISO
	sampai: string // ISO
}

export interface LaporanRingkas {
	pemasukan: number
	hpp: number
	laba: number
	pengeluaranUtang: number
	jumlahTransaksi: number
}

export interface BarisLabaBarang {
	barang_id: string
	nama: string
	qty: number
	omzet: number
	modal: number
	laba: number
}

export interface HasilLaporan {
	ringkas: LaporanRingkas
	perBarang: BarisLabaBarang[]
}

export function useLaporan(periode: Periode) {
	return useQuery({
		queryKey: ["laporan", periode.dari, periode.sampai],
		queryFn: () =>
			api.get<HasilLaporan>(`/laporan${qs({ dari: periode.dari, sampai: periode.sampai })}`),
	})
}

export interface LaporanStokRow {
	id: string
	kode: string
	nama: string
	stok: number
	satuan: string
	harga_beli: number
	harga_jual: number
	nilai_modal: number
	nilai_jual: number
}

export function useLaporanStok() {
	return useQuery({
		queryKey: ["laporan", "stok"],
		queryFn: () => api.get<LaporanStokRow[]>("/laporan/stok"),
	})
}

/** Ekspor array objek ke file CSV & unduh. */
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
	if (rows.length === 0) return
	const headers = Object.keys(rows[0]!)
	const esc = (v: unknown) => {
		const s = String(v ?? "")
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
	}
	const csv = [
		headers.join(","),
		...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
	].join("\n")
	const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
