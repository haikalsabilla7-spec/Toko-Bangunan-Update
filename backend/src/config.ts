import "dotenv/config"

function required(name: string, fallback?: string): string {
	const v = process.env[name] ?? fallback
	if (v === undefined || v === "") {
		throw new Error(`Environment variable ${name} belum diisi. Lihat .env.example`)
	}
	return v
}

export const config = {
	port: Number(process.env.PORT ?? 4000),
	databaseUrl: required("DATABASE_URL"),
	jwtSecret: required("JWT_SECRET", "dev-secret-jangan-dipakai-di-produksi"),
	jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
	// Daftar origin yang diizinkan (dipisah koma), atau "*" untuk semua.
	corsOrigin: (process.env.CORS_ORIGIN ?? "*").split(",").map((s) => s.trim()),
	// Ambang stok menipis untuk dashboard.
	batasStokMenipis: Number(process.env.BATAS_STOK_MENIPIS ?? 10),
}
