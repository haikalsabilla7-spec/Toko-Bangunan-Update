import { Router } from "express"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { query } from "../db"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired, pemilikOnly } from "../middleware/auth"

export const usersRouter = Router()

// Semua endpoint kelola pengguna khusus pemilik (owner).
usersRouter.use(authRequired, pemilikOnly)

interface UserRow {
	id: string
	email: string
	nama: string
	role: "pemilik" | "kasir"
	created_at: string
}

function mapUser(u: UserRow) {
	return { id: u.id, email: u.email, nama: u.nama, role: u.role, created_at: u.created_at }
}

// Daftar semua pengguna (tanpa password_hash).
usersRouter.get(
	"/",
	asyncHandler(async (_req, res) => {
		const rows = await query<UserRow>(
			"select id, email, nama, role, created_at from users order by role, nama",
		)
		res.json(rows.map(mapUser))
	}),
)

const createSchema = z.object({
	email: z.string().email(),
	nama: z.string().min(1),
	role: z.enum(["pemilik", "kasir"]),
	password: z.string().min(6),
})

// Tambah pengguna baru.
usersRouter.post(
	"/",
	asyncHandler(async (req, res) => {
		const b = createSchema.parse(req.body)
		const hash = await bcrypt.hash(b.password, 10)
		try {
			const rows = await query<{ id: string }>(
				`insert into users (email, password_hash, nama, role)
				 values ($1,$2,$3,$4) returning id`,
				[b.email.toLowerCase(), hash, b.nama, b.role],
			)
			res.status(201).json({ id: rows[0]!.id })
		} catch (e) {
			if ((e as { code?: string }).code === "23505") {
				throw new ApiError(409, "Email sudah dipakai akun lain")
			}
			throw e
		}
	}),
)

const updateSchema = z.object({
	nama: z.string().min(1),
	role: z.enum(["pemilik", "kasir"]),
	// Password opsional: kalau kosong, sandi lama dipertahankan.
	password: z.string().min(6).optional(),
})

// Ubah pengguna: nama, role, dan (opsional) password baru.
usersRouter.put(
	"/:id",
	asyncHandler(async (req, res) => {
		const id = req.params.id
		const meId = req.user!.id
		const b = updateSchema.parse(req.body)

		const targetRows = await query<{ role: "pemilik" | "kasir" }>(
			"select role from users where id = $1",
			[id],
		)
		const target = targetRows[0]
		if (!target) throw new ApiError(404, "Pengguna tidak ditemukan")

		// Pengaman: tidak boleh mengubah role akun sendiri.
		if (id === meId && b.role !== target.role) {
			throw new ApiError(400, "Anda tidak bisa mengubah role akun sendiri")
		}
		// Pengaman: jangan sampai owner terakhir diturunkan jadi kasir.
		if (target.role === "pemilik" && b.role !== "pemilik") {
			const cnt = await query<{ c: number }>(
				"select count(*)::int as c from users where role = 'pemilik'",
			)
			if ((cnt[0]?.c ?? 0) <= 1) {
				throw new ApiError(400, "Minimal harus ada 1 pemilik. Owner terakhir tidak bisa diturunkan.")
			}
		}

		if (b.password && b.password.length > 0) {
			const hash = await bcrypt.hash(b.password, 10)
			await query("update users set nama=$1, role=$2, password_hash=$3 where id=$4", [
				b.nama,
				b.role,
				hash,
				id,
			])
		} else {
			await query("update users set nama=$1, role=$2 where id=$3", [b.nama, b.role, id])
		}
		res.json({ ok: true })
	}),
)

// Hapus pengguna (dengan pengaman).
usersRouter.delete(
	"/:id",
	asyncHandler(async (req, res) => {
		const id = req.params.id
		const meId = req.user!.id
		if (id === meId) throw new ApiError(400, "Anda tidak bisa menghapus akun sendiri")

		const targetRows = await query<{ role: "pemilik" | "kasir" }>(
			"select role from users where id = $1",
			[id],
		)
		const target = targetRows[0]
		if (!target) throw new ApiError(404, "Pengguna tidak ditemukan")

		if (target.role === "pemilik") {
			const cnt = await query<{ c: number }>(
				"select count(*)::int as c from users where role = 'pemilik'",
			)
			if ((cnt[0]?.c ?? 0) <= 1) {
				throw new ApiError(400, "Minimal harus ada 1 pemilik. Owner terakhir tidak bisa dihapus.")
			}
		}

		try {
			await query("delete from users where id = $1", [id])
			res.json({ ok: true })
		} catch (e) {
			if ((e as { code?: string }).code === "23503") {
				throw new ApiError(
					409,
					"Pengguna ini sudah memiliki transaksi, jadi tidak bisa dihapus. Ubah rolenya jadi kasir bila tidak dipakai lagi.",
				)
			}
			throw e
		}
	}),
)