import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Barang, BarangWithKategori, Kategori } from "@/types/database"

export const barangKeys = {
  all: ["barang"] as const,
  list: (filter?: string) => ["barang", "list", filter ?? ""] as const,
}

export function useKategori() {
  return useQuery({
    queryKey: ["kategori"],
    queryFn: async (): Promise<Kategori[]> => {
      const { data, error } = await supabase.from("kategori").select("*").order("nama")
      if (error) throw error
      return data ?? []
    },
  })
}

export function useBarangList() {
  return useQuery({
    queryKey: barangKeys.list(),
    queryFn: async (): Promise<BarangWithKategori[]> => {
      const { data, error } = await supabase
        .from("barang")
        .select("*, kategori:kategori_id(id, nama)")
        .order("nama")
      if (error) throw error
      return (data as unknown as BarangWithKategori[]) ?? []
    },
  })
}

/** Cari 1 barang berdasarkan barcode ATAU kode (untuk scan di kasir). */
export async function cariBarangByKode(kode: string): Promise<Barang | null> {
  // Cari via barcode dulu, lalu kode. Pakai .eq (aman) supaya kode berisi
  // koma/spasi/karakter khusus tidak merusak query seperti pada .or().
  const byBarcode = await supabase
    .from("barang")
    .select("*")
    .eq("barcode", kode)
    .limit(1)
    .maybeSingle()
  if (byBarcode.error) throw byBarcode.error
  if (byBarcode.data) return byBarcode.data

  const byKode = await supabase
    .from("barang")
    .select("*")
    .eq("kode", kode)
    .limit(1)
    .maybeSingle()
  if (byKode.error) throw byKode.error
  return byKode.data
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
      if (id) {
        const { error } = await supabase.from("barang").update(input).eq("id", id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("barang").insert(input)
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
  })
}

export function useHapusBarang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barang").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
  })
}

/** Import massal dari CSV (array baris tervalidasi). */
export function useImportBarang() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (rows: BarangInput[]) => {
      const { error } = await supabase.from("barang").upsert(rows, { onConflict: "kode" })
      if (error) throw error
      return rows.length
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: barangKeys.all }),
  })
}
