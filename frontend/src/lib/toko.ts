/**
 * Identitas toko untuk struk & label.
 * Ubah nilai di sini untuk tiap client, ATAU isi lewat .env agar 1 build
 * bisa dipakai banyak toko:
 *   VITE_TOKO_NAMA, VITE_TOKO_ALAMAT, VITE_TOKO_TELP, VITE_TOKO_FOOTER
 */
export const TOKO = {
  nama: import.meta.env.VITE_TOKO_NAMA ?? "TOKO BANGUNAN",
  alamat: import.meta.env.VITE_TOKO_ALAMAT ?? "Jl. Material Jaya No. 12",
  telp: import.meta.env.VITE_TOKO_TELP ?? "0800-000-000",
  // Catatan kaki struk (boleh multi-baris dipisah "|")
  footer:
    import.meta.env.VITE_TOKO_FOOTER ??
    "Terima kasih telah berbelanja|Barang dapat ditukar maks. 1x24 jam|dengan struk asli",
} as const
