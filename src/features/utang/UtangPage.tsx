import { useMemo, useState } from "react"
import { ReceiptText, Plus, CalendarClock } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { useToast } from "@/components/ui/Toast"
import { rupiah, tanggal } from "@/lib/format"
import type { Utang } from "@/types/database"
import { useUtangList, useSimpanUtang, usePembayaranUtang, useCatatPembayaranUtang } from "./api"

export default function UtangPage() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useUtangList()
  const simpan = useSimpanUtang()
  const [tambahOpen, setTambahOpen] = useState(false)
  const [detail, setDetail] = useState<Utang | null>(null)

  // form tambah
  const [supplier, setSupplier] = useState("")
  const [nominal, setNominal] = useState("")
  const [jatuhTempo, setJatuhTempo] = useState("")
  const [catatan, setCatatan] = useState("")

  const totalBelum = (data ?? [])
    .filter((u) => u.status === "belum_lunas")
    .reduce((s, u) => s + Number(u.sisa), 0)

  function isJatuhTempo(u: Utang) {
    return u.status === "belum_lunas" && u.jatuh_tempo && new Date(u.jatuh_tempo) < new Date()
  }

  async function submitTambah() {
    if (!supplier.trim() || !nominal) return
    try {
      await simpan.mutateAsync({
        supplier: supplier.trim(),
        nominal: Number(nominal),
        jatuh_tempo: jatuhTempo || null,
        catatan: catatan.trim() || null,
      })
      toast("Utang dicatat", "success")
      setTambahOpen(false)
      setSupplier(""); setNominal(""); setJatuhTempo(""); setCatatan("")
    } catch {
      toast("Gagal mencatat utang", "error")
    }
  }

  return (
    <div>
      <PageHeader
        title="Utang"
        description="Kewajiban toko kepada supplier."
        actions={
          <Button onClick={() => setTambahOpen(true)}>
            <Plus className="h-4 w-4" /> Catat Utang
          </Button>
        }
      />
      <div className="space-y-3 p-4 sm:p-6">
        <div className="card p-4 sm:max-w-xs">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Utang Belum Lunas</p>
          <p className="num mt-1 font-grotesk text-xl font-bold text-danger">{rupiah(totalBelum)}</p>
        </div>

        <Card className="overflow-hidden">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <InlineLoader />
          ) : (data ?? []).length === 0 ? (
            <EmptyState icon={<ReceiptText className="h-8 w-8" />} title="Belum ada utang" description="Catat utang ke supplier saat pembelian tempo." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">Supplier</th>
                    <th className="th">Tanggal</th>
                    <th className="th">Jatuh Tempo</th>
                    <th className="th text-right">Nominal</th>
                    <th className="th text-right">Sisa</th>
                    <th className="th text-right">Status</th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((u) => (
                    <tr key={u.id} className="hover:bg-surface-sunken">
                      <td className="td font-medium">{u.supplier}</td>
                      <td className="td text-sm text-ink-soft">{tanggal(u.tanggal)}</td>
                      <td className="td text-sm">
                        {u.jatuh_tempo ? (
                          <span className={isJatuhTempo(u) ? "inline-flex items-center gap-1 text-danger" : "text-ink-soft"}>
                            {isJatuhTempo(u) && <CalendarClock className="h-3.5 w-3.5" />}
                            {tanggal(u.jatuh_tempo)}
                          </span>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="td num text-right">{rupiah(u.nominal)}</td>
                      <td className="td num text-right font-semibold">{rupiah(u.sisa)}</td>
                      <td className="td text-right">
                        <Badge tone={u.status === "lunas" ? "ok" : isJatuhTempo(u) ? "danger" : "warn"}>
                          {u.status === "lunas" ? "Lunas" : isJatuhTempo(u) ? "Jatuh Tempo" : "Belum Lunas"}
                        </Badge>
                      </td>
                      <td className="td text-right">
                        <Button size="sm" variant={u.status === "lunas" ? "ghost" : "outline"} onClick={() => setDetail(u)}>
                          {u.status === "lunas" ? "Detail" : "Catat Bayar"}
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

      <Modal
        open={tambahOpen}
        onClose={() => setTambahOpen(false)}
        title="Catat Utang ke Supplier"
        footer={
          <>
            <Button variant="outline" onClick={() => setTambahOpen(false)}>Batal</Button>
            <Button onClick={submitTambah} loading={simpan.isPending} disabled={!supplier.trim() || !nominal}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="mis. PT Sumber Baja" />
          <Input label="Nominal utang" type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} />
          <Input label="Jatuh tempo" type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} />
          <Input label="Catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </div>
      </Modal>

      {detail && <DetailUtangModal utang={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function DetailUtangModal({ utang, onClose }: { utang: Utang; onClose: () => void }) {
  const toast = useToast()
  const riwayat = usePembayaranUtang(utang.id)
  const bayar = useCatatPembayaranUtang()
  const [nominal, setNominal] = useState("")

  async function submit() {
    const n = Number(nominal)
    if (!n || n <= 0) return
    if (n > utang.sisa) {
      toast("Nominal melebihi sisa utang", "error")
      return
    }
    try {
      await bayar.mutateAsync({ utang_id: utang.id, nominal: n })
      toast("Pembayaran dicatat", "success")
      onClose()
    } catch {
      toast("Gagal mencatat pembayaran", "error")
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Utang — ${utang.supplier}`}
      footer={
        utang.status === "belum_lunas" ? (
          <>
            <Button variant="outline" onClick={onClose}>Tutup</Button>
            <Button onClick={submit} loading={bayar.isPending} disabled={!nominal}>Catat Pembayaran</Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md bg-surface-sunken px-3 py-2">
            <p className="text-xs text-ink-muted">Nominal awal</p>
            <p className="num font-medium">{rupiah(utang.nominal)}</p>
          </div>
          <div className="rounded-md bg-surface-sunken px-3 py-2">
            <p className="text-xs text-ink-muted">Sisa</p>
            <p className="num font-bold">{rupiah(utang.sisa)}</p>
          </div>
        </div>
        {utang.catatan && <p className="text-sm text-ink-soft">{utang.catatan}</p>}

        {utang.status === "belum_lunas" && (
          <div className="space-y-2 rounded-md border border-line p-3">
            <Input label="Nominal pembayaran / cicilan" type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} />
            <button onClick={() => setNominal(String(utang.sisa))} className="rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken">
              Lunasi ({rupiah(utang.sisa)})
            </button>
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
