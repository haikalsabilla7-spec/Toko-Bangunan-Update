import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface RingkasanDashboard {
	penjualanHariIni: number
	jumlahTransaksiHariIni: number
	jumlahStokMenipis: number
	totalPiutangBelumLunas: number
}

export function useDashboard() {
	return useQuery({
		queryKey: ["dashboard"],
		queryFn: () => api.get<RingkasanDashboard>("/dashboard"),
	})
}

export interface StokMenipisRow {
	id: string
	nama: string
	kode: string
	stok: number
	satuan: string
}

export function useStokMenipis() {
	return useQuery({
		queryKey: ["dashboard", "stok-menipis"],
		queryFn: () => api.get<StokMenipisRow[]>("/dashboard/stok-menipis"),
	})
}
