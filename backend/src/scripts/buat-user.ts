import bcrypt from "bcryptjs"
import { pool } from "../db"

// Membuat / memperbarui akun pengguna dengan password ter-hash.
// Contoh:
//   npm run buat-user -- owner@toko.com rahasia123 "Pak Budi" pemilik
//   npm run buat-user -- kasir@toko.com rahasia123 "Siti" kasir
async function main() {
	const [email, password, nama, role = "kasir"] = process.argv.slice(2)
	if (!email || !password || !nama) {
		console.error(
			'Format: npm run buat-user -- <email> <password> "<nama>" <pemilik|kasir>',
		)
		process.exit(1)
	}
	if (role !== "pemilik" && role !== "kasir") {
		console.error("Role harus 'pemilik' atau 'kasir'")
		process.exit(1)
	}
	const hash = await bcrypt.hash(password, 10)
	await pool.query(
		`insert into users (email, password_hash, nama, role)
		 values ($1,$2,$3,$4)
		 on conflict (email) do update set password_hash = excluded.password_hash,
		   nama = excluded.nama, role = excluded.role`,
		[email.toLowerCase(), hash, nama, role],
	)
	console.log(`\u2705 Akun ${email} (${role}) siap dipakai.`)
	await pool.end()
}

main().catch((err) => {
	console.error("\u274c Gagal membuat user:", err)
	process.exit(1)
})
