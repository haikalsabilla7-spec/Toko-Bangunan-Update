import { Router } from "express"
import { z } from "zod"
import { query, tx, num } from "../db"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

export const piutangRouter = Router()

function mapPiutang(p: any) {
	return { ...p, nominal: num(p.nominal), sisa: num(p.sisa) }
}

piutangRouter.get(
	"/",
	authRequired,
	asyncHandler(async (_req, res) => {
		const rows = await query<any>(
				`select p.id, p.transaksi_id, p.nama_pelanggan, p.nominal, p.sisa, p.tanggal,
						p.jatuh_tempo, p.status, t.no_transaksi, t.catatan
				from piutang p
				left join transaksi t on t.id = p.transaksi_id
				order by p.status asc, p.jatuh_tempo asc nulls last`,
			)
		res.json(rows.map(mapPiutang))
	}),
)

piutangRouter.get(
	"/:id/pembayaran",
	authRequired,
	asyncHandler(async (req, res) => {
		const rows = await query<any>(
			"select id, piutang_id, nominal, tanggal from pembayaran_piutang where piutang_id = $1 order by tanggal desc",
			[req.params.id],
		)
		res.json(rows.map((r) => ({ ...r, nominal: num(r.nominal) })))
	}),
)

const bayarSchema = z.object({ nominal: z.number().positive() })

piutangRouter.post(
	"/:id/bayar",
	authRequired,
	asyncHandler(async (req, res) => {
		const { nominal } = bayarSchema.parse(req.body)
		const id = req.params.id
		await tx(async (client) => {
			const pRes = await client.query("select sisa from piutang where id = $1 for update", [id])
			const p = pRes.rows[0]
			if (!p) throw new ApiError(404, "Piutang tidak ditemukan")
			const sisaLama = num(p.sisa)
			if (nominal > sisaLama) throw new ApiError(400, "Nominal melebihi sisa piutang")
			await client.query(
				"insert into pembayaran_piutang (piutang_id, nominal) values ($1,$2)",
				[id, nominal],
			)
			const sisaBaru = Math.round((sisaLama - nominal) * 100) / 100
			await client.query("update piutang set sisa = $1, status = $2 where id = $3", [
				sisaBaru,
				sisaBaru <= 0 ? "lunas" : "belum_lunas",
				id,
			])
		})
		res.status(201).json({ ok: true })
	}),
)

// Hapus SEMUA piutang (pembayaran_piutang ikut via cascade). Khusus pemilik.
piutangRouter.delete(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		const c = await query<{ c: number }>("select count(*)::int as c from piutang")
		await query("delete from piutang")
		res.json({ ok: true, dihapus: c[0].c })
	}),
)

// Hapus SATU piutang. Khusus pemilik.
piutangRouter.delete(
	"/:id",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const r = await query<{ id: string }>("delete from piutang where id = $1 returning id", [
			req.params.id,
		])
		if (!r.length) throw new ApiError(404, "Piutang tidak ditemukan")
		res.json({ ok: true })
	}),
)