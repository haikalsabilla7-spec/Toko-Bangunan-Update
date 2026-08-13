# Toko Bangunan — Aplikasi Kasir (POS)

Aplikasi kasir *production-ready* untuk toko material/bangunan. Dibuat untuk
tablet Android + scanner barcode Bluetooth (HID) + printer struk thermal 58mm.

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Data:** TanStack Query (React Query)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Routing:** React Router
- **Barcode:** scanner Bluetooth (auto-focus + Enter) & kamera (`html5-qrcode`), label (`bwip-js`)

---

## 1. Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)

## 2. Setup Supabase

1. Buat project baru di Supabase.
2. Buka **SQL Editor**, jalankan berurutan:
   1. `supabase/schema.sql` — tabel, fungsi `simpan_transaksi`, trigger.
   2. `supabase/rls.sql` — Row Level Security.
   3. `supabase/seed.sql` — kategori & contoh barang material.
3. Buat user lewat **Authentication → Users → Add user** (email + password).
   Trigger `handle_new_user` otomatis membuat baris `profil` (default `kasir`).
4. Jadikan salah satu user sebagai **pemilik**:
   ```sql
   update public.profil set role = 'pemilik' where id = '<uuid-user>';
   ```
5. Ambil kredensial di **Project Settings → API**:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

## 3. Jalankan Lokal

```bash
cp .env.example .env      # lalu isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:5173
```

## 4. Deploy ke Vercel

1. Push repo ke GitHub, lalu **Import Project** di Vercel.
2. Framework terdeteksi otomatis (Vite). Build: `npm run build`, output: `dist`.
3. Tambahkan Environment Variables: `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`.
4. Deploy. `vercel.json` sudah mengatur SPA rewrite.

---

## Peran & Hak Akses

| Fitur | Kasir | Pemilik |
| --- | :---: | :---: |
| Kasir/POS, transaksi | ✅ | ✅ |
| Master barang (tambah/edit) | ✅ | ✅ |
| Hapus barang (data master) | ❌ | ✅ |
| Stok masuk & penyesuaian | ✅ | ✅ |
| Piutang | ✅ | ✅ |
| Utang | ❌ | ✅ |
| Laporan laba/rugi | ❌ | ✅ |

Pembatasan diterapkan di dua lapis: **RLS** di database (`is_pemilik()`) dan
**guard rute** di UI (`RequirePemilik`).

## Alur Kasir Tanpa Mouse

1. Field scan selalu *auto-focus* → scanner Bluetooth langsung mengetik + Enter.
2. Barang masuk keranjang otomatis. Untuk barang non-barcode (besi, paku, pasir),
   ketik nama/kode → Enter untuk memilih.
3. `Bayar` → pilih Tunai/Utang → `Simpan Transaksi` → cetak struk.

Transaksi disimpan lewat RPC atomik `simpan_transaksi` (buat transaksi + detail +
potong stok + piutang dalam satu transaksi DB, dengan validasi stok & `FOR UPDATE`).

## Struktur Folder

```
Toko_Bangunan/
├─ supabase/                # schema.sql, rls.sql, seed.sql
├─ src/
│  ├─ app/router.tsx        # definisi rute + guard peran
│  ├─ lib/                  # supabase, format rupiah, queryClient, cn
│  ├─ types/database.ts     # tipe tabel & payload RPC
│  ├─ hooks/                # useBarcodeScanner (deteksi HID)
│  ├─ components/
│  │  ├─ ui/                # Button, Input, Modal, Card, Badge, Toast, State
│  │  ├─ layout/            # AppLayout, navigasi
│  │  ├─ barcode/           # BarcodeLabel (bwip-js), CameraScanner (html5-qrcode)
│  │  └─ print/             # StrukThermal 58mm
│  └─ features/
│     ├─ auth/              # AuthProvider, guards, LoginPage
│     ├─ dashboard/
│     ├─ kasir/             # KasirPage (inti), keranjang, PembayaranModal
│     ├─ barang/            # tabel, form, import CSV, cetak label
│     ├─ stok/              # stok masuk, opname, riwayat
│     ├─ piutang/  utang/   # daftar + cicilan
│     └─ laporan/           # laba/rugi + stok + export CSV
└─ (vite/tailwind/ts config, vercel.json, .env.example)
```

## Catatan Teknis

- Semua kolom uang `numeric(15,2)` (bukan float). Laba dihitung dari snapshot
  `harga_beli_saat_jual` di `detail_transaksi`.
- Format Rupiah via `Intl.NumberFormat('id-ID')` (`src/lib/format.ts`).
- Ambang stok menipis: `BATAS_STOK_MENIPIS` di `src/types/database.ts`.
- Cetak struk & label memakai `window.print()` + CSS `@media print` (area `.print-area`).
  Untuk printer thermal Bluetooth, gunakan fitur cetak sistem Android.
