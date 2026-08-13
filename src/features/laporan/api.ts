import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface Periode {
  dari: string // ISO
  sampai: string // ISO
}

export interface LaporanRingkas {
  pemasukan: number // total penjualan
  hpp: number // harga pokok penjualan (modal terjual)
  laba: number // pemasukan - hpp
  pengeluaranUtang: number // pembayaran utang pada periode
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

export function useLaporan(periode: Periode) {
  return useQuery({
    queryKey: ["laporan", periode.dari, periode.sampai],
    queryFn: async (): Promise<{ ringkas: LaporanRingkas; perBarang: BarisLabaBarang[] }> => {
      // Ambil transaksi + detail pada periode
      const { data: trx, error: e1 } = await supabase
        .from("transaksi")
        .select("id, total, tanggal, detail_transaksi(barang_id, qty, harga_jual, harga_beli_saat_jual, subtotal, barang:barang_id(nama))")
        .gte("tanggal", periode.dari)
        .lte("tanggal", periode.sampai)
      if (e1) throw e1

      const { data: bayarUtang, error: e2 } = await supabase
        .from("pembayaran_utang")
        .select("nominal, tanggal")
        .gte("tanggal", periode.dari)
        .lte("tanggal", periode.sampai)
      if (e2) throw e2

      let pemasukan = 0
      let hpp = 0
      const map = new Map<string, BarisLabaBarang>()

      for (const t of (trx ?? []) as any[]) {
        pemasukan += Number(t.total)
        for (const d of t.detail_transaksi ?? []) {
          const qty = Number(d.qty)
          const omzet = Number(d.subtotal)
          const modal = Number(d.harga_beli_saat_jual) * qty
          hpp += modal
          const key = d.barang_id
          const prev = map.get(key) ?? {
            barang_id: key,
            nama: d.barang?.nama ?? "-",
            qty: 0,
            omzet: 0,
            modal: 0,
            laba: 0,
          }
          prev.qty += qty
          prev.omzet += omzet
          prev.modal += modal
          prev.laba += omzet - modal
          map.set(key, prev)
        }
      }

      const pengeluaranUtang = (bayarUtang ?? []).reduce((s, r) => s + Number(r.nominal), 0)

      return {
        ringkas: {
          pemasukan,
          hpp,
          laba: pemasukan - hpp,
          pengeluaranUtang,
          jumlahTransaksi: trx?.length ?? 0,
        },
        perBarang: [...map.values()].sort((a, b) => b.laba - a.laba),
      }
    },
  })
}

export function useLaporanStok() {
  return useQuery({
    queryKey: ["laporan", "stok"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barang")
        .select("id, kode, nama, stok, satuan, harga_beli, harga_jual")
        .order("nama")
      if (error) throw error
      return (data ?? []).map((b: any) => ({
        ...b,
        nilai_modal: Number(b.stok) * Number(b.harga_beli),
        nilai_jual: Number(b.stok) * Number(b.harga_jual),
      }))
    },
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
