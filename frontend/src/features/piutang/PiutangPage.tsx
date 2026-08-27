import { useMemo, useState } from "react"
import { HandCoins, Search, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { useToast } from "@/components/ui/Toast"
import { rupiah, tanggal, angka} from "@/lib/format"
import type { Piutang } from "@/types/database"
import { usePiutangList, usePembayaranPiutang, useCatatPembayaranPiutang } from "./api"
import { useDetailTransaksi } from "@/features/riwayat/api"

export default function PiutangPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = usePiutangList()
  const [q, setQ] = useState("")
  const [detail, setDetail] = useState<Piutang | null>(null)

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    let list = data ?? []
    if (term) list = list.filter((p) => p.nama_pelanggan.toLowerCase().includes(term))
    return list
  }, [data, q])

  const totalBelum = (data ?? [])
    .filter((p) => p.status === "belum_lunas")
    .reduce((s, p) => s + Number(p.sisa), 0)

  function isJatuhTempo(p: Piutang) {
    return p.status === "belum_lunas" && p.jatuh_tempo && new Date(p.jatuh_tempo) < new Date()
  }

  return (
    <div>
      <PageHeader title="Piutang" description="Tagihan pelanggan dari transaksi utang." />
      <div className="space-y-3 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Belum Lunas</p>
            <p className="num mt-1 font-grotesk text-xl font-bold text-danger">{rupiah(totalBelum)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Jumlah Piutang</p>
            <p className="num mt-1 font-grotesk text-xl font-bold">{data?.length ?? 0}</p>
          </div>
        </div>

        <div className="relative sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama pelanggan..." className="input-base pl-9" />
        </div>

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <InlineLoader />
          ) : filtered.length === 0 ? (
            <EmptyState icon={<HandCoins className="h-8 w-8" />} title="Belum ada piutang" description="Transaksi dengan metode utang akan muncul di sini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">Pelanggan</th>
                    <th className="th">Tanggal</th>
                    <th className="th">Jatuh Tempo</th>
                    <th className="th text-right">Nominal</th>
                    <th className="th text-right">Sisa</th>
                    <th className="th text-right">Status</th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-sunken">
                      <td className="td font-medium">
                        {p.nama_pelanggan}
                        {p.no_transaksi && (
                          <span className="block text-xs font-normal text-ink-muted">{p.no_transaksi}</span>
                        )}
                      </td>
                      <td className="td text-sm text-ink-soft">{tanggal(p.tanggal)}</td>
                      <td className="td text-sm">
                        {p.jatuh_tempo ? (
                          <span className={isJatuhTempo(p) ? "inline-flex items-center gap-1 text-danger" : "text-ink-soft"}>
                            {isJatuhTempo(p) && <CalendarClock className="h-3.5 w-3.5" />}
                            {tanggal(p.jatuh_tempo)}
                          </span>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="td num text-right">{rupiah(p.nominal)}</td>
                      <td className="td num text-right font-semibold">{rupiah(p.sisa)}</td>
                      <td className="td text-right">
                        <Badge tone={p.status === "lunas" ? "ok" : isJatuhTempo(p) ? "danger" : "warn"}>
                          {p.status === "lunas" ? "Lunas" : isJatuhTempo(p) ? "Jatuh Tempo" : "Belum Lunas"}
                        </Badge>
                      </td>
                      <td className="td text-right">
                        <Button size="sm" variant={p.status === "lunas" ? "ghost" : "outline"} onClick={() => setDetail(p)}>
                          {p.status === "lunas" ? "Detail" : "Catat Bayar"}
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

      {detail && <DetailPiutangModal piutang={detail} onClose={() => setDetail(null)} onSaved={() => toast("Pembayaran dicatat", "success")} />}
    </div>
  )
}

function DetailPiutangModal({ piutang, onClose, onSaved }: { piutang: Piutang; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const riwayat = usePembayaranPiutang(piutang.id)
  const bayar = useCatatPembayaranPiutang()
  const detailTrx = useDetailTransaksi(piutang.transaksi_id)
  const [nominal, setNominal] = useState("")

  async function submit() {
    const n = Number(nominal)
    if (!n || n <= 0) return
    if (n > piutang.sisa) {
      toast("Nominal melebihi sisa piutang", "error")
      return
    }
    try {
      await bayar.mutateAsync({ piutang_id: piutang.id, nominal: n })
      onSaved()
      onClose()
    } catch {
      toast("Gagal mencatat pembayaran", "error")
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Piutang — ${piutang.nama_pelanggan}`}
      footer={
        piutang.status === "belum_lunas" ? (
          <>
            <Button variant="outline" onClick={onClose}>Tutup</Button>
            <Button
                onClick={() => {
                  if (!confirm(`Catat pembayaran sebesar Rp${nominal} dari ${piutang.nama_pelanggan}?`)) return
                  submit()
                }}
              loading={bayar.isPending}
              disabled={!nominal}
            >
              Catat Pembayaran
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        )
      }
    >
      <div className="space-y-4">
        {piutang.no_transaksi && (
          <div className="flex items-center justify-between rounded-md bg-surface-sunken px-3 py-2 text-sm">
            <span className="text-ink-muted">No. Transaksi</span>
            <span className="font-medium">{piutang.no_transaksi}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <Info label="Nominal awal" value={rupiah(piutang.nominal)} />
          <Info label="Sisa" value={rupiah(piutang.sisa)} strong />
          <Info label="Tanggal" value={tanggal(piutang.tanggal)} />
          <Info label="Jatuh tempo" value={piutang.jatuh_tempo ? tanggal(piutang.jatuh_tempo) : "-"} />
        </div>

        {/* Rincian pesanan (barang yang dibeli) */}
        <div>
          <p className="mb-2 text-sm font-semibold">Rincian Pesanan</p>
          {!piutang.transaksi_id ? (
            <p className="text-sm text-ink-muted">Transaksi tidak tertaut.</p>
          ) : detailTrx.isLoading ? (
            <InlineLoader label="Memuat rincian..." />
          ) : detailTrx.data && detailTrx.data.items.length > 0 ? (
            <ul className="divide-y divide-line rounded-md border border-line">
              {detailTrx.data.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{it.barang?.nama ?? "(barang dihapus)"}</p>
                    <p className="text-xs text-ink-muted">
                      {angka(it.qty)} {it.barang?.satuan ?? ""} × {rupiah(it.harga_jual)}
                    </p>
                  </div>
                  <span className="num shrink-0 font-medium">{rupiah(it.subtotal)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Tidak ada rincian item.</p>
          )}
        </div>

        {piutang.catatan && (
          <div className="rounded-md border border-line px-3 py-2 text-sm">
            <p className="text-xs text-ink-muted">Catatan transaksi</p>
            <p className="whitespace-pre-wrap">{piutang.catatan}</p>
          </div>
        )}

        {piutang.status === "belum_lunas" && (
          <div className="space-y-2 rounded-md border border-line p-3">
            <Input label="Nominal pembayaran / cicilan" type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="0" />
            <div className="flex gap-2">
              <button onClick={() => setNominal(String(piutang.sisa))} className="rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken">
                Lunasi ({rupiah(piutang.sisa)})
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Riwayat Pembayaran</p>
          {riwayat.isLoading ? (
            <InlineLoader label="Memuat..." />
          ) : riwayat.data && riwayat.data.length > 0 ? (
            <ul className="divide-y divide-line rounded-md border border-line">
              {riwayat.data.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-ink-muted">{tanggal(r.tanggal)}</span>
                  <span className="num font-medium">{rupiah(r.nominal)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Belum ada pembayaran.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}

function Info({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md bg-surface-sunken px-3 py-2">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`num ${strong ? "font-bold text-ink" : "font-medium"}`}>{value}</p>
    </div>
  )
}