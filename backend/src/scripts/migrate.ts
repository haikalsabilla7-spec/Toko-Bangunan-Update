import { readFileSync } from "node:fs"
import { join } from "node:path"
import { pool } from "../db"

// Jalankan skema (dan opsional seed dengan flag --seed).
async function main() {
	const schema = readFileSync(join(__dirname, "../../sql/schema.sql"), "utf8")
	await pool.query(schema)
	console.log("\u2705 Skema database berhasil dibuat.")

	if (process.argv.includes("--seed")) {
		const seed = readFileSync(join(__dirname, "../../sql/seed.sql"), "utf8")
		await pool.query(seed)
		console.log("\u2705 Data contoh (seed) berhasil dimasukkan.")
	}
	await pool.end()
}

main().catch((err) => {
	console.error("\u274c Gagal migrasi:", err)
	process.exit(1)
})
