import express, { type Request, type Response, type NextFunction } from "express"
import cors from "cors"
import { ZodError } from "zod"
import { config } from "./config"
import { ApiError } from "./lib/http"
import { authRouter } from "./routes/auth"
import { kategoriRouter } from "./routes/kategori"
import { barangRouter } from "./routes/barang"
import { transaksiRouter } from "./routes/transaksi"
import { dashboardRouter } from "./routes/dashboard"
import { laporanRouter } from "./routes/laporan"
import { stokRouter } from "./routes/stok"
import { piutangRouter } from "./routes/piutang"
import { utangRouter } from "./routes/utang"

const app = express()

app.use(
	cors({
		origin: config.corsOrigin.includes("*") ? true : config.corsOrigin,
	}),
)
app.use(express.json({ limit: "2mb" }))

// Cek kesehatan server
app.get("/health", (_req, res) => res.json({ ok: true }))

app.use("/auth", authRouter)
app.use("/kategori", kategoriRouter)
app.use("/barang", barangRouter)
app.use("/transaksi", transaksiRouter)
app.use("/dashboard", dashboardRouter)
app.use("/laporan", laporanRouter)
app.use("/stok", stokRouter)
app.use("/piutang", piutangRouter)
app.use("/utang", utangRouter)

// 404
app.use((_req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan" }))

// Error handler terpusat
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	if (err instanceof ZodError) {
		return res.status(400).json({ error: "Data tidak valid", detail: err.errors })
	}
	if (err instanceof ApiError) {
		return res.status(err.status).json({ error: err.message })
	}
	console.error(err)
	res.status(500).json({ error: "Terjadi kesalahan pada server" })
})

app.listen(config.port, () => {
	console.log(`API Toko Bangunan berjalan di http://localhost:${config.port}`)
})
