import { useMemo, useState } from "react"
import { History, Search, Receipt, Printer } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { StrukThermal, type StrukData } from "@/components/print/StrukThermal"
import { rupiah, tanggalJam } from "@/lib/format"
import { useRiwayatTransaksi, useDetailTransaksi, type RiwayatRow } from "./api"

function isoDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

export default function RiwayatPage() {
  const [dari, setDari] = useState(isoDate(30))
  const [sampai, setSampai] = useState(isoDate(0))
  const [q, setQ] = useState("")
  const [dipilih, setDipilih] = useState<RiwayatRow | null>(null)

  const { data, isLoading, isError, refetch } = useRiwayatTransaksi({ dari, sampai, q })

  const { totalOmzet, jumlahTrx } = useMemo(() => {
    const list = data ?? []
    return {
      totalOmzet: list.reduce((s, t) => s + Number(t.total), 0),
      jumlahTrx: list.length,
    }
  }, [data])

  return (
    <div>
      <PageHeader
        title="Riwayat Transaksi"
        description="Semua transaksi penjualan. Klik baris untuk melihat detail & cetak ulang nota."
      />
      <div className="space-y-3 p-4 sm:p-6">
        {/* Ringkasan */}
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Omzet (terfilter)</p>
            <p className="num mt-1 font-grotesk text-xl font-bold text-accent">{rupiah(totalOmzet)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Jumlah Transaksi</p>
            <p className="num mt-1 font-grotesk text-xl font-bold">{jumlahTrx}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex gap-2">
            <label className="flex-1 space-y-1">
              <span className="block text-xs font-medium text-ink-soft">Dari</span>
              <input type="date" value={dari} max={sampai} onChange={(e) => setDari(e.target.value)} className="input-base" />
            </label>
            <label className="flex-1 space-y-1">
              <span className="block text-xs font-medium text-ink-soft">Sampai</span>
              <input type="date" value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} className="input-base" />
            </label>
          </div>
          <div className="flex-1">
            <span className="block text-xs font-medium text-ink-soft">Cari No. Transaksi</span>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="mis. TRX-2026..." className="input-base pl-9" />
            </div>
          </div>
        </div>

        {/* Tabel */}
        <Card className="overflow-hidden">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <InlineLoader />
          ) : (data ?? []).length === 0 ? (
            <EmptyState
              icon={<History className="h-8 w-8" />}
              title="Belum ada transaksi"
              description="Transaksi yang tersimpan akan muncul di sini. Coba ubah rentang tanggal."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">No. Transaksi</th>
                    <th className="th">Tanggal</th>
                    <th className="th">Kasir</th>
                    <th className="th">Metode</th>
                    <th className="th text-right">Total</th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((t) => (
                    <tr key={t.id} className="cursor-pointer hover:bg-surface-sunken" onClick={() => setDipilih(t)}>
                      <td className="td font-medium">{t.no_transaksi}</td>
                      <td className="td text-sm text-ink-soft">{tanggalJam(t.tanggal)}</td>
                      <td className="td text-sm">{t.kasir?.nama ?? "-"}</td>
                      <td className="td">
                        <Badge tone={t.metode_bayar === "utang" ? "warn" : "ok"}>
                          {t.metode_bayar === "utang" ? "Utang" : "Tunai"}
                        </Badge>
                      </td>
                      <td className="td num text-right font-semibold">{rupiah(t.total)}</td>
                      <td className="td text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDipilih(t)
                          }}
                        >
                          <Receipt className="h-4 w-4" /> Nota
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {dipilih && <NotaModal trx={dipilih} onClose={() => setDipilih(null)} />}
    </div>
  )
}

function NotaModal({ trx, onClose }: { trx: RiwayatRow; onClose: () => void }) {
  const { data, isLoading, isError, refetch } = useDetailTransaksi(trx.id)

  const struk: StrukData | null = data
    ? {
        no_transaksi: trx.no_transaksi,
        tanggal: trx.tanggal,
        kasir: trx.kasir?.nama ?? "Kasir",
        metode_bayar: trx.metode_bayar,
        items: data.items.map((it) => ({
          nama: it.barang?.nama ?? "(barang dihapus)",
          qty: Number(it.qty),
          satuan: it.barang?.satuan ?? "",
          harga_jual: Number(it.harga_jual),
          subtotal: Number(it.subtotal),
        })),
        total: Number(trx.total),
        nama_pelanggan: data.nama_pelanggan,
        catatan: trx.catatan,
      }
    : null

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nota — ${trx.no_transaksi}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button onClick={() => window.print()} disabled={!struk}>
            <Printer className="h-4 w-4" /> Cetak Ulang
          </Button>
        </>
      }
    >
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !struk ? (
        <InlineLoader label="Memuat nota..." />
      ) : (
        <div className="rounded-md border border-line bg-surface-sunken p-2">
          <StrukThermal data={struk} />
        </div>
      )}
    </Modal>
  )
}