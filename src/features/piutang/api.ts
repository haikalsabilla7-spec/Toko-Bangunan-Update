import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { PembayaranPiutang, Piutang } from "@/types/database"

export function usePiutangList() {
  return useQuery({
    queryKey: ["piutang", "list"],
    queryFn: async (): Promise<Piutang[]> => {
      const { data, error } = await supabase
        .from("piutang")
        .select("*")
        .order("status", { ascending: true })
        .order("jatuh_tempo", { ascending: true })
      if (error) throw error
      return (data as Piutang[]) ?? []
    },
  })
}

export function usePembayaranPiutang(piutangId: string | null) {
  return useQuery({
    queryKey: ["piutang", "bayar", piutangId],
    enabled: !!piutangId,
    queryFn: async (): Promise<PembayaranPiutang[]> => {
      const { data, error } = await supabase
        .from("pembayaran_piutang")
        .select("*")
        .eq("piutang_id", piutangId!)
        .order("tanggal", { ascending: false })
      if (error) throw error
      return (data as PembayaranPiutang[]) ?? []
    },
  })
}

export function useCatatPembayaranPiutang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { piutang_id: string; nominal: number }) => {
      const { error } = await supabase.from("pembayaran_piutang").insert(input)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["piutang"] }),
  })
}
