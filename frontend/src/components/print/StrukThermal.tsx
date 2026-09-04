import { rupiah, tanggalJam } from "@/lib/format"
import { TOKO } from "@/lib/toko"

export interface StrukItem {
  nama: string
  qty: number
  satuan: string
  harga_jual: number
  subtotal: number
}

export interface StrukData {
  no_transaksi: string
  tanggal: string
  kasir: string
  metode_bayar: string
  items: StrukItem[]
  total: number
  bayar?: number
  kembali?: number
  nama_pelanggan?: string | null
  catatan?: string | null
}

/**
 * Struk thermal 58mm. Lebar cetak efektif ~48mm.
 * Dibungkus .print-area agar hanya bagian ini yang tercetak (lihat index.css).
 */
export function StrukThermal({ data }: { data: StrukData }) {
  const totalQty = data.items.reduce((s, i) => s + i.qty, 0)
  const footerLines = TOKO.footer.split("|")
  return (
    <div className="print-area mx-auto w-[58mm] bg-white p-2 font-mono text-[10px] leading-tight text-black">
      {/* Kop toko */}
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase">{TOKO.nama}</p>
        <p>{TOKO.alamat}</p>
        <p>Telp {TOKO.telp}</p>
      </div>

      <Div />
      {/* Meta transaksi */}
      <Row label="No" value={data.no_transaksi} />
      <Row label="Tgl" value={tanggalJam(data.tanggal)} />
      <Row label="Kasir" value={data.kasir} />
      {data.metode_bayar === "utang" && data.nama_pelanggan && (
        <Row label="Plgn" value={data.nama_pelanggan} />
      )}

      <Div />
      {/* Item */}
      {data.items.map((it, i) => (
        <div key={i} className="mb-1">
          <p className="font-semibold">{it.nama}</p>
          <div className="flex justify-between">
            <span>
              {angkaRingkas(it.qty)} {it.satuan} x {rupiah(it.harga_jual)}
            </span>
            <span>{rupiah(it.subtotal)}</span>
          </div>
        </div>
      ))}

      <Div />
      {/* Ringkasan */}
      <div className="flex justify-between">
        <span>Total item</span>
        <span>{angkaRingkas(totalQty)}</span>
      </div>
      <div className="flex justify-between text-[13px] font-bold">
        <span>TOTAL</span>
        <span>{rupiah(data.total)}</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span>Metode</span>
        <span className="uppercase">{data.metode_bayar}</span>
      </div>

      {data.metode_bayar === "tunai" && data.bayar != null && (
        <>
          <div className="flex justify-between">
            <span>Bayar</span>
            <span>{rupiah(data.bayar)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembali</span>
            <span>{rupiah(data.kembali ?? 0)}</span>
          </div>
        </>
      )}
      {data.metode_bayar === "utang" && (
        <div className="mt-1 flex justify-between font-semibold">
          <span>SISA UTANG</span>
          <span>{rupiah(data.total)}</span>
        </div>
      )}

      {data.catatan && (
        <>
          <Div />
          <p className="text-black/70">Catatan:</p>
          <p className="whitespace-pre-wrap">{data.catatan}</p>
        </>
      )}

      <Div />
      {footerLines.map((l: string, i: number) => (
        <p key={i} className="text-center">{l}</p>
      ))}
      <p className="mt-1 text-center text-[9px]">-- Struk ini bukti pembayaran sah --</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="shrink-0 text-black/70">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

// Tampilkan qty tanpa ",00" bila bulat (mis. 3), tapi tetap dukung pecahan (mis. 2,5 kg)
function angkaRingkas(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString("id-ID")
}

function Div() {
  return <div className="my-1 border-t border-dashed border-black" />
}