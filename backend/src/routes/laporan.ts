import { Router } from "express"
import { query, num } from "../db"
import { asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

// Semua laporan (berisi modal/laba) khusus pemilik.
export const laporanRouter = Router()

laporanRouter.get(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const dari = String(req.query.dari ?? "")
		const sampai = String(req.query.sampai ?? "")

		const trx = await query<{ id: string; total: string }>(
			"select id, total from transaksi where tanggal >= $1 and tanggal <= $2",
			[dari, sampai],
		)
		const detail = await query<any>(
			`select d.barang_id, d.qty, d.subtotal, d.harga_beli_saat_jual, b.nama
			 from detail_transaksi d
			 join transaksi t on t.id = d.transaksi_id
			 join barang b on b.id = d.barang_id
			 where t.tanggal >= $1 and t.tanggal <= $2`,
			[dari, sampai],
		)
		const bayarUtang = await query<{ s: string }>(
			"select coalesce(sum(nominal),0) as s from pembayaran_utang where tanggal >= $1 and tanggal <= $2",
			[dari, sampai],
		)

		let pemasukan = 0
		for (const t of trx) pemasukan += num(t.total)

		let hpp = 0
		const map = new Map<string, any>()
		for (const d of detail) {
			const qty = num(d.qty)
			const omzet = num(d.subtotal)
			const modal = num(d.harga_beli_saat_jual) * qty
			hpp += modal
			const prev = map.get(d.barang_id) ?? {
				barang_id: d.barang_id,
				nama: d.nama ?? "-",
				qty: 0,
				omzet: 0,
				modal: 0,
				laba: 0,
			}
			prev.qty += qty
			prev.omzet += omzet
			prev.modal += modal
			prev.laba += omzet - modal
			map.set(d.barang_id, prev)
		}

		res.json({
			ringkas: {
				pemasukan,
				hpp,
				laba: pemasukan - hpp,
				pengeluaranUtang: num(bayarUtang[0]?.s),
				jumlahTransaksi: trx.length,
			},
			perBarang: [...map.values()].sort((a, b) => b.laba - a.laba),
		})
	}),
)

laporanRouter.get(
	"/stok",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		const rows = await query<any>(
			"select id, kode, nama, stok, satuan, harga_beli, harga_jual from barang order by nama",
		)
		res.json(
			rows.map((b) => {
				const stok = num(b.stok)
				const hb = num(b.harga_beli)
				const hj = num(b.harga_jual)
				return {
					id: b.id,
					kode: b.kode,
					nama: b.nama,
					stok,
					satuan: b.satuan,
					harga_beli: hb,
					harga_jual: hj,
					nilai_modal: stok * hb,
					nilai_jual: stok * hj,
				}
			}),
		)
	}),
)
