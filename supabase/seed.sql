-- ============================================================
-- Toko_Bangunan — Seed data contoh barang material nyata
-- Jalankan SETELAH schema.sql & rls.sql.
-- Barcode EAN-13 VALID (check digit benar) agar terbaca scanner.
-- Catatan: buat dulu user via Auth, lalu set role pemilik:
--   update public.profil set role = 'pemilik' where id = '<uuid-user>';
-- ============================================================

insert into public.kategori (nama) values
  ('Semen & Perekat'),
  ('Besi & Baja'),
  ('Paku & Baut'),
  ('Cat & Finishing'),
  ('Pipa & Sanitasi'),
  ('Kayu & Triplek'),
  ('Alat & Perkakas')
on conflict (nama) do nothing;

-- Barang (barcode EAN-13 valid utk barang kemasan, null utk curah)
insert into public.barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
values
  ('SMN-TB40', 'Semen Tiga Roda 40kg', (select id from kategori where nama='Semen & Perekat'), 'sak', 58000, 65000, 120, '8991234500010'),
  ('SMN-GRS40', 'Semen Gresik 40kg', (select id from kategori where nama='Semen & Perekat'), 'sak', 57000, 64000, 80, '8991234500027'),
  ('MRT-SB50', 'Mortar Perekat Bata 50kg', (select id from kategori where nama='Semen & Perekat'), 'sak', 42000, 52000, 35, '8991234500034'),
  ('BSI-B8', 'Besi Beton Polos 8mm', (select id from kategori where nama='Besi & Baja'), 'batang', 42000, 52000, 240, null),
  ('BSI-B10', 'Besi Beton Ulir 10mm', (select id from kategori where nama='Besi & Baja'), 'batang', 68000, 82000, 180, null),
  ('BSI-B12', 'Besi Beton Ulir 12mm', (select id from kategori where nama='Besi & Baja'), 'batang', 96000, 115000, 95, null),
  ('BSI-HOL', 'Besi Hollow 4x4 Galvanis', (select id from kategori where nama='Besi & Baja'), 'batang', 78000, 94000, 60, null),
  ('PKU-5', 'Paku Beton 5cm', (select id from kategori where nama='Paku & Baut'), 'kg', 18000, 24000, 150, null),
  ('PKU-7', 'Paku Kayu 7cm', (select id from kategori where nama='Paku & Baut'), 'kg', 16000, 22000, 130, null),
  ('BAUT-DYN', 'Dynabolt 10mm', (select id from kategori where nama='Paku & Baut'), 'pcs', 4500, 7000, 400, '8991234500119'),
  ('CAT-AVT5', 'Cat Tembok Avitex 5kg', (select id from kategori where nama='Cat & Finishing'), 'galon', 62000, 78000, 45, '8991234500201'),
  ('CAT-DLX25', 'Cat Dulux Weathershield 2.5L', (select id from kategori where nama='Cat & Finishing'), 'kaleng', 185000, 225000, 22, '8991234500218'),
  ('CAT-KAYU', 'Cat Kayu Besi Emco 1kg', (select id from kategori where nama='Cat & Finishing'), 'kaleng', 48000, 62000, 30, '8991234500225'),
  ('THN-KWS', 'Thinner A Special 1L', (select id from kategori where nama='Cat & Finishing'), 'botol', 22000, 30000, 40, '8991234500232'),
  ('PVC-3', 'Pipa PVC AW 3" Wavin', (select id from kategori where nama='Pipa & Sanitasi'), 'batang', 78000, 96000, 55, null),
  ('PVC-4', 'Pipa PVC AW 4" Wavin', (select id from kategori where nama='Pipa & Sanitasi'), 'batang', 110000, 135000, 38, null),
  ('PVC-KRN', 'Keran Air Onda 1/2"', (select id from kategori where nama='Pipa & Sanitasi'), 'pcs', 28000, 42000, 70, '8991234500300'),
  ('LEM-PVC', 'Lem Pipa PVC Isarplas 100gr', (select id from kategori where nama='Pipa & Sanitasi'), 'kaleng', 12000, 18000, 90, '8991234500317'),
  ('TRP-9', 'Triplek 9mm 122x244', (select id from kategori where nama='Kayu & Triplek'), 'lembar', 120000, 148000, 42, null),
  ('TRP-12', 'Triplek 12mm 122x244', (select id from kategori where nama='Kayu & Triplek'), 'lembar', 155000, 188000, 28, null),
  ('KYU-RENG', 'Kayu Reng 3x4 Meranti', (select id from kategori where nama='Kayu & Triplek'), 'batang', 22000, 30000, 200, null),
  ('GRG-1', 'Gergaji Kayu 12"', (select id from kategori where nama='Alat & Perkakas'), 'pcs', 38000, 55000, 25, '8991234500409'),
  ('METR-5', 'Meteran 5m Tekiro', (select id from kategori where nama='Alat & Perkakas'), 'pcs', 32000, 48000, 33, '8991234500416'),
  ('AMPLAS', 'Amplas Lembar Grit 120', (select id from kategori where nama='Alat & Perkakas'), 'lembar', 3000, 5000, 300, null)
on conflict (kode) do nothing;
