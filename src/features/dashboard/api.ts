import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { BATAS_STOK_MENIPIS } from "@/types/database"

export interface RingkasanDashboard {
  penjualanHariIni: number
  jumlahTransaksiHariIni: number
  jumlahStokMenipis: number
  totalPiutangBelumLunas: number
}

function awalHariIni(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<RingkasanDashboard> => {
      const sejak = awalHariIni()

      const [trxRes, barangRes, piutangRes] = await Promise.all([
        supabase.from("transaksi").select("total").gte("tanggal", sejak),
        supabase.from("barang").select("id, stok").lte("stok", BATAS_STOK_MENIPIS),
        supabase.from("piutang").select("sisa").eq("status", "belum_lunas"),
      ])

      if (trxRes.error) throw trxRes.error
      if (barangRes.error) throw barangRes.error
      if (piutangRes.error) throw piutangRes.error

      const penjualan = (trxRes.data ?? []).reduce((s, r) => s + Number(r.total), 0)
      const piutang = (piutangRes.data ?? []).reduce((s, r) => s + Number(r.sisa), 0)

      return {
        penjualanHariIni: penjualan,
        jumlahTransaksiHariIni: trxRes.data?.length ?? 0,
        jumlahStokMenipis: barangRes.data?.length ?? 0,
        totalPiutangBelumLunas: piutang,
      }
    },
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
    queryFn: async (): Promise<StokMenipisRow[]> => {
      const { data, error } = await supabase
        .from("barang")
        .select("id, nama, kode, stok, satuan")
        .lte("stok", BATAS_STOK_MENIPIS)
        .order("stok", { ascending: true })
        .limit(20)
      if (error) throw error
      return (data as StokMenipisRow[]) ?? []
    },
  })
}
