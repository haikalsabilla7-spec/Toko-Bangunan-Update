import { Router } from "express"
import { query, num } from "../db"
import { config } from "../config"
import { asyncHandler } from "../lib/http"
import { authRequired } from "../middleware/auth"

export const dashboardRouter = Router()

dashboardRouter.get(
	"/",
	authRequired,
	asyncHandler(async (_req, res) => {
		const penjualan = await query<{ s: string; c: number }>(
			"select coalesce(sum(total),0) as s, count(*)::int as c from transaksi where tanggal >= date_trunc('day', now())",
		)
		const stok = await query<{ c: number }>(
			"select count(*)::int as c from barang where stok <= $1",
			[config.batasStokMenipis],
		)
		const piutang = await query<{ s: string }>(
			"select coalesce(sum(sisa),0) as s from piutang where status = 'belum_lunas'",
		)
		res.json({
			penjualanHariIni: num(penjualan[0]?.s),
			jumlahTransaksiHariIni: penjualan[0]?.c ?? 0,
			jumlahStokMenipis: stok[0]?.c ?? 0,
			totalPiutangBelumLunas: num(piutang[0]?.s),
		})
	}),
)

dashboardRouter.get(
	"/stok-menipis",
	authRequired,
	asyncHandler(async (_req, res) => {
		const rows = await query<any>(
			`select id, nama, kode, stok, satuan from barang
			 where stok <= $1 order by stok asc limit 20`,
			[config.batasStokMenipis],
		)
		res.json(rows.map((b) => ({ ...b, stok: num(b.stok) })))
	}),
)
