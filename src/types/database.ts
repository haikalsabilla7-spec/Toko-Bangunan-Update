// Tipe database dibuat manual agar sesuai skema final (numeric direpresentasikan
// sebagai number di sisi klien). Bisa diganti dengan output `supabase gen types`.

export type Role = "pemilik" | "kasir"
export type MetodeBayar = "tunai" | "utang"
export type StatusTransaksi = "lunas" | "belum_lunas"
export type StatusPiutang = "lunas" | "belum_lunas"
export type StatusUtang = "lunas" | "belum_lunas"

export interface Profil {
  id: string
  nama: string
  role: Role
  created_at: string
}

export interface Kategori {
  id: string
  nama: string
  created_at: string
}

export interface Barang {
  id: string
  kode: string
  nama: string
  kategori_id: string | null
  satuan: string
  harga_beli: number
  harga_jual: number
  stok: number
  barcode: string | null
  created_at: string
}

export interface BarangWithKategori extends Barang {
  kategori: Pick<Kategori, "id" | "nama"> | null
}

export interface Transaksi {
  id: string
  no_transaksi: string
  tanggal: string
  kasir_id: string
  total: number
  metode_bayar: MetodeBayar
  status: StatusTransaksi
  catatan: string | null
}

export interface DetailTransaksi {
  id: string
  transaksi_id: string
  barang_id: string
  qty: number
  harga_jual: number
  harga_beli_saat_jual: number
  subtotal: number
}

export interface StokMasuk {
  id: string
  barang_id: string
  qty: number
  harga_beli: number
  supplier: string | null
  tanggal: string
  catatan: string | null
}

export interface PenyesuaianStok {
  id: string
  barang_id: string
  qty_perubahan: number
  alasan: string
  tanggal: string
  user_id: string
}

export interface Piutang {
  id: string
  transaksi_id: string | null
  nama_pelanggan: string
  nominal: number
  sisa: number
  tanggal: string
  jatuh_tempo: string | null
  status: StatusPiutang
}

export interface PembayaranPiutang {
  id: string
  piutang_id: string
  nominal: number
  tanggal: string
}

export interface Utang {
  id: string
  supplier: string
  nominal: number
  sisa: number
  tanggal: string
  jatuh_tempo: string | null
  status: StatusUtang
  catatan: string | null
}

export interface PembayaranUtang {
  id: string
  utang_id: string
  nominal: number
  tanggal: string
}

// Payload RPC simpan_transaksi (lihat supabase/schema.sql)
export interface ItemTransaksiInput {
  barang_id: string
  qty: number
  harga_jual: number
  harga_beli_saat_jual: number
  subtotal: number
}

export interface SimpanTransaksiInput {
  metode_bayar: MetodeBayar
  catatan?: string | null
  items: ItemTransaksiInput[]
  // hanya untuk metode 'utang'
  nama_pelanggan?: string | null
  jatuh_tempo?: string | null
}

// Definisi untuk supabase-js generic.
// Setiap tabel WAJIB punya key `Relationships` (dibutuhkan supabase-js v2),
// jika tidak, tabel akan terbaca sebagai `never` saat insert/update.
type Table<R, I> = { Row: R; Insert: I; Update: Partial<I>; Relationships: [] }

export interface Database {
  public: {
    Tables: {
      profil: Table<Profil, Partial<Profil>>
      kategori: Table<Kategori, Partial<Kategori>>
      barang: Table<Barang, Partial<Barang>>
      transaksi: Table<Transaksi, Partial<Transaksi>>
      detail_transaksi: Table<DetailTransaksi, Partial<DetailTransaksi>>
      stok_masuk: Table<StokMasuk, Partial<StokMasuk>>
      penyesuaian_stok: Table<PenyesuaianStok, Partial<PenyesuaianStok>>
      piutang: Table<Piutang, Partial<Piutang>>
      pembayaran_piutang: Table<PembayaranPiutang, Partial<PembayaranPiutang>>
      utang: Table<Utang, Partial<Utang>>
      pembayaran_utang: Table<PembayaranUtang, Partial<PembayaranUtang>>
    }
    Views: Record<string, never>
    Functions: {
      simpan_transaksi: { Args: { payload: SimpanTransaksiInput }; Returns: string }
      is_pemilik: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export const BATAS_STOK_MENIPIS = 10
