import { rupiah, tanggalJam } from "@/lib/format"

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
}

/**
 * Struk thermal 58mm. Lebar cetak efektif ~48mm.
 * Dibungkus .print-area agar hanya bagian ini yang tercetak (lihat index.css).
 */
export function StrukThermal({ data }: { data: StrukData }) {
  return (
    <div className="print-area mx-auto w-[58mm] bg-white p-2 font-mono text-[10px] leading-tight text-black">
      <div className="text-center">
        <p className="text-[12px] font-bold">TOKO BANGUNAN</p>
        <p>Jl. Material Jaya No. 12</p>
        <p>Telp 0800-000-000</p>
      </div>
      <Div />
      <div className="flex justify-between">
        <span>{data.no_transaksi}</span>
      </div>
      <div className="flex justify-between">
        <span>{tanggalJam(data.tanggal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Kasir: {data.kasir}</span>
      </div>
      <Div />
      {data.items.map((it, i) => (
        <div key={i} className="mb-1">
          <p className="font-semibold">{it.nama}</p>
          <div className="flex justify-between">
            <span>
              {it.qty} {it.satuan} x {rupiah(it.harga_jual)}
            </span>
            <span>{rupiah(it.subtotal)}</span>
          </div>
        </div>
      ))}
      <Div />
      <div className="flex justify-between text-[12px] font-bold">
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
        <div className="flex justify-between">
          <span>Pelanggan</span>
          <span>{data.nama_pelanggan}</span>
        </div>
      )}
      <Div />
      <p className="text-center">Terima kasih telah berbelanja</p>
      <p className="text-center">Barang yang sudah dibeli</p>
      <p className="text-center">dapat ditukar max 1x24 jam</p>
    </div>
  )
}

function Div() {
  return <div className="my-1 border-t border-dashed border-black" />
}
