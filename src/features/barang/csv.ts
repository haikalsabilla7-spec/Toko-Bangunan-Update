import type { BarangInput } from "./api"

export interface ParsedRow {
  row: number
  data?: BarangInput
  error?: string
}

/**
 * Parser CSV sederhana (mendukung tanda kutip & koma di dalam sel).
 * Header wajib: kode,nama,satuan,harga_beli,harga_jual,stok
 * Opsional: barcode,kategori
 */
export function parseBarangCsv(
  text: string,
  kategoriMap: Map<string, string>,
): { rows: ParsedRow[]; header: string[] } {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "")
  if (lines.length === 0) return { rows: [], header: [] }

  const header = splitCsvLine(lines[0]!).map((h) => h.trim().toLowerCase())
  const idx = (name: string) => header.indexOf(name)

  const need = ["kode", "nama", "satuan", "harga_beli", "harga_jual", "stok"]
  const missing = need.filter((n) => idx(n) === -1)

  const rows: ParsedRow[] = []
  if (missing.length > 0) {
    rows.push({ row: 0, error: `Kolom wajib hilang: ${missing.join(", ")}` })
    return { rows, header }
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]!)
    const get = (name: string) => (idx(name) >= 0 ? (cols[idx(name)] ?? "").trim() : "")
    const kode = get("kode")
    const nama = get("nama")
    if (!kode || !nama) {
      rows.push({ row: i, error: "Kode & nama wajib diisi" })
      continue
    }
    const kategoriNama = get("kategori")
    const kategori_id = kategoriNama ? kategoriMap.get(kategoriNama.toLowerCase()) ?? null : null
    rows.push({
      row: i,
      data: {
        kode,
        nama,
        satuan: get("satuan") || "pcs",
        harga_beli: Number(get("harga_beli")) || 0,
        harga_jual: Number(get("harga_jual")) || 0,
        stok: Number(get("stok")) || 0,
        barcode: get("barcode") || null,
        kategori_id,
      },
    })
  }
  return { rows, header }
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"'
        i++
      } else inQuote = !inQuote
    } else if (c === "," && !inQuote) {
      out.push(cur)
      cur = ""
    } else cur += c
  }
  out.push(cur)
  return out
}

export const CSV_TEMPLATE =
  "kode,nama,kategori,satuan,harga_beli,harga_jual,stok,barcode\n" +
  "SMN-XYZ,Semen Contoh 40kg,Semen & Perekat,sak,58000,65000,100,8991234599999\n" +
  "BSI-XYZ,Besi Contoh 8mm,Besi & Baja,batang,42000,52000,200,\n"
