import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api, qs } from "@/lib/api"
import type { Barang, BarangWithKategori, Kategori } from "@/types/database"

export const barangKeys = {
	all: ["barang"] as const,
	list: (filter?: string) => ["barang", "list", filter ?? ""] as const,
}

export function useKategori() {
	return useQuery({
		queryKey: ["kategori"],
		queryFn: () => api.get<Kategori[]>("/kategori"),
	})
}

export function useBarangList() {
	return useQuery({
		queryKey: barangKeys.list(),
		queryFn: () => api.get<BarangWithKategori[]>("/barang"),
	})
}

/** Cari 1 barang berdasarkan barcode ATAU kode (untuk scan di kasir). */
export async function cariBarangByKode(kode: string): Promise<Barang | null> {
	return api.get<Barang | null>(`/barang/cari${qs({ kode })}`)
}

export interface BarangInput {
	kode: string
	nama: string
	kategori_id: string | null
	satuan: string
	harga_beli: number
	harga_jual: number
	stok: number
	barcode: string | null
}

export function useSimpanBarang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async ({ id, input }: { id?: string; input: BarangInput }) => {
			if (id) await api.put(`/barang/${id}`, input)
			else await api.post("/barang", input)
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
	})
}

export function useHapusBarang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: string) => api.del(`/barang/${id}`),
		onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
	})
}

export function useHapusSemuaBarang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: () => api.del<{ ok: boolean; deleted: number }>("/barang"),
		onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
	})
}

/** Import massal dari CSV (array baris tervalidasi). */
export function useImportBarang() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async (rows: BarangInput[]) => {
			const res = await api.post<{ count: number }>("/barang/import", { rows })
			return res.count
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
	})
}
