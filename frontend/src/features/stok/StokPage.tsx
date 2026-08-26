import { useMemo, useState } from "react"
import { PackagePlus, SlidersHorizontal, ArrowDownRight, ArrowUpRight } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardHeader } from "@/components/ui/Card"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { useToast } from "@/components/ui/Toast"
import { angka, tanggalJam } from "@/lib/format"
import { BATAS_STOK_MENIPIS } from "@/types/database"
import { useBarangList } from "@/features/barang/api"
import { useRiwayatStok, useCatatStokMasuk, useCatatPenyesuaian } from "./api"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function StokPage() {
  const toast = useToast()
  const { data: barang } = useBarangList()
  const riwayat = useRiwayatStok()
  const stokMasuk = useCatatStokMasuk()
  const penyesuaian = useCatatPenyesuaian()

  const [masukOpen, setMasukOpen] = useState(false)
  const [opnameOpen, setOpnameOpen] = useState(false)
  const [konfirmasiOpname, setKonfirmasiOpname] = useState(false)

  // form stok masuk
  const [mBarang, setMBarang] = useState("")
  const [mQty, setMQty] = useState("")
  const [mHarga, setMHarga] = useState("")
  const [mSupplier, setMSupplier] = useState("")

  // form opname
  const [oBarang, setOBarang] = useState("")
  const [oFisik, setOFisik] = useState("")
  const [oAlasan, setOAlasan] = useState("Stok opname")

  const menipis = useMemo(
    () => (barang ?? []).filter((b) => b.stok <= BATAS_STOK_MENIPIS),
    [barang],
  )
  const barangTerpilihOpname = barang?.find((b) => b.id === oBarang)
  const selisih = barangTerpilihOpname ? Number(oFisik || 0) - barangTerpilihOpname.stok : 0

  async function submitMasuk() {
    if (!mBarang || !mQty) return
    try {
      await stokMasuk.mutateAsync({
        barang_id: mBarang,
        qty: Number(mQty),
        harga_beli: Number(mHarga) || 0,
        supplier: mSupplier.trim() || null,
        catatan: null,
      })
      toast("Stok masuk dicatat", "success")
      setMasukOpen(false)
      setMBarang(""); setMQty(""); setMHarga(""); setMSupplier("")
    } catch {
      toast("Gagal mencatat stok masuk", "error")
    }
  }

  async function submitOpname() {
    if (!oBarang || oFisik === "") return
    try {
      await penyesuaian.mutateAsync({
        barang_id: oBarang,
        qty_perubahan: selisih,
        alasan: oAlasan.trim() || "Penyesuaian stok",
      })
      toast("Penyesuaian stok disimpan", "success")
      setKonfirmasiOpname(false)
      setOpnameOpen(false)
      setOBarang(""); setOFisik(""); setOAlasan("Stok opname")
    } catch {
      toast("Gagal menyimpan penyesuaian", "error")
    }
  }

return (
  <div className="flex h-full flex-col">
    <PageHeader
      title="Stok"
      description="Catat barang masuk, opname, dan pantau pergerakan stok."
      actions={
        <>
          <Button variant="outline" onClick={() => setOpnameOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" /> Penyesuaian
          </Button>
          <Button onClick={() => setMasukOpen(true)}>
            <PackagePlus className="h-4 w-4" /> Stok Masuk
          </Button>
        </>
      }
    />

    {/* Area tengah: SATU scroll di mobile, DUA panel scroll-sendiri di desktop */}
    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 xl:overflow-hidden">
      <div className="grid gap-4 xl:h-full xl:grid-cols-3">
        <Card className="flex flex-col xl:col-span-2 xl:min-h-0 xl:overflow-hidden">
          <CardHeader title="Riwayat Pergerakan Stok" subtitle="50 aktivitas terakhir" />
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {riwayat.isError ? (
              <ErrorState onRetry={() => riwayat.refetch()} />
            ) : riwayat.isLoading ? (
              <InlineLoader />
            ) : riwayat.data && riwayat.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-surface-sunken">
                    <tr>
                      <th className="th">Waktu</th>
                      <th className="th">Barang</th>
                      <th className="th">Jenis</th>
                      <th className="th text-right">Perubahan</th>
                      <th className="th">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.data.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-sunken">
                        <td className="td whitespace-nowrap text-xs text-ink-muted">{tanggalJam(r.tanggal)}</td>
                        <td className="td font-medium">{r.barang_nama}</td>
                        <td className="td">
                          <Badge tone={r.jenis === "masuk" ? "ok" : r.jenis === "penjualan" ? "neutral" : "warn"}>
                            {r.jenis}
                          </Badge>
                        </td>
                        <td className="td num text-right">
                          <span className={r.qty >= 0 ? "font-semibold text-ok" : "font-semibold text-danger"}>
                            <span className="inline-flex items-center gap-0.5">
                              {r.qty >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {angka(Math.abs(r.qty))}
                            </span>
                          </span>
                        </td>
                        <td className="td text-sm text-ink-soft">{r.keterangan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="Belum ada pergerakan" description="Catat stok masuk atau lakukan transaksi." />
            )}
          </div>
        </Card>

        <Card className="flex flex-col xl:min-h-0 xl:overflow-hidden">
          <CardHeader title="Alert Stok Menipis" subtitle={`Ambang batas ≤ ${BATAS_STOK_MENIPIS}`} />
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {menipis.length === 0 ? (
              <EmptyState title="Stok aman" description="Tidak ada barang menipis." />
            ) : (
              <ul className="divide-y divide-line">
                {menipis.map((b) => (
                  <li key={b.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{b.nama}</p>
                      <p className="text-xs text-ink-muted">{b.kode}</p>
                    </div>
                    <Badge tone={b.stok <= 0 ? "danger" : "warn"}>
                      {angka(b.stok)} {b.satuan}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>

    {/* Footer ringkasan — SELALU menempel di bawah, sama di semua ukuran */}
    <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line bg-surface px-4 py-2.5 text-xs text-ink-muted sm:px-6">
      <span>{angka(riwayat.data?.length ?? 0)} aktivitas ditampilkan</span>
      <span className="flex items-center gap-4">
        <span>{angka(menipis.length)} barang menipis</span>
        <span className="font-medium text-danger">
          {angka(menipis.filter((b) => b.stok <= 0).length)} stok habis
        </span>
      </span>
    </footer>

    {/* Modal stok masuk */}
    <Modal
      open={masukOpen}
      onClose={() => setMasukOpen(false)}
      title="Catat Stok Masuk"
      footer={
        <>
          <Button variant="outline" onClick={() => setMasukOpen(false)}>Batal</Button>
          <Button onClick={() => setKonfirmasiOpname(true)} disabled={!oBarang || oFisik === ""}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <BarangSelect barang={barang ?? []} value={mBarang} onChange={setMBarang} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Qty masuk" type="number" value={mQty} onChange={(e) => setMQty(e.target.value)} />
          <Input label="Harga beli / unit" type="number" value={mHarga} onChange={(e) => setMHarga(e.target.value)} />
        </div>
        <Input label="Supplier" value={mSupplier} onChange={(e) => setMSupplier(e.target.value)} placeholder="mis. PT Sumber Baja" />
        <p className="text-xs text-ink-muted">Stok barang akan bertambah otomatis setelah disimpan.</p>
      </div>
    </Modal>

    {/* Modal opname / penyesuaian */}
    <Modal
      open={opnameOpen}
      onClose={() => setOpnameOpen(false)}
      title="Penyesuaian Stok (Opname)"
      footer={
        <>
          <Button variant="outline" onClick={() => setOpnameOpen(false)}>Batal</Button>
          <Button onClick={submitMasuk} loading={stokMasuk.isPending} disabled={!mBarang || !mQty}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <BarangSelect barang={barang ?? []} value={oBarang} onChange={setOBarang} />
        {barangTerpilihOpname && (
          <div className="flex items-center justify-between rounded-md bg-surface-sunken px-3 py-2 text-sm">
            <span className="text-ink-muted">Stok sistem saat ini</span>
            <span className="num font-semibold">{angka(barangTerpilihOpname.stok)} {barangTerpilihOpname.satuan}</span>
          </div>
        )}
        <Input label="Stok fisik (hasil hitung)" type="number" value={oFisik} onChange={(e) => setOFisik(e.target.value)} />
        {barangTerpilihOpname && oFisik !== "" && (
          <div className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
            <span className="text-ink-muted">Selisih</span>
            <span className={selisih === 0 ? "num font-semibold" : selisih > 0 ? "num font-semibold text-ok" : "num font-semibold text-danger"}>
              {selisih > 0 ? "+" : ""}{angka(selisih)}
            </span>
          </div>
        )}
        <Input label="Alasan" value={oAlasan} onChange={(e) => setOAlasan(e.target.value)} placeholder="mis. barang rusak / selisih hitung" />
      </div>
    </Modal>

    <ConfirmDialog
      open={konfirmasiOpname}
      onClose={() => setKonfirmasiOpname(false)}
      onConfirm={submitOpname}
      title="Konfirmasi Penyesuaian Stok"
      danger
      loading={penyesuaian.isPending}
      confirmLabel="Ya, Sesuaikan"
      message={
        <>
          Stok <b>{barangTerpilihOpname?.nama}</b> akan diubah dengan selisih{" "}
          <b>{selisih > 0 ? "+" : ""}{selisih}</b>. Lanjutkan?
        </>
      }
    />
  </div>
)
}

function BarangSelect({
  barang,
  value,
  onChange,
}: {
  barang: { id: string; nama: string; kode: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-ink-soft">Barang</label>
      <select className="input-base" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Pilih barang —</option>
        {barang.map((b) => (
          <option key={b.id} value={b.id}>{b.nama} ({b.kode})</option>
        ))}
      </select>
    </div>
  )
}
