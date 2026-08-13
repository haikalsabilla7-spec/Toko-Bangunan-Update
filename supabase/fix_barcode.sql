-- ============================================================
-- Toko_Bangunan — Perbaiki barcode jadi EAN-13 VALID
-- Jalankan di Supabase SQL Editor bila DB sudah pernah di-seed.
-- Aman dijalankan berulang (idempoten).
-- ============================================================

update public.barang set barcode = '8991234500010' where kode = 'SMN-TB40';
update public.barang set barcode = '8991234500027' where kode = 'SMN-GRS40';
update public.barang set barcode = '8991234500034' where kode = 'MRT-SB50';
update public.barang set barcode = '8991234500119' where kode = 'BAUT-DYN';
update public.barang set barcode = '8991234500201' where kode = 'CAT-AVT5';
update public.barang set barcode = '8991234500218' where kode = 'CAT-DLX25';
update public.barang set barcode = '8991234500225' where kode = 'CAT-KAYU';
update public.barang set barcode = '8991234500232' where kode = 'THN-KWS';
update public.barang set barcode = '8991234500300' where kode = 'PVC-KRN';
update public.barang set barcode = '8991234500317' where kode = 'LEM-PVC';
update public.barang set barcode = '8991234500409' where kode = 'GRG-1';
update public.barang set barcode = '8991234500416' where kode = 'METR-5';
