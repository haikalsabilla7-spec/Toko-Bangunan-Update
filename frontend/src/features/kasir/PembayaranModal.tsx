import { useEffect, useMemo, useState } from "react"
import { Banknote, NotebookPen, Printer } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { rupiah } from "@/lib/format"
import { cn } from "@/lib/cn"
import { StrukThermal, type StrukData } from "@/components/print/StrukThermal"
import type { ItemKeranjang } from "./useKeranjang"
import type { HasilTransaksi } from "./api"
import type { MetodeBayar } from "@/types/database"

interface ConfirmPayload {
  metode_bayar: MetodeBayar
  catatan: string | null
  nama_pelanggan: string | null
  jatuh_tempo: string | null
}

export function PembayaranModal({
  open,
  onClose,
  items,
  total,
  kasirNama,
  saving,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  items: ItemKeranjang[]
  total: number
  kasirNama: string
  saving: boolean
  onConfirm: (payload: ConfirmPayload) => Promise<HasilTransaksi>
}) {
  const [metode, setMetode] = useState<MetodeBayar>("tunai")
  const [uangBayar, setUangBayar] = useState("")
  const [namaPelanggan, setNamaPelanggan] = useState("")
  const [jatuhTempo, setJatuhTempo] = useState("")
  const [catatan, setCatatan] = useState("")
  const [struk, setStruk] = useState<StrukData | null>(null)

  useEffect(() => {
    if (open) {
      setMetode("tunai")
      setUangBayar("")
      setNamaPelanggan("")
      setJatuhTempo("")
      setCatatan("")
      setStruk(null)
    }
  }, [open])

  const bayar = Number(uangBayar) || 0
  const kembali = useMemo(() => Math.max(bayar - total, 0), [bayar, total])
  const kurang = metode === "tunai" && bayar > 0 && bayar < total

  const uangPas = [total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000]
    .filter((v, i, arr) => v > 0 && arr.indexOf(v) === i)
    .slice(0, 3)

  async function handleConfirm() {
    const hasil = await onConfirm({
      metode_bayar: metode,
      catatan: catatan.trim() || null,
      nama_pelanggan: metode === "utang" ? namaPelanggan.trim() || "Pelanggan" : null,
      jatuh_tempo: metode === "utang" ? jatuhTempo || null : null,
    })
    // Siapkan data struk lalu cetak
    setStruk({
      no_transaksi: hasil.no_transaksi,
      tanggal: hasil.tanggal,
      kasir: kasirNama,
      metode_bayar: metode,
      items: items.map((i) => ({
        nama: i.nama,
        qty: i.qty,
        satuan: i.satuan,
        harga_jual: i.harga_jual,
        subtotal: i.qty * i.harga_jual,
      })),
      total,
      bayar: metode === "tunai" ? bayar : undefined,
      kembali: metode === "tunai" ? kembali : undefined,
      nama_pelanggan: metode === "utang" ? namaPelanggan : null,
      catatan: catatan.trim() || null,
    })
  }

  const valid = metode === "tunai" ? bayar >= total : namaPelanggan.trim().length > 0

  // Tampilan struk setelah tersimpan
  if (struk) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Transaksi Berhasil"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Selesai</Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Cetak Struk
            </Button>
          </>
        }
      >
        <div className="rounded-md border border-line bg-surface-sunken p-2">
          <StrukThermal data={struk} />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pembayaran"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>Batal</Button>
          <Button
            onClick={() => {
              if (metode === "utang") {
                const nama = namaPelanggan.trim() || "Pelanggan"
                if (!confirm(`Simpan sebagai UTANG atas nama "${nama}"? Piutang akan otomatis dibuat.`)) return
              }
              handleConfirm()
            }}
            loading={saving}
            disabled={!valid || saving}
          >
            Simpan Transaksi
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-md bg-ink px-4 py-3 text-white">
          <span className="text-sm text-white/70">Total Tagihan</span>
          <span className="num font-grotesk text-2xl font-bold">{rupiah(total)}</span>
        </div>

        {/* Pilih metode */}
        <div className="grid grid-cols-2 gap-2">
          {([
            { v: "tunai", label: "Tunai", icon: Banknote },
            { v: "utang", label: "Utang", icon: NotebookPen },
          ] as const).map((m) => (
            <button
              key={m.v}
              onClick={() => setMetode(m.v)}
              className={cn(
                "flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-sm font-medium",
                metode === m.v
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line-strong text-ink-soft hover:bg-surface-sunken",
              )}
            >
              <m.icon className="h-5 w-5" />
              {m.label}
            </button>
          ))}
        </div>

        {metode === "tunai" ? (
          <div className="space-y-2">
            <Input
              label="Uang diterima"
              type="number"
              inputMode="numeric"
              value={uangBayar}
              onChange={(e) => setUangBayar(e.target.value)}
              placeholder="0"
              error={kurang ? "Uang kurang dari total" : undefined}
            />
            <div className="flex flex-wrap gap-2">
              {uangPas.map((v) => (
                <button
                  key={v}
                  onClick={() => setUangBayar(String(v))}
                  className="rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken"
                >
                  {rupiah(v)}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-md bg-surface-sunken px-3 py-2">
              <span className="text-sm text-ink-soft">Kembalian</span>
              <span className="num text-lg font-semibold text-ok">{rupiah(kembali)}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              label="Nama pelanggan"
              value={namaPelanggan}
              onChange={(e) => setNamaPelanggan(e.target.value)}
              placeholder="mis. Pak Budi / CV Karya"
            />
            <Input
              label="Jatuh tempo"
              type="date"
              value={jatuhTempo}
              onChange={(e) => setJatuhTempo(e.target.value)}
              hint="Piutang otomatis dibuat dengan sisa = total."
            />
          </div>
        )}

        <Input
          label="Catatan (opsional)"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="mis. antar ke proyek"
        />
      </div>
    </Modal>
  )
}
