import { Pool, type PoolClient } from "pg"
import { config } from "./config"

export const pool = new Pool({ connectionString: config.databaseUrl })

/** Jalankan query dan kembalikan baris hasil. */
export async function query<T = any>(
	text: string,
	params: unknown[] = [],
): Promise<T[]> {
	const res = await pool.query(text, params as any[])
	return res.rows as T[]
}

/**
 * Jalankan beberapa query dalam satu transaksi database (BEGIN/COMMIT).
 * Jika terjadi error, otomatis ROLLBACK. Dipakai untuk simpan transaksi kasir
 * agar potong stok + detail + piutang bersifat atomik (semua berhasil atau semua batal).
 */
export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
	const client = await pool.connect()
	try {
		await client.query("BEGIN")
		const result = await fn(client)
		await client.query("COMMIT")
		return result
	} catch (err) {
		await client.query("ROLLBACK")
		throw err
	} finally {
		client.release()
	}
}

/** Ubah nilai numeric Postgres (dikembalikan sebagai string) menjadi number. */
export function num(v: unknown): number {
	if (v === null || v === undefined) return 0
	const n = typeof v === "string" ? Number(v) : (v as number)
	return Number.isFinite(n) ? n : 0
}
