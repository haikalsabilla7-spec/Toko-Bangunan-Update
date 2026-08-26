import { Router } from "express"
import { z } from "zod"
import { query, num } from "../db"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

export const barangRouter = Router()

interface BarangRow {
	id: string
	kode: string
	nama: string
	kategori_id: string | null
	satuan: string
	harga_beli: string
	harga_jual: string
	stok: string
	barcode: string | null
	created_at: string
	k_id: string | null
	k_nama: string | null
}

function mapBarang(b: BarangRow) {
	return {
		id: b.id,
		kode: b.kode,
		nama: b.nama,
		kategori_id: b.kategori_id,
		satuan: b.satuan,
		harga_beli: num(b.harga_beli),
		harga_jual: num(b.harga_jual),
		stok: num(b.stok),
		barcode: b.barcode,
		created_at: b.created_at,
		kategori: b.k_id ? { id: b.k_id, nama: b.k_nama } : null,
	}
}

	const SELECT_BARANG = `
		select b.id, b.kode, b.nama, b.kategori_id, b.satuan, b.harga_beli,
			b.harga_jual, b.stok, b.barcode, b.created_at,
			k.id as k_id, k.nama as k_nama
		from barang b
		left join kategori k on k.id = b.kategori_id`

// Daftar semua barang (+ kategori). Bisa dibaca semua user login.
barangRouter.get(
	"/",
	authRequired,
	asyncHandler(async (_req, res) => {
		const rows = await query<BarangRow>(`${SELECT_BARANG} order by b.nama`)
		res.json(rows.map(mapBarang))
	}),
)

// Cari 1 barang berdasarkan barcode ATAU kode (untuk scan di kasir).
barangRouter.get(
	"/cari",
	authRequired,
	asyncHandler(async (req, res) => {
		const kode = String(req.query.kode ?? "").trim()
		if (!kode) return res.json(null)
		let rows = await query<BarangRow>(
			`${SELECT_BARANG} where b.barcode = $1 limit 1`,
			[kode],
		)
		if (rows.length === 0) {
			rows = await query<BarangRow>(`${SELECT_BARANG} where b.kode = $1 limit 1`, [kode])
		}
		res.json(rows[0] ? mapBarang(rows[0]) : null)
	}),
)

const barangSchema = z.object({
	kode: z.string().min(1),
	nama: z.string().min(1),
	kategori_id: z.string().uuid().nullable(),
	satuan: z.string().min(1),
	harga_beli: z.number().nonnegative(),
	harga_jual: z.number().nonnegative(),
	stok: z.number(),
	barcode: z.string().nullable(),
})

// Tambah barang (pemilik).
barangRouter.post(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const b = barangSchema.parse(req.body)
		const rows = await query<{ id: string }>(
			`insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
			 values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
			[b.kode, b.nama, b.kategori_id, b.satuan, b.harga_beli, b.harga_jual, b.stok, b.barcode],
		)
		res.status(201).json({ id: rows[0]!.id })
	}),
)

// Ubah barang (pemilik).
barangRouter.put(
	"/:id",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const b = barangSchema.parse(req.body)
		const rows = await query<{ id: string }>(
			`update barang set kode=$1, nama=$2, kategori_id=$3, satuan=$4,
			 harga_beli=$5, harga_jual=$6, stok=$7, barcode=$8 where id=$9 returning id`,
			[b.kode, b.nama, b.kategori_id, b.satuan, b.harga_beli, b.harga_jual, b.stok, b.barcode, req.params.id],
		)
		if (rows.length === 0) throw new ApiError(404, "Barang tidak ditemukan")
		res.json({ id: rows[0]!.id })
	}),
)

// Hapus SEMUA barang (pemilik). Hati-hati: tidak bisa dibatalkan.
barangRouter.delete(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		try {
			const rows = await query<{ id: string }>(
				"delete from barang returning id",
			)
			res.json({ ok: true, deleted: rows.length })
		} catch (err) {
			// 23503 = foreign_key_violation (barang masih dipakai di transaksi/stok)
			if ((err as { code?: string }).code === "23503") {
				throw new ApiError(
					409,
					"Tidak bisa menghapus semua barang karena sebagian masih terpakai di transaksi atau riwayat stok.",
				)
			}
			throw err
		}
	}),
)

// Hapus barang (pemilik).
barangRouter.delete(
	"/:id",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		await query("delete from barang where id = $1", [req.params.id])
		res.json({ ok: true })
	}),
)

// Import massal dari CSV (upsert berdasarkan kode) - pemilik.
const importSchema = z.object({ rows: z.array(barangSchema) })
barangRouter.post(
	"/import",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const { rows } = importSchema.parse(req.body)
		for (const b of rows) {
			await query(
				`insert into barang (kode, nama, kategori_id, satuan, harga_beli, harga_jual, stok, barcode)
				 values ($1,$2,$3,$4,$5,$6,$7,$8)
				 on conflict (kode) do update set
				   nama=excluded.nama, kategori_id=excluded.kategori_id, satuan=excluded.satuan,
				   harga_beli=excluded.harga_beli, harga_jual=excluded.harga_jual,
				   stok=excluded.stok, barcode=excluded.barcode`,
				[b.kode, b.nama, b.kategori_id, b.satuan, b.harga_beli, b.harga_jual, b.stok, b.barcode],
			)
		}
		res.json({ count: rows.length })
	}),
)
