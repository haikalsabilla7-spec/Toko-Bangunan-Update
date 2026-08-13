import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { PembayaranUtang, Utang } from "@/types/database"

export function useUtangList() {
  return useQuery({
    queryKey: ["utang", "list"],
    queryFn: async (): Promise<Utang[]> => {
      const { data, error } = await supabase
        .from("utang")
        .select("*")
        .order("status", { ascending: true })
        .order("jatuh_tempo", { ascending: true })
      if (error) throw error
      return (data as Utang[]) ?? []
    },
  })
}

export function useSimpanUtang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { supplier: string; nominal: number; jatuh_tempo: string | null; catatan: string | null }) => {
      const { error } = await supabase.from("utang").insert({
        supplier: input.supplier,
        nominal: input.nominal,
        sisa: input.nominal,
        jatuh_tempo: input.jatuh_tempo,
        catatan: input.catatan,
        status: "belum_lunas",
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
  })
}

export function usePembayaranUtang(utangId: string | null) {
  return useQuery({
    queryKey: ["utang", "bayar", utangId],
    enabled: !!utangId,
    queryFn: async (): Promise<PembayaranUtang[]> => {
      const { data, error } = await supabase
        .from("pembayaran_utang")
        .select("*")
        .eq("utang_id", utangId!)
        .order("tanggal", { ascending: false })
      if (error) throw error
      return (data as PembayaranUtang[]) ?? []
    },
  })
}

export function useCatatPembayaranUtang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { utang_id: string; nominal: number }) => {
      const { error } = await supabase.from("pembayaran_utang").insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["utang"] }),
  })
}
