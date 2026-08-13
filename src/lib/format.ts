// Helper format Rupiah & tanggal — dipakai konsisten di seluruh aplikasi.

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const numberFmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 })

/** Rp1.250.000 */
export function rupiah(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0
  if (!Number.isFinite(n)) return rupiahFmt.format(0)
  return rupiahFmt.format(n as number)
}

/** 1.250,5 (tanpa simbol) — mis. untuk qty per kg/meter */
export function angka(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0
  return numberFmt.format(Number.isFinite(n) ? (n as number) : 0)
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})
const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function tanggal(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const d = typeof value === "string" ? new Date(value) : value
  return dateFmt.format(d)
}

export function tanggalJam(value: string | Date | null | undefined): string {
  if (!value) return "-"
  const d = typeof value === "string" ? new Date(value) : value
  return dateTimeFmt.format(d)
}
