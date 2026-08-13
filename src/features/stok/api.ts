import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/features/auth/AuthProvider"

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
    queryFn: async (): Promise<PergerakanStok[]> => {
      const [masuk, sesuai, jual] = await Promise.all([
        supabase
          .from("stok_masuk")
          .select("id, tanggal, qty, supplier, catatan, barang:barang_id(nama)")
          .order("tanggal", { ascending: false })
          .limit(50),
        supabase
          .from("penyesuaian_stok")
          .select("id, tanggal, qty_perubahan, alasan, barang:barang_id(nama)")
          .order("tanggal", { ascending: false })
          .limit(50),
        supabase
          .from("transaksi")
          .select("no_transaksi, tanggal, detail_transaksi(id, qty, barang:barang_id(nama))")
          .order("tanggal", { ascending: false })
          .limit(50),
      ])

      const out: PergerakanStok[] = []
      for (const m of (masuk.data ?? []) as any[]) {
        out.push({
          id: `m-${m.id}`,
          tanggal: m.tanggal,
          barang_nama: m.barang?.nama ?? "-",
          jenis: "masuk",
          qty: Number(m.qty),
          keterangan: m.supplier ? `Dari ${m.supplier}` : m.catatan ?? "Stok masuk",
        })
      }
      for (const s of (sesuai.data ?? []) as any[]) {
        out.push({
          id: `s-${s.id}`,
          tanggal: s.tanggal,
          barang_nama: s.barang?.nama ?? "-",
          jenis: "penyesuaian",
          qty: Number(s.qty_perubahan),
          keterangan: s.alasan,
        })
      }
      for (const t of (jual.data ?? []) as any[]) {
        for (const d of t.detail_transaksi ?? []) {
          out.push({
            id: `j-${d.id}`,
            tanggal: t.tanggal ?? new Date().toISOString(),
            barang_nama: d.barang?.nama ?? "-",
            jenis: "penjualan",
            qty: -Number(d.qty),
            keterangan: t.no_transaksi ?? "Penjualan",
          })
        }
      }
      return out.sort((a, b) => +new Date(b.tanggal) - +new Date(a.tanggal)).slice(0, 60)
    },
  })
}

export function useCatatStokMasuk() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      barang_id: string
      qty: number
      harga_beli: number
      supplier: string | null
      catatan: string | null
    }) => {
      const { error } = await supabase.from("stok_masuk").insert(input)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stok"] })
      qc.invalidateQueries({ queryKey: ["barang"] })
    },
  })
}

export function useCatatPenyesuaian() {
  const qc = useQueryClient()
  const { session } = useAuth()
  return useMutation({
    mutationFn: async (input: { barang_id: string; qty_perubahan: number; alasan: string }) => {
      const { error } = await supabase
        .from("penyesuaian_stok")
        .insert({ ...input, user_id: session?.user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stok"] })
      qc.invalidateQueries({ queryKey: ["barang"] })
    },
  })
}
