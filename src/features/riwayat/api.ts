import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

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
    queryFn: async (): Promise<RiwayatRow[]> => {
      let req = supabase
        .from("transaksi")
        .select(
          "id, no_transaksi, tanggal, total, metode_bayar, status, catatan, kasir:kasir_id(nama)",
        )
        .order("tanggal", { ascending: false })
        .limit(500)
      if (dari) req = req.gte("tanggal", dari)
      if (sampai) req = req.lte("tanggal", `${sampai}T23:59:59`)
      const term = q?.trim()
      if (term) req = req.ilike("no_transaksi", `%${term}%`)
      const { data, error } = await req
      if (error) throw error
      return (data as unknown as RiwayatRow[]) ?? []
    },
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
    queryFn: async (): Promise<DetailTransaksiHasil> => {
      const id = transaksiId as string
      const { data: items, error } = await supabase
        .from("detail_transaksi")
        .select("id, qty, harga_jual, subtotal, barang:barang_id(nama, satuan)")
        .eq("transaksi_id", id)
        .order("id")
      if (error) throw error
      const { data: piutang } = await supabase
        .from("piutang")
        .select("nama_pelanggan")
        .eq("transaksi_id", id)
        .maybeSingle()
      return {
        items: (items as unknown as DetailItem[]) ?? [],
        nama_pelanggan:
          (piutang as { nama_pelanggan: string } | null)?.nama_pelanggan ?? null,
      }
    },
  })
}