-- ============================================================
-- Toko_Bangunan — Skema Database (PostgreSQL / Supabase)
-- Jalankan di Supabase SQL Editor (urut: schema.sql -> rls.sql -> seed.sql)
-- Semua kolom uang: numeric(15,2). JANGAN float.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- PROFIL (1:1 dengan auth.users) ----------
create table if not exists public.profil (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  role text not null default 'kasir' check (role in ('pemilik','kasir')),
  created_at timestamptz not null default now()
);

-- ---------- KATEGORI ----------
create table if not exists public.kategori (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- BARANG ----------
create table if not exists public.barang (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  nama text not null,
  kategori_id uuid references public.kategori(id) on delete set null,
  satuan text not null default 'pcs',
  harga_beli numeric(15,2) not null default 0,
  harga_jual numeric(15,2) not null default 0,
  stok numeric(15,2) not null default 0,
  barcode text unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_barang_nama on public.barang using gin (to_tsvector('simple', nama));
create index if not exists idx_barang_barcode on public.barang(barcode);
create index if not exists idx_barang_kategori on public.barang(kategori_id);

-- ---------- TRANSAKSI ----------
create table if not exists public.transaksi (
  id uuid primary key default gen_random_uuid(),
  no_transaksi text not null unique,
  tanggal timestamptz not null default now(),
  kasir_id uuid not null references public.profil(id),
  total numeric(15,2) not null default 0,
  metode_bayar text not null check (metode_bayar in ('tunai','utang')),
  status text not null default 'lunas' check (status in ('lunas','belum_lunas')),
  catatan text
);
create index if not exists idx_transaksi_tanggal on public.transaksi(tanggal);

-- ---------- DETAIL TRANSAKSI ----------
create table if not exists public.detail_transaksi (
  id uuid primary key default gen_random_uuid(),
  transaksi_id uuid not null references public.transaksi(id) on delete cascade,
  barang_id uuid not null references public.barang(id),
  qty numeric(15,2) not null,
  harga_jual numeric(15,2) not null,
  harga_beli_saat_jual numeric(15,2) not null, -- snapshot modal utk laba akurat
  subtotal numeric(15,2) not null
);
create index if not exists idx_detail_transaksi on public.detail_transaksi(transaksi_id);

-- ---------- STOK MASUK ----------
create table if not exists public.stok_masuk (
  id uuid primary key default gen_random_uuid(),
  barang_id uuid not null references public.barang(id),
  qty numeric(15,2) not null,
  harga_beli numeric(15,2) not null default 0,
  supplier text,
  tanggal timestamptz not null default now(),
  catatan text
);

-- ---------- PENYESUAIAN STOK ----------
create table if not exists public.penyesuaian_stok (
  id uuid primary key default gen_random_uuid(),
  barang_id uuid not null references public.barang(id),
  qty_perubahan numeric(15,2) not null, -- boleh negatif
  alasan text not null,
  tanggal timestamptz not null default now(),
  user_id uuid not null references public.profil(id)
);

-- ---------- PIUTANG ----------
create table if not exists public.piutang (
  id uuid primary key default gen_random_uuid(),
  transaksi_id uuid references public.transaksi(id) on delete set null,
  nama_pelanggan text not null,
  nominal numeric(15,2) not null,
  sisa numeric(15,2) not null,
  tanggal timestamptz not null default now(),
  jatuh_tempo date,
  status text not null default 'belum_lunas' check (status in ('lunas','belum_lunas'))
);

create table if not exists public.pembayaran_piutang (
  id uuid primary key default gen_random_uuid(),
  piutang_id uuid not null references public.piutang(id) on delete cascade,
  nominal numeric(15,2) not null,
  tanggal timestamptz not null default now()
);

-- ---------- UTANG ----------
create table if not exists public.utang (
  id uuid primary key default gen_random_uuid(),
  supplier text not null,
  nominal numeric(15,2) not null,
  sisa numeric(15,2) not null,
  tanggal timestamptz not null default now(),
  jatuh_tempo date,
  status text not null default 'belum_lunas' check (status in ('lunas','belum_lunas')),
  catatan text
);

create table if not exists public.pembayaran_utang (
  id uuid primary key default gen_random_uuid(),
  utang_id uuid not null references public.utang(id) on delete cascade,
  nominal numeric(15,2) not null,
  tanggal timestamptz not null default now()
);

-- ============================================================
-- FUNGSI BANTU
-- ============================================================

-- Cek apakah user aktif adalah pemilik (dipakai di RLS & UI guard).
create or replace function public.is_pemilik()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profil p
    where p.id = auth.uid() and p.role = 'pemilik'
  );
$$;

-- Auto-buat profil saat user baru mendaftar (default role kasir).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (id, nama, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'kasir')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- RPC: simpan_transaksi — buat transaksi + detail + potong stok + piutang
-- Semua dalam 1 transaksi DB (atomik). Cegah stok minus.
-- ============================================================
create or replace function public.simpan_transaksi(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaksi_id uuid := gen_random_uuid();
  v_no_transaksi text;
  v_total numeric(15,2) := 0;
  v_metode text := payload->>'metode_bayar';
  v_status text := 'lunas';
  v_item jsonb;
  v_barang_id uuid;
  v_qty numeric(15,2);
  v_stok numeric(15,2);
  v_nama text;
  v_seq int;
begin
  if auth.uid() is null then
    raise exception 'Harus login untuk menyimpan transaksi';
  end if;

  if v_metode not in ('tunai','utang') then
    raise exception 'Metode bayar tidak valid: %', v_metode;
  end if;

  -- Nomor transaksi harian berurutan
  select count(*) + 1 into v_seq
  from public.transaksi
  where tanggal::date = now()::date;
  v_no_transaksi := 'TRX-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(v_seq::text, 4, '0');

  if v_metode = 'utang' then
    v_status := 'belum_lunas';
  end if;

  insert into public.transaksi (id, no_transaksi, kasir_id, total, metode_bayar, status, catatan)
  values (v_transaksi_id, v_no_transaksi, auth.uid(), 0, v_metode, v_status, payload->>'catatan');

  -- Loop item keranjang
  for v_item in select * from jsonb_array_elements(payload->'items')
  loop
    v_barang_id := (v_item->>'barang_id')::uuid;
    v_qty := (v_item->>'qty')::numeric;

    -- Kunci baris barang & validasi stok
    select stok, nama into v_stok, v_nama
    from public.barang where id = v_barang_id for update;

    if v_stok is null then
      raise exception 'Barang tidak ditemukan';
    end if;
    if v_stok < v_qty then
      raise exception 'Stok % tidak cukup (tersisa %)', v_nama, v_stok;
    end if;

    insert into public.detail_transaksi
      (transaksi_id, barang_id, qty, harga_jual, harga_beli_saat_jual, subtotal)
    values (
      v_transaksi_id,
      v_barang_id,
      v_qty,
      (v_item->>'harga_jual')::numeric,
      (v_item->>'harga_beli_saat_jual')::numeric,
      (v_item->>'subtotal')::numeric
    );

    update public.barang set stok = stok - v_qty where id = v_barang_id;
    v_total := v_total + (v_item->>'subtotal')::numeric;
  end loop;

  update public.transaksi set total = v_total where id = v_transaksi_id;

  -- Buat piutang jika utang
  if v_metode = 'utang' then
    insert into public.piutang
      (transaksi_id, nama_pelanggan, nominal, sisa, jatuh_tempo, status)
    values (
      v_transaksi_id,
      coalesce(payload->>'nama_pelanggan', 'Pelanggan'),
      v_total,
      v_total,
      nullif(payload->>'jatuh_tempo','')::date,
      'belum_lunas'
    );
  end if;

  return v_transaksi_id;
end;
$$;

-- ============================================================
-- Update status piutang/utang otomatis saat pembayaran dicatat
-- ============================================================
create or replace function public.after_bayar_piutang()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.piutang p
  set sisa = greatest(p.nominal - coalesce((select sum(nominal) from public.pembayaran_piutang where piutang_id = p.id),0), 0),
      status = case when p.nominal - coalesce((select sum(nominal) from public.pembayaran_piutang where piutang_id = p.id),0) <= 0 then 'lunas' else 'belum_lunas' end
  where p.id = new.piutang_id;
  return new;
end; $$;
drop trigger if exists trg_bayar_piutang on public.pembayaran_piutang;
create trigger trg_bayar_piutang after insert on public.pembayaran_piutang
  for each row execute function public.after_bayar_piutang();

create or replace function public.after_bayar_utang()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.utang u
  set sisa = greatest(u.nominal - coalesce((select sum(nominal) from public.pembayaran_utang where utang_id = u.id),0), 0),
      status = case when u.nominal - coalesce((select sum(nominal) from public.pembayaran_utang where utang_id = u.id),0) <= 0 then 'lunas' else 'belum_lunas' end
  where u.id = new.utang_id;
  return new;
end; $$;
drop trigger if exists trg_bayar_utang on public.pembayaran_utang;
create trigger trg_bayar_utang after insert on public.pembayaran_utang
  for each row execute function public.after_bayar_utang();

-- Tambah stok otomatis saat catat stok_masuk
create or replace function public.after_stok_masuk()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.barang set stok = stok + new.qty where id = new.barang_id;
  return new;
end; $$;
drop trigger if exists trg_stok_masuk on public.stok_masuk;
create trigger trg_stok_masuk after insert on public.stok_masuk
  for each row execute function public.after_stok_masuk();

-- Terapkan penyesuaian stok otomatis
create or replace function public.after_penyesuaian_stok()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.barang set stok = stok + new.qty_perubahan where id = new.barang_id;
  return new;
end; $$;
drop trigger if exists trg_penyesuaian on public.penyesuaian_stok;
create trigger trg_penyesuaian after insert on public.penyesuaian_stok
  for each row execute function public.after_penyesuaian_stok();
