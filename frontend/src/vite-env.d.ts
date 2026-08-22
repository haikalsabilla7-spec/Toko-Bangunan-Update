/// <reference types="vite/client" />

interface ImportMetaEnv {
	// Alamat back-end API (server temanmu). Contoh: https://api.tokoku.com
	readonly VITE_API_URL: string
	// Identitas toko untuk struk (opsional, lihat src/lib/toko.ts)
	readonly VITE_TOKO_NAMA?: string
	readonly VITE_TOKO_ALAMAT?: string
	readonly VITE_TOKO_TELP?: string
	readonly VITE_TOKO_FOOTER?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
