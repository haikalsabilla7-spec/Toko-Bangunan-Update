import { Router } from "express"
import { z } from "zod"
import { query, tx, num } from "../db"
import { asyncHandler } from "../lib/http"
import { authRequired } from "../middleware/auth"

export const stokRouter = Router()

// Riwayat pergerakan stok gabungan: masuk + penyesuaian + penjualan.
stokRouter.get(
	"/riwayat",
	authRequired,
	asyncHandler(async (_req, res) => {
		const masuk = await query<any>(
			`select m.id, m.tanggal, m.qty, m.supplier, m.catatan, b.nama as b_nama
			 from stok_masuk m left join barang b on b.id = m.barang_id
			 order by m.tanggal desc limit 50`,
		)
		const sesuai = await query<any>(
			`select s.id, s.tanggal, s.qty_perubahan, s.alasan, b.nama as b_nama
			 from penyesuaian_stok s left join barang b on b.id = s.barang_id
			 order by s.tanggal desc limit 50`,
		)
		const jual = await query<any>(
			`select t.no_transaksi, t.tanggal, d.id as d_id, d.qty, b.nama as b_nama
			 from detail_transaksi d
			 join transaksi t on t.id = d.transaksi_id
			 left join barang b on b.id = d.barang_id
			 order by t.tanggal desc limit 100`,
		)

		const out: any[] = []
		for (const m of masuk) {
			out.push({
				id: `m-${m.id}`,
				tanggal: m.tanggal,
				barang_nama: m.b_nama ?? "-",
				jenis: "masuk",
				qty: num(m.qty),
				keterangan: m.supplier ? `Dari ${m.supplier}` : m.catatan ?? "Stok masuk",
			})
		}
		for (const s of sesuai) {
			out.push({
				id: `s-${s.id}`,
				tanggal: s.tanggal,
				barang_nama: s.b_nama ?? "-",
				jenis: "penyesuaian",
				qty: num(s.qty_perubahan),
				keterangan: s.alasan,
			})
		}
		for (const j of jual) {
			out.push({
				id: `j-${j.d_id}`,
				tanggal: j.tanggal ?? new Date().toISOString(),
				barang_nama: j.b_nama ?? "-",
				jenis: "penjualan",
				qty: -num(j.qty),
				keterangan: j.no_transaksi ?? "Penjualan",
			})
		}
		out.sort((a, b) => +new Date(b.tanggal) - +new Date(a.tanggal))
		res.json(out.slice(0, 60))
	}),
)

const masukSchema = z.object({
	barang_id: z.string().uuid(),
	qty: z.number().positive(),
	harga_beli: z.number().nonnegative(),
	supplier: z.string().nullable(),
	catatan: z.string().nullable(),
})

// Catat stok masuk: tambah stok + perbarui harga beli (rata-rata bergerak).
stokRouter.post(
	"/masuk",
	authRequired,
	asyncHandler(async (req, res) => {
		const input = masukSchema.parse(req.body)
		await tx(async (client) => {
			await client.query(
				`insert into stok_masuk (barang_id, qty, harga_beli, supplier, catatan)
				 values ($1,$2,$3,$4,$5)`,
				[input.barang_id, input.qty, input.harga_beli, input.supplier, input.catatan],
			)
			const bRes = await client.query(
				"select stok, harga_beli from barang where id = $1 for update",
				[input.barang_id],
			)
			const b = bRes.rows[0]
			const stokLama = num(b?.stok)
			const hbLama = num(b?.harga_beli)
			const stokBaru = stokLama + input.qty
			// Rata-rata bergerak (moving average) untuk HPP yang akurat.
			const hbBaru =
				stokBaru > 0
					? (stokLama * hbLama + input.qty * input.harga_beli) / stokBaru
					: input.harga_beli
			await client.query("update barang set stok = $1, harga_beli = $2 where id = $3", [
				stokBaru,
				Math.round(hbBaru * 100) / 100,
				input.barang_id,
			])
		})
		res.status(201).json({ ok: true })
	}),
)

const penyesuaianSchema = z.object({
	barang_id: z.string().uuid(),
	qty_perubahan: z.number(),
	alasan: z.string().min(1),
})

// Catat penyesuaian stok (mis. barang rusak/hilang). user_id diambil dari token.
stokRouter.post(
	"/penyesuaian",
	authRequired,
	asyncHandler(async (req, res) => {
		const input = penyesuaianSchema.parse(req.body)
		await tx(async (client) => {
			await client.query(
				`insert into penyesuaian_stok (barang_id, qty_perubahan, alasan, user_id)
				 values ($1,$2,$3,$4)`,
				[input.barang_id, input.qty_perubahan, input.alasan, req.user!.id],
			)
			await client.query("update barang set stok = stok + $1 where id = $2", [
				input.qty_perubahan,
				input.barang_id,
			])
		})
		res.status(201).json({ ok: true })
	}),
)
