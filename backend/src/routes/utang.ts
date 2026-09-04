import { Router } from "express"
import { z } from "zod"
import { query, tx, num } from "../db"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

// Utang ke supplier = urusan keuangan pemilik.
export const utangRouter = Router()

function mapUtang(u: any) {
	return { ...u, nominal: num(u.nominal), sisa: num(u.sisa) }
}

utangRouter.get(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		const rows = await query<any>(
			`select id, supplier, nominal, sisa, tanggal, jatuh_tempo, status, catatan
			 from utang order by status asc, jatuh_tempo asc nulls last`,
		)
		res.json(rows.map(mapUtang))
	}),
)

const utangSchema = z.object({
	supplier: z.string().min(1),
	nominal: z.number().positive(),
	jatuh_tempo: z.string().nullable(),
	catatan: z.string().nullable(),
})

utangRouter.post(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const u = utangSchema.parse(req.body)
		await query(
			`insert into utang (supplier, nominal, sisa, jatuh_tempo, catatan, status)
			 values ($1,$2,$2,$3,$4,'belum_lunas')`,
			[u.supplier, u.nominal, u.jatuh_tempo, u.catatan],
		)
		res.status(201).json({ ok: true })
	}),
)

utangRouter.get(
	"/:id/pembayaran",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const rows = await query<any>(
			"select id, utang_id, nominal, tanggal from pembayaran_utang where utang_id = $1 order by tanggal desc",
			[req.params.id],
		)
		res.json(rows.map((r) => ({ ...r, nominal: num(r.nominal) })))
	}),
)

const bayarSchema = z.object({ nominal: z.number().positive() })

utangRouter.post(
	"/:id/bayar",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const { nominal } = bayarSchema.parse(req.body)
		const id = req.params.id
		await tx(async (client) => {
			const uRes = await client.query("select sisa from utang where id = $1 for update", [id])
			const u = uRes.rows[0]
			if (!u) throw new ApiError(404, "Utang tidak ditemukan")
			const sisaLama = num(u.sisa)
			if (nominal > sisaLama) throw new ApiError(400, "Nominal melebihi sisa utang")
			await client.query("insert into pembayaran_utang (utang_id, nominal) values ($1,$2)", [
				id,
				nominal,
			])
			const sisaBaru = Math.round((sisaLama - nominal) * 100) / 100
			await client.query("update utang set sisa = $1, status = $2 where id = $3", [
				sisaBaru,
				sisaBaru <= 0 ? "lunas" : "belum_lunas",
				id,
			])
		})
		res.status(201).json({ ok: true })
	}),
)

// Hapus SEMUA utang (pembayaran_utang ikut via cascade). Khusus pemilik.
utangRouter.delete(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		const c = await query<{ c: number }>("select count(*)::int as c from utang")
		await query("delete from utang")
		res.json({ ok: true, dihapus: c[0].c })
	}),
)

// Hapus SATU utang. Khusus pemilik.
utangRouter.delete(
	"/:id",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const r = await query<{ id: string }>("delete from utang where id = $1 returning id", [
			req.params.id,
		])
		if (!r.length) throw new ApiError(404, "Utang tidak ditemukan")
		res.json({ ok: true })
	}),
)