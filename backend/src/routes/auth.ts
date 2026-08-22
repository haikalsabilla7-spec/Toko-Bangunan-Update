import { Router } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { z } from "zod"
import { query } from "../db"
import { config } from "../config"
import { ApiError, asyncHandler } from "../lib/http"
import { authRequired } from "../middleware/auth"

export const authRouter = Router()

const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

interface UserRow {
	id: string
	email: string
	nama: string
	role: "pemilik" | "kasir"
	password_hash: string
}

authRouter.post(
	"/login",
	asyncHandler(async (req, res) => {
		const { email, password } = loginSchema.parse(req.body)
		const rows = await query<UserRow>(
			"select id, email, nama, role, password_hash from users where email = $1",
			[email.toLowerCase()],
		)
		const user = rows[0]
		if (!user || !(await bcrypt.compare(password, user.password_hash))) {
			throw new ApiError(401, "Email atau kata sandi salah.")
		}
		const token = jwt.sign(
			{ sub: user.id, nama: user.nama, email: user.email, role: user.role },
			config.jwtSecret,
			{ expiresIn: config.jwtExpiresIn } as jwt.SignOptions,
		)
		res.json({
			token,
			user: { id: user.id, email: user.email, nama: user.nama, role: user.role },
		})
	}),
)

authRouter.get(
	"/me",
	authRequired,
	asyncHandler(async (req, res) => {
		res.json({ user: req.user })
	}),
)
