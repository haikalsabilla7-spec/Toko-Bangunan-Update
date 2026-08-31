import { Router } from "express"
import { z } from "zod"
import { query, tx, num } from "../db"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

export const transaksiRouter = Router()

const itemSchema = z.object({
	barang_id: z.string().uuid(),
	qty: z.number().positive(),
	// harga_jual opsional: kalau tidak dikirim, pakai harga dari database.
	harga_jual: z.number().nonnegative().optional(),
})

const simpanSchema = z.object({
	metode_bayar: z.enum(["tunai", "utang"]),
	catatan: z.string().nullable().optional(),
	items: z.array(itemSchema).min(1, "Keranjang kosong"),
	nama_pelanggan: z.string().nullable().optional(),
	jatuh_tempo: z.string().nullable().optional(),
})

function noTransaksiHariIni(seq: number): string {
	const d = new Date()
	const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
	return `TRX-${ymd}-${String(seq).padStart(4, "0")}`
}

// ============================================================
// SIMPAN TRANSAKSI (atomik) - pengganti RPC simpan_transaksi.
// Semua hitungan (subtotal, modal) dilakukan di server, bukan dipercaya dari client.
// ============================================================
transaksiRouter.post(
	"/",
	authRequired,
	asyncHandler(async (req, res) => {
		const body = simpanSchema.parse(req.body)
		const kasirId = req.user!.id

		const result = await tx(async (client) => {
			const seqRes = await client.query(
				"select count(*)::int as c from transaksi where tanggal::date = now()::date",
			)
			const no = noTransaksiHariIni((seqRes.rows[0].c as number) + 1)
			const status = body.metode_bayar === "utang" ? "belum_lunas" : "lunas"

			const trxRes = await client.query(
				`insert into transaksi (no_transaksi, kasir_id, total, metode_bayar, status, catatan)
				 values ($1,$2,0,$3,$4,$5) returning id, no_transaksi, tanggal`,
				[no, kasirId, body.metode_bayar, status, body.catatan ?? null],
			)
			const trx = trxRes.rows[0]
			let total = 0

			for (const item of body.items) {
				// Kunci baris barang agar stok tidak balapan (race condition).
				const bRes = await client.query(
					"select stok, nama, harga_beli, harga_jual from barang where id = $1 for update",
					[item.barang_id],
				)
				const b = bRes.rows[0]
				if (!b) throw new ApiError(400, "Barang tidak ditemukan")

				const qty = item.qty
				const hargaJual = item.harga_jual ?? num(b.harga_jual)
				const hargaBeli = num(b.harga_beli)
				if (num(b.stok) < qty) {
					throw new ApiError(400, `Stok ${b.nama} tidak cukup (tersisa ${num(b.stok)})`)
				}
				const subtotal = Math.round(qty * hargaJual * 100) / 100

				await client.query(
					`insert into detail_transaksi
					 (transaksi_id, barang_id, qty, harga_jual, harga_beli_saat_jual, subtotal)
					 values ($1,$2,$3,$4,$5,$6)`,
					[trx.id, item.barang_id, qty, hargaJual, hargaBeli, subtotal],
				)
				await client.query("update barang set stok = stok - $1 where id = $2", [qty, item.barang_id])
				total += subtotal
			}

			await client.query("update transaksi set total = $1 where id = $2", [total, trx.id])

			if (body.metode_bayar === "utang") {
				const nama = body.nama_pelanggan?.trim() || "Pelanggan"
				await client.query(
					`insert into piutang (transaksi_id, nama_pelanggan, nominal, sisa, jatuh_tempo, status)
					 values ($1,$2,$3,$3,$4,'belum_lunas')`,
					[trx.id, nama, total, body.jatuh_tempo || null],
				)
			}
			return trx
		})

		res.status(201).json({
			id: result.id,
			no_transaksi: result.no_transaksi,
			tanggal: result.tanggal,
		})
	}),
)

// ID barang terlaris (untuk grid tombol cepat di kasir).
transaksiRouter.get(
	"/laris",
	authRequired,
	asyncHandler(async (req, res) => {
		const top = Math.min(Math.max(Number(req.query.top ?? 8), 1), 50)
		const rows = await query<{ barang_id: string }>(
			`select d.barang_id
			 from detail_transaksi d
			 join (select id from transaksi order by tanggal desc limit 200) t on t.id = d.transaksi_id
			 group by d.barang_id
			 order by sum(d.qty) desc
			 limit $1`,
			[top],
		)
		res.json(rows.map((r) => r.barang_id))
	}),
)

// Riwayat transaksi (terbaru dulu) + filter tanggal & pencarian no. transaksi.
transaksiRouter.get(
	"/",
	authRequired,
	asyncHandler(async (req, res) => {
		const { dari, sampai, q } = req.query as Record<string, string | undefined>
		const conds: string[] = []
		const params: unknown[] = []
		if (dari) {
			params.push(dari)
			conds.push(`t.tanggal >= $${params.length}`)
		}
		if (sampai) {
			params.push(`${sampai}T23:59:59`)
			conds.push(`t.tanggal <= $${params.length}`)
		}
		if (q && q.trim()) {
			params.push(`%${q.trim()}%`)
			conds.push(`t.no_transaksi ilike $${params.length}`)
		}
		const where = conds.length ? `where ${conds.join(" and ")}` : ""
		const rows = await query<any>(
				`select t.id, t.no_transaksi, t.tanggal, t.total, t.metode_bayar, t.status,
						t.catatan, u.nama as kasir_nama,
						p.nominal as p_nominal, p.sisa as p_sisa, p.status as p_status
				from transaksi t
				left join users u on u.id = t.kasir_id
				left join piutang p on p.transaksi_id = t.id
				${where}
				order by t.tanggal desc
				limit 500`,
				params,
			)
		res.json(
			rows.map((t) => ({
				id: t.id,
				no_transaksi: t.no_transaksi,
				tanggal: t.tanggal,
				total: num(t.total),
				metode_bayar: t.metode_bayar,
				status: t.status,
				catatan: t.catatan,
				kasir: t.kasir_nama ? { nama: t.kasir_nama } : null,
				piutang:
					t.p_nominal != null
						? { nominal: num(t.p_nominal), sisa: num(t.p_sisa), status: t.p_status }
						: null,
			})),
		)
	}),
)

// Detail item + nama pelanggan (jika utang) untuk 1 transaksi.
transaksiRouter.get(
	"/:id/detail",
	authRequired,
	asyncHandler(async (req, res) => {
		const id = req.params.id
		const items = await query<any>(
			`select d.id, d.qty, d.harga_jual, d.subtotal, b.nama as b_nama, b.satuan as b_satuan
			 from detail_transaksi d
			 left join barang b on b.id = d.barang_id
			 where d.transaksi_id = $1
			 order by d.id`,
			[id],
		)
		const piutang = await query<{ nama_pelanggan: string }>(
			"select nama_pelanggan from piutang where transaksi_id = $1 limit 1",
			[id],
		)
		res.json({
			items: items.map((d) => ({
				id: d.id,
				qty: num(d.qty),
				harga_jual: num(d.harga_jual),
				subtotal: num(d.subtotal),
				barang: d.b_nama ? { nama: d.b_nama, satuan: d.b_satuan } : null,
			})),
			nama_pelanggan: piutang[0]?.nama_pelanggan ?? null,
		})
	}),
)

// ============================================================
// HAPUS TRANSAKSI (khusus pemilik).
// Menghapus transaksi = mengembalikan stok barang seperti sebelum transaksi,
// serta menghapus piutang terkait (pembayaran ikut via cascade).
// detail_transaksi ikut terhapus otomatis via ON DELETE CASCADE.
// ============================================================

// Hapus SEMUA transaksi sekaligus.
transaksiRouter.delete(
	"/",
	authRequired,
	pemilikOnly,
	asyncHandler(async (_req, res) => {
		const dihapus = await tx(async (client) => {
			await client.query(
				`update barang b
				   set stok = stok + agg.qty
				 from (select barang_id, sum(qty) as qty from detail_transaksi group by barang_id) agg
				 where b.id = agg.barang_id`,
			)
			const c = await client.query("select count(*)::int as c from transaksi")
			await client.query("delete from piutang")
			await client.query("delete from transaksi")
			return c.rows[0].c as number
		})
		res.json({ ok: true, dihapus })
	}),
)

// Hapus SATU transaksi.
transaksiRouter.delete(
	"/:id",
	authRequired,
	pemilikOnly,
	asyncHandler(async (req, res) => {
		const id = req.params.id
		await tx(async (client) => {
			const ada = await client.query("select id from transaksi where id = $1 for update", [id])
			if (!ada.rows[0]) throw new ApiError(404, "Transaksi tidak ditemukan")
			await client.query(
				`update barang b
				   set stok = stok + agg.qty
				 from (select barang_id, sum(qty) as qty from detail_transaksi where transaksi_id = $1 group by barang_id) agg
				 where b.id = agg.barang_id`,
				[id],
			)
			await client.query("delete from piutang where transaksi_id = $1", [id])
			await client.query("delete from transaksi where id = $1", [id])
		})
		res.json({ ok: true })
	}),
)