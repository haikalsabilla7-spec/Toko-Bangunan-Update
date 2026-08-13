-- ============================================================
-- Toko_Bangunan — Row Level Security
-- Aturan:
--  * Semua user login boleh baca/tulis data operasional.
--  * Hanya role 'pemilik' boleh: hapus data master (barang/kategori)
--    dan (di sisi UI) melihat laporan laba. Data laporan dihitung dari
--    tabel operasional yang boleh dibaca semua user login; guard laba
--    dilakukan di aplikasi + kolom modal hanya relevan bagi pemilik.
-- ============================================================

alter table public.profil enable row level security;
alter table public.kategori enable row level security;
alter table public.barang enable row level security;
alter table public.transaksi enable row level security;
alter table public.detail_transaksi enable row level security;
alter table public.stok_masuk enable row level security;
alter table public.penyesuaian_stok enable row level security;
alter table public.piutang enable row level security;
alter table public.pembayaran_piutang enable row level security;
alter table public.utang enable row level security;
alter table public.pembayaran_utang enable row level security;

-- Helper: user login?
-- (auth.uid() is not null)

-- ---------- PROFIL ----------
drop policy if exists profil_select on public.profil;
create policy profil_select on public.profil
  for select using (auth.uid() is not null);

drop policy if exists profil_update_self on public.profil;
create policy profil_update_self on public.profil
  for update using (id = auth.uid() or public.is_pemilik());

drop policy if exists profil_admin_write on public.profil;
create policy profil_admin_write on public.profil
  for all using (public.is_pemilik()) with check (public.is_pemilik());

-- ---------- KATEGORI ----------
drop policy if exists kategori_read on public.kategori;
create policy kategori_read on public.kategori
  for select using (auth.uid() is not null);

drop policy if exists kategori_write on public.kategori;
create policy kategori_write on public.kategori
  for insert with check (auth.uid() is not null);

drop policy if exists kategori_update on public.kategori;
create policy kategori_update on public.kategori
  for update using (auth.uid() is not null);

-- Hapus master hanya pemilik
drop policy if exists kategori_delete on public.kategori;
create policy kategori_delete on public.kategori
  for delete using (public.is_pemilik());

-- ---------- BARANG ----------
drop policy if exists barang_read on public.barang;
create policy barang_read on public.barang
  for select using (auth.uid() is not null);

drop policy if exists barang_insert on public.barang;
create policy barang_insert on public.barang
  for insert with check (auth.uid() is not null);

drop policy if exists barang_update on public.barang;
create policy barang_update on public.barang
  for update using (auth.uid() is not null);

-- Hapus barang (data master) hanya pemilik
drop policy if exists barang_delete on public.barang;
create policy barang_delete on public.barang
  for delete using (public.is_pemilik());

-- ---------- TRANSAKSI & DETAIL (operasional: semua user login) ----------
drop policy if exists transaksi_rw on public.transaksi;
create policy transaksi_rw on public.transaksi
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists detail_rw on public.detail_transaksi;
create policy detail_rw on public.detail_transaksi
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- STOK ----------
drop policy if exists stok_masuk_rw on public.stok_masuk;
create policy stok_masuk_rw on public.stok_masuk
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists penyesuaian_rw on public.penyesuaian_stok;
create policy penyesuaian_rw on public.penyesuaian_stok
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- PIUTANG / UTANG ----------
drop policy if exists piutang_rw on public.piutang;
create policy piutang_rw on public.piutang
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists bayar_piutang_rw on public.pembayaran_piutang;
create policy bayar_piutang_rw on public.pembayaran_piutang
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Utang & pembayaran utang = pengeluaran/laporan -> hanya pemilik
drop policy if exists utang_rw on public.utang;
create policy utang_rw on public.utang
  for all using (public.is_pemilik()) with check (public.is_pemilik());

drop policy if exists bayar_utang_rw on public.pembayaran_utang;
create policy bayar_utang_rw on public.pembayaran_utang
  for all using (public.is_pemilik()) with check (public.is_pemilik());
