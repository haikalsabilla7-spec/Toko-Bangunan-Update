-- ============================================================
-- Toko Bangunan - Skema Database (PostgreSQL, mandiri tanpa Supabase)
-- Jalankan: npm run migrate  (atau eksekusi file ini di psql)
-- ============================================================

create extension if not exists pgcrypto;   -- untuk gen_random_uuid()

-- Pengguna aplikasi (ganti peran Supabase Auth). Password disimpan sebagai hash bcrypt.
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  nama          text not null,
  role          text not null default 'kasir' check (role in ('pemilik','kasir')),
  created_at    timestamptz not null default now()
);

create table if not exists kategori (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  created_at timestamptz not null default now()
);

create table if not exists barang (
  id          uuid primary key default gen_random_uuid(),
  kode        text unique not null,
  nama        text not null,
  kategori_id uuid references kategori(id) on delete set null,
  satuan      text not null default 'pcs',
  harga_beli  numeric(15,2) not null default 0,
  harga_jual  numeric(15,2) not null default 0,
  stok        numeric(15,2) not null default 0,
  barcode     text unique,
  created_at  timestamptz not null default now()
);

create table if not exists transaksi (
  id           uuid primary key default gen_random_uuid(),
  no_transaksi text unique not null,
  tanggal      timestamptz not null default now(),
  kasir_id     uuid references users(id),
  total        numeric(15,2) not null default 0,
  metode_bayar text not null check (metode_bayar in ('tunai','utang')),
  status       text not null default 'lunas' check (status in ('lunas','belum_lunas')),
  catatan      text
);

create table if not exists detail_transaksi (
  id                   uuid primary key default gen_random_uuid(),
  transaksi_id         uuid not null references transaksi(id) on delete cascade,
  barang_id            uuid not null references barang(id),
  qty                  numeric(15,2) not null,
  harga_jual           numeric(15,2) not null,
  harga_beli_saat_jual numeric(15,2) not null default 0,
  subtotal             numeric(15,2) not null
);

create table if not exists stok_masuk (
  id         uuid primary key default gen_random_uuid(),
  barang_id  uuid not null references barang(id),
  qty        numeric(15,2) not null,
  harga_beli numeric(15,2) not null default 0,
  supplier   text,
  tanggal    timestamptz not null default now(),
  catatan    text
);

create table if not exists penyesuaian_stok (
  id            uuid primary key default gen_random_uuid(),
  barang_id     uuid not null references barang(id),
  qty_perubahan numeric(15,2) not null,
  alasan        text not null,
  tanggal       timestamptz not null default now(),
  user_id       uuid references users(id)
);

create table if not exists piutang (
  id             uuid primary key default gen_random_uuid(),
  transaksi_id   uuid references transaksi(id) on delete set null,
  nama_pelanggan text not null default 'Pelanggan',
  nominal        numeric(15,2) not null,
  sisa           numeric(15,2) not null,
  tanggal        timestamptz not null default now(),
  jatuh_tempo    date,
  status         text not null default 'belum_lunas' check (status in ('lunas','belum_lunas'))
);

create table if not exists pembayaran_piutang (
  id         uuid primary key default gen_random_uuid(),
  piutang_id uuid not null references piutang(id) on delete cascade,
  nominal    numeric(15,2) not null,
  tanggal    timestamptz not null default now()
);

create table if not exists utang (
  id          uuid primary key default gen_random_uuid(),
  supplier    text not null,
  nominal     numeric(15,2) not null,
  sisa        numeric(15,2) not null,
  tanggal     timestamptz not null default now(),
  jatuh_tempo date,
  status      text not null default 'belum_lunas' check (status in ('lunas','belum_lunas')),
  catatan     text
);

create table if not exists pembayaran_utang (
  id       uuid primary key default gen_random_uuid(),
  utang_id uuid not null references utang(id) on delete cascade,
  nominal  numeric(15,2) not null,
  tanggal  timestamptz not null default now()
);

-- Index untuk mempercepat query yang sering dipakai
create index if not exists idx_transaksi_tanggal on transaksi(tanggal);
create index if not exists idx_detail_transaksi on detail_transaksi(transaksi_id);
create index if not exists idx_barang_kategori on barang(kategori_id);
create index if not exists idx_piutang_status on piutang(status);
create index if not exists idx_utang_status on utang(status);
