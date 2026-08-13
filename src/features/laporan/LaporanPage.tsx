import { useMemo, useState } from "react"
import { Download, TrendingUp, Receipt, Wallet, Boxes } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { cn } from "@/lib/cn"
import { rupiah, angka } from "@/lib/format"
import { useLaporan, useLaporanStok, exportCsv, type Periode } from "./api"

type PresetPeriode = "hari" | "bulan" | "custom"
type Tab = "penjualan" | "stok"

function rentang(preset: PresetPeriode, customDari: string, customSampai: string): Periode {
  const now = new Date()
  if (preset === "hari") {
    const d = new Date(now); d.setHours(0, 0, 0, 0)
    const e = new Date(now); e.setHours(23, 59, 59, 999)
    return { dari: d.toISOString(), sampai: e.toISOString() }
  }
  if (preset === "bulan") {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { dari: d.toISOString(), sampai: e.toISOString() }
  }
  const d = customDari ? new Date(customDari + "T00:00:00") : new Date(now)
  const e = customSampai ? new Date(customSampai + "T23:59:59") : new Date(now)
  return { dari: d.toISOString(), sampai: e.toISOString() }
}

export default function LaporanPage() {
  const [tab, setTab] = useState<Tab>("penjualan")
  const [preset, setPreset] = useState<PresetPeriode>("bulan")
  const [customDari, setCustomDari] = useState("")
  const [customSampai, setCustomSampai] = useState("")

  const periode = useMemo(() => rentang(preset, customDari, customSampai), [preset, customDari, customSampai])
  const laporan = useLaporan(periode)
  const stok = useLaporanStok()

  // Urutkan per-barang dari omzet tertinggi (tanpa menampilkan laba/modal).
  const perBarang = useMemo(
    () => [...(laporan.data?.perBarang ?? [])].sort((a, b) => b.omzet - a.omzet),
    [laporan.data],
  )

  function exportPenjualan() {
    if (!laporan.data) return
    exportCsv(
      "laporan-penjualan.csv",
      perBarang.map((b) => ({
        Barang: b.nama,
        Qty: b.qty,
        Omzet: b.omzet,
      })),
    )
  }
  function exportStok() {
    if (!stok.data) return
    exportCsv(
      "laporan-stok.csv",
      stok.data.map((b: any) => ({
        Kode: b.kode,
        Nama: b.nama,
        Stok: b.stok,
        Satuan: b.satuan,
        HargaBeli: b.harga_beli,
        HargaJual: b.harga_jual,
        NilaiModal: b.nilai_modal,
        NilaiJual: b.nilai_jual,
      })),
    )
  }

  const nilaiPersediaan = (stok.data ?? []).reduce((s: number, b: any) => s + b.nilai_modal, 0)

  return (
    <div>
      <PageHeader
        title="Laporan"
        description="Analisis penjualan & nilai persediaan. Khusus pemilik."
        actions={
          <Button variant="outline" onClick={tab === "penjualan" ? exportPenjualan : exportStok}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="space-y-4 p-4 sm:p-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-md border border-line bg-surface p-1">
          {([
            { v: "penjualan", label: "Penjualan" },
            { v: "stok", label: "Laporan Stok" },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={cn(
                "flex-1 rounded px-3 py-2 text-sm font-medium sm:flex-none sm:px-6",
                tab === t.v ? "bg-ink text-white" : "text-ink-soft hover:bg-surface-sunken",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "penjualan" && (
          <>
            {/* Filter periode */}
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex rounded-md border border-line-strong">
                {([
                  { v: "hari", label: "Hari Ini" },
                  { v: "bulan", label: "Bulan Ini" },
                  { v: "custom", label: "Custom" },
                ] as const).map((p) => (
                  <button
                    key={p.v}
                    onClick={() => setPreset(p.v)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium first:rounded-l-md last:rounded-r-md",
                      preset === p.v ? "bg-accent text-white" : "bg-surface text-ink-soft hover:bg-surface-sunken",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {preset === "custom" && (
                <div className="flex items-end gap-2">
                  <input type="date" value={customDari} onChange={(e) => setCustomDari(e.target.value)} className="input-base w-auto" />
                  <span className="pb-2 text-ink-muted">s/d</span>
                  <input type="date" value={customSampai} onChange={(e) => setCustomSampai(e.target.value)} className="input-base w-auto" />
                </div>
              )}
            </div>

            {laporan.isError ? (
              <ErrorState onRetry={() => laporan.refetch()} />
            ) : laporan.isLoading || !laporan.data ? (
              <InlineLoader />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:max-w-md">
                  <StatCard icon={TrendingUp} tone="accent" size="md" label="Penjualan (Omzet)" value={rupiah(laporan.data.ringkas.pemasukan)} />
                  <StatCard icon={Receipt} size="md" label="Jumlah Transaksi" value={angka(laporan.data.ringkas.jumlahTransaksi)} />
                </div>

                <Card className="overflow-hidden">
                  <CardHeader title="Penjualan per Barang" subtitle="Diurutkan dari omzet tertinggi" />
                  {perBarang.length === 0 ? (
                    <EmptyState title="Belum ada penjualan" description="Tidak ada transaksi pada periode ini." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-surface-sunken">
                          <tr>
                            <th className="th">Barang</th>
                            <th className="th text-right">Qty</th>
                            <th className="th text-right">Omzet</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perBarang.map((b) => (
                            <tr key={b.barang_id} className="hover:bg-surface-sunken">
                              <td className="td font-medium">{b.nama}</td>
                              <td className="td num text-right">{angka(b.qty)}</td>
                              <td className="td num text-right font-semibold">{rupiah(b.omzet)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}

        {tab === "stok" && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:max-w-md">
              <StatCard icon={Boxes} size="md" label="Jenis Barang" value={angka(stok.data?.length ?? 0)} />
              <StatCard icon={Wallet} tone="accent" size="md" label="Nilai Persediaan (Modal)" value={rupiah(nilaiPersediaan)} />
            </div>
            <Card className="overflow-hidden">
              <CardHeader title="Nilai Persediaan" subtitle="Stok saat ini × harga" />
              {stok.isError ? (
                <ErrorState onRetry={() => stok.refetch()} />
              ) : stok.isLoading ? (
                <InlineLoader />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-sunken">
                      <tr>
                        <th className="th">Kode</th>
                        <th className="th">Nama</th>
                        <th className="th text-right">Stok</th>
                        <th className="th text-right">Nilai Modal</th>
                        <th className="th text-right">Nilai Jual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stok.data ?? []).map((b: any) => (
                        <tr key={b.id} className="hover:bg-surface-sunken">
                          <td className="td font-mono text-xs text-ink-muted">{b.kode}</td>
                          <td className="td font-medium">{b.nama}</td>
                          <td className="td num text-right">{angka(b.stok)} {b.satuan}</td>
                          <td className="td num text-right">{rupiah(b.nilai_modal)}</td>
                          <td className="td num text-right">{rupiah(b.nilai_jual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
