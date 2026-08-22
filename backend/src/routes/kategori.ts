import { Router } from "express"
import { query } from "../db"
import { asyncHandler } from "../lib/http"
import { authRequired } from "../middleware/auth"

export const kategoriRouter = Router()

kategoriRouter.get(
	"/",
	authRequired,
	asyncHandler(async (_req, res) => {
		const rows = await query(
			"select id, nama, created_at from kategori order by nama",
		)
		res.json(rows)
	}),
)
