-- Data contoh untuk uji coba. Opsional. Jalankan: npm run seed
-- Catatan: user pemilik/kasir dibuat lewat `npm run buat-user` agar password ter-hash.

insert into kategori (nama) values
  ('Besi'), ('Semen'), ('Cat'), ('Pipa'), ('Alat')
on conflict do nothing;

insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
select 'BSI-B12', 'Besi Beton 12mm', (select id from kategori where nama='Besi'), 'batang', 85000, 98000, 40, null
where not exists (select 1 from barang where kode='BSI-B12');

insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
select 'SMN-50', 'Semen Gresik 50kg', (select id from kategori where nama='Semen'), 'sak', 52000, 58000, 120, '8991234567890'
where not exists (select 1 from barang where kode='SMN-50');

insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
select 'CAT-AVT5', 'Cat Avitex 5kg', (select id from kategori where nama='Cat'), 'kaleng', 78000, 95000, 8, '8992345678901'
where not exists (select 1 from barang where kode='CAT-AVT5');

insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
select 'PVC-4', 'Pipa PVC 4 inch', (select id from kategori where nama='Pipa'), 'batang', 62000, 75000, 25, null
where not exists (select 1 from barang where kode='PVC-4');
