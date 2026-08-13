import { useMutation, useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { queryClient } from "@/lib/queryClient"
import type { SimpanTransaksiInput } from "@/types/database"

export interface HasilTransaksi {
  id: string
  no_transaksi: string
  tanggal: string
}

/** Simpan transaksi via RPC atomik `simpan_transaksi`. */
export function useSimpanTransaksi() {
  return useMutation({
    mutationFn: async (payload: SimpanTransaksiInput): Promise<HasilTransaksi> => {
      const { data, error } = await supabase.rpc("simpan_transaksi", {
        payload: payload as unknown as Record<string, unknown>,
      })
      if (error) throw new Error(error.message)
      const id = data as unknown as string
      const { data: trx, error: e2 } = await supabase
        .from("transaksi")
        .select("id, no_transaksi, tanggal")
        .eq("id", id)
        .single()
      if (e2) throw e2
      return trx as HasilTransaksi
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["barang"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["piutang"] })
    },
  })
}

/** ID barang paling laris dari ~200 transaksi terbaru (untuk grid tombol cepat). */
export function useBarangLaris(topN = 8) {
  return useQuery({
    queryKey: ["kasir", "laris", topN],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("transaksi")
        .select("detail_transaksi(barang_id, qty)")
        .order("tanggal", { ascending: false })
        .limit(200)
      if (error) throw error
      const tally = new Map<string, number>()
      for (const t of (data ?? []) as any[]) {
        for (const d of t.detail_transaksi ?? []) {
          tally.set(d.barang_id, (tally.get(d.barang_id) ?? 0) + Number(d.qty))
        }
      }
      return [...tally.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([id]) => id)
    },
  })
}
