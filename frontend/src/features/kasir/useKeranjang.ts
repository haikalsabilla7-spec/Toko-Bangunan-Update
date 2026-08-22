import { useCallback, useMemo, useState } from "react"
import type { Barang } from "@/types/database"

export interface ItemKeranjang {
  barang_id: string
  kode: string
  nama: string
  satuan: string
  qty: number
  harga_jual: number // bisa di-override manual
  harga_jual_asli: number
  harga_beli_saat_jual: number // snapshot modal
  stok_tersedia: number
}

export function useKeranjang() {
  const [items, setItems] = useState<ItemKeranjang[]>([])

  const tambah = useCallback((b: Barang, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.barang_id === b.id)
      if (idx >= 0) {
        const next = [...prev]
        const cur = next[idx]!
        next[idx] = { ...cur, qty: Math.min(cur.qty + qty, b.stok) }
        return next
      }
      return [
        ...prev,
        {
          barang_id: b.id,
          kode: b.kode,
          nama: b.nama,
          satuan: b.satuan,
          qty: Math.min(qty, b.stok || qty),
          harga_jual: b.harga_jual,
          harga_jual_asli: b.harga_jual,
          harga_beli_saat_jual: b.harga_beli,
          stok_tersedia: b.stok,
        },
      ]
    })
  }, [])

  const ubahQty = useCallback((barang_id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.barang_id === barang_id ? { ...i, qty: Math.max(qty, 0) } : i)),
    )
  }, [])

  const overrideHarga = useCallback((barang_id: string, harga: number) => {
    setItems((prev) =>
      prev.map((i) => (i.barang_id === barang_id ? { ...i, harga_jual: Math.max(harga, 0) } : i)),
    )
  }, [])

  const hapus = useCallback((barang_id: string) => {
    setItems((prev) => prev.filter((i) => i.barang_id !== barang_id))
  }, [])

  const kosongkan = useCallback(() => setItems([]), [])

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.harga_jual, 0),
    [items],
  )
  const jumlahItem = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items])

  return { items, tambah, ubahQty, overrideHarga, hapus, kosongkan, total, jumlahItem }
}
