import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config"
import { ApiError } from "../lib/http"

export type Role = "pemilik" | "kasir"

interface JwtPayload {
	sub: string
	nama: string
	email: string
	role: Role
}

/** Wajib login: verifikasi token JWT dari header Authorization: Bearer <token>. */
export function authRequired(req: Request, _res: Response, next: NextFunction) {
	const header = req.headers.authorization
	if (!header || !header.startsWith("Bearer ")) {
		throw new ApiError(401, "Silakan login terlebih dahulu")
	}
	try {
		const payload = jwt.verify(header.slice(7), config.jwtSecret) as JwtPayload
		req.user = {
			id: payload.sub,
			nama: payload.nama,
			email: payload.email,
			role: payload.role,
		}
		next()
	} catch {
		throw new ApiError(401, "Sesi berakhir, silakan login ulang")
	}
}

/** Wajib pemilik: dipakai untuk endpoint sensitif (laporan, utang, hapus data). */
export function pemilikOnly(req: Request, _res: Response, next: NextFunction) {
	if (req.user?.role !== "pemilik") {
		throw new ApiError(403, "Akses khusus pemilik toko")
	}
	next()
}
