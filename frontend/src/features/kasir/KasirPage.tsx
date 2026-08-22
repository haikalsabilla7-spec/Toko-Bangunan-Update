import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, Trash2, Plus, Minus, ShoppingCart, Search, Flame } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { useToast } from "@/components/ui/Toast"
import { CameraScanner } from "@/components/barcode/CameraScanner"
import { rupiah, angka } from "@/lib/format"
import { cn } from "@/lib/cn"
import { cariBarangByKode, useBarangList, useKategori } from "@/features/barang/api"
import { useAuth } from "@/features/auth/AuthProvider"
import { useKeranjang } from "./useKeranjang"
import { useSimpanTransaksi, useBarangLaris } from "./api"
import { PembayaranModal } from "./PembayaranModal"
import type { Barang } from "@/types/database"

export default function KasirPage() {
  const toast = useToast()
  const { profil } = useAuth()
  const cart = useKeranjang()
  const simpan = useSimpanTransaksi()
  const { data: semuaBarang } = useBarangList()
  const { data: kategori } = useKategori()
  const { data: larisIds = [] } = useBarangLaris()

  const [query, setQuery] = useState("")
  const [scanOpen, setScanOpen] = useState(false)
  const [bayarOpen, setBayarOpen] = useState(false)
  const [mencari, setMencari] = useState(false)
  const [katAktif, setKatAktif] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus field scan agar scanner Bluetooth langsung tertangkap.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Saran pencarian manual (nama/kode) untuk barang tanpa barcode.
  const saran = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2 || !semuaBarang) return []
    return semuaBarang
      .filter(
        (b) =>
          b.nama.toLowerCase().includes(q) ||
          b.kode.toLowerCase().includes(q) ||
          (b.barcode ?? "").includes(q),
      )
      .slice(0, 8)
  }, [query, semuaBarang])

  // Barang untuk grid tombol cepat (kategori / laris) — untuk barang tanpa barcode.
  const gridBarang = useMemo(() => {
    const list = semuaBarang ?? []
    if (katAktif === "laris") {
      const byId = new Map(list.map((b) => [b.id, b]))
      return larisIds.map((id) => byId.get(id)).filter(Boolean) as typeof list
    }
    const out = katAktif ? list.filter((b) => b.kategori_id === katAktif) : list
    return [...out].sort((a, b) => a.nama.localeCompare(b.nama))
  }, [semuaBarang, katAktif, larisIds])

  async function prosesKode(kode: string) {
    if (!kode.trim()) return
    setMencari(true)
    try {
      const b = await cariBarangByKode(kode.trim())
      if (!b) {
        toast(`Barang \"${kode}\" tidak ditemukan`, "error")
        return
      }
      if (b.stok <= 0) {
        toast(`Stok ${b.nama} habis`, "error")
        return
      }
      cart.tambah(b)
      setQuery("")
      inputRef.current?.focus()
    } catch {
      toast("Gagal mencari barang", "error")
    } finally {
      setMencari(false)
    }
  }

  function pilihSaran(b: Barang) {
    if (b.stok <= 0) {
      toast(`Stok ${b.nama} habis`, "error")
      return
    }
    cart.tambah(b)
    setQuery("")
    inputRef.current?.focus()
  }

  function onSubmitScan(e: React.FormEvent) {
    e.preventDefault()
    // Enter dari scanner BT atau ketik manual
    if (saran.length === 1) pilihSaran(saran[0]!)
    else prosesKode(query)
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* Kolom kiri: scan + saran */}
      <section className="flex flex-1 flex-col border-r border-line bg-surface-sunken">
        <div className="border-b border-line bg-surface p-3">
          <form onSubmit={onSubmitScan}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Scan barcode atau ketik nama/kode barang..."
                autoComplete="off"
                className="h-14 w-full rounded-md border border-line-strong bg-surface pl-11 pr-28 text-base focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                onClick={() => setScanOpen(true)}
                className="absolute right-2 top-1/2 flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-sm font-medium hover:bg-surface-sunken"
              >
                <Camera className="h-4 w-4" /> Kamera
              </button>
            </div>
          </form>
          <p className="mt-1.5 text-xs text-ink-muted">
            Field aktif otomatis — arahkan scanner Bluetooth lalu tekan Enter. Tanpa mouse pun bisa.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {query.trim().length >= 2 ? (
            saran.length > 0 ? (
              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
                {saran.map((b) => (
                  <li key={b.id}>
                    <button
                      onClick={() => pilihSaran(b)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-accent-soft"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.nama}</p>
                        <p className="text-xs text-ink-muted">
                          {b.kode} · stok {angka(b.stok)} {b.satuan}
                        </p>
                      </div>
                      <span className="num shrink-0 text-sm font-semibold">{rupiah(b.harga_jual)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-ink-muted">
                Tidak ada barang cocok dengan “{query}”
              </p>
            )
          ) : (
            <div>
              {/* Tombol cepat: kategori + barang laris (untuk barang tanpa barcode) */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {larisIds.length > 0 && (
                  <ChipCat active={katAktif === "laris"} onClick={() => setKatAktif("laris")}>
                    <Flame className="h-3.5 w-3.5" /> Laris
                  </ChipCat>
                )}
                <ChipCat active={katAktif === ""} onClick={() => setKatAktif("")}>
                  Semua
                </ChipCat>
                {kategori?.map((k) => (
                  <ChipCat key={k.id} active={katAktif === k.id} onClick={() => setKatAktif(k.id)}>
                    {k.nama}
                  </ChipCat>
                ))}
              </div>
              {gridBarang.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-muted">
                  Belum ada barang untuk ditampilkan.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {gridBarang.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => pilihSaran(b)}
                      disabled={b.stok <= 0}
                      className={cn(
                        "flex h-full flex-col rounded-md border bg-surface p-2.5 text-left transition-colors",
                        b.stok <= 0
                          ? "border-line-strong opacity-40"
                          : "border-line-strong hover:border-accent hover:bg-accent-soft",
                      )}
                    >
                      <span className="text-sm font-medium leading-snug">{b.nama}</span>
                      <span className="num mt-auto pt-1 text-sm font-semibold text-accent">
                        {rupiah(b.harga_jual)}
                      </span>
                      <span className="text-2xs text-ink-muted">
                        stok {angka(b.stok)} {b.satuan}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Kolom kanan: keranjang */}
      <section className="flex w-full flex-col bg-surface lg:w-[440px]">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-accent" />
            <h2 className="font-grotesk text-base font-semibold">Keranjang</h2>
            {cart.jumlahItem > 0 && <Badge tone="accent">{angka(cart.jumlahItem)} item</Badge>}
          </div>
          {cart.items.length > 0 && (
            <button onClick={cart.kosongkan} className="text-sm text-ink-muted hover:text-danger">
              Kosongkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-muted">
              Keranjang kosong. Mulai scan barang untuk menambahkan.
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {cart.items.map((it) => (
                <li key={it.barang_id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{it.nama}</p>
                      <p className="text-xs text-ink-muted">{it.kode}</p>
                    </div>
                    <button
                      onClick={() => cart.hapus(it.barang_id)}
                      className="rounded-md p-1 text-ink-muted hover:bg-danger-soft hover:text-danger"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {/* Qty stepper */}
                    <div className="flex items-center rounded-md border border-line-strong">
                      <button
                        onClick={() => cart.ubahQty(it.barang_id, Math.max(it.qty - 1, 0))}
                        className="flex h-9 w-9 items-center justify-center hover:bg-surface-sunken"
                        aria-label="Kurangi"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={it.qty}
                        onChange={(e) => cart.ubahQty(it.barang_id, Number(e.target.value))}
                        className="num h-9 w-14 border-x border-line-strong text-center text-sm focus:outline-none"
                      />
                      <button
                        onClick={() => cart.ubahQty(it.barang_id, it.qty + 1)}
                        className="flex h-9 w-9 items-center justify-center hover:bg-surface-sunken"
                        aria-label="Tambah"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Override harga */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-ink-muted">Rp</span>
                      <input
                        type="number"
                        value={it.harga_jual}
                        onChange={(e) => cart.overrideHarga(it.barang_id, Number(e.target.value))}
                        className={cn(
                          "num h-9 w-28 rounded-md border px-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-accent/30",
                          it.harga_jual !== it.harga_jual_asli
                            ? "border-accent bg-accent-soft"
                            : "border-line-strong",
                        )}
                      />
                    </div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    {it.harga_jual !== it.harga_jual_asli ? (
                      <span className="text-accent">Harga diubah dari {rupiah(it.harga_jual_asli)}</span>
                    ) : (
                      <span className="text-ink-muted">
                        {angka(it.qty)} {it.satuan} × {rupiah(it.harga_jual)}
                      </span>
                    )}
                    <span className="num font-semibold">{rupiah(it.qty * it.harga_jual)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer total + bayar */}
        <div className="border-t border-line p-4">
          <div className="mb-3 flex items-end justify-between">
            <span className="text-sm text-ink-muted">Total</span>
            <span className="num font-grotesk text-2xl font-bold text-ink">{rupiah(cart.total)}</span>
          </div>
          <Button
            size="lg"
            className="w-full"
            disabled={cart.items.length === 0 || cart.items.some((i) => i.qty <= 0)}
            onClick={() => setBayarOpen(true)}
          >
            Bayar · {rupiah(cart.total)}
          </Button>
        </div>
      </section>

      <CameraScanner open={scanOpen} onClose={() => setScanOpen(false)} onDetected={prosesKode} />

      <PembayaranModal
        open={bayarOpen}
        onClose={() => setBayarOpen(false)}
        items={cart.items}
        total={cart.total}
        kasirNama={profil?.nama ?? "Kasir"}
        saving={simpan.isPending}
        onConfirm={async (payload) => {
          try {
            const hasil = await simpan.mutateAsync({
              metode_bayar: payload.metode_bayar,
              catatan: payload.catatan,
              nama_pelanggan: payload.nama_pelanggan,
              jatuh_tempo: payload.jatuh_tempo,
              items: cart.items.map((i) => ({
                barang_id: i.barang_id,
                qty: i.qty,
                harga_jual: i.harga_jual,
                harga_beli_saat_jual: i.harga_beli_saat_jual,
                subtotal: i.qty * i.harga_jual,
              })),
            })
            toast(`Transaksi ${hasil.no_transaksi} tersimpan`, "success")
            cart.kosongkan()
            setBayarOpen(false)
            inputRef.current?.focus()
            return hasil
          } catch (err) {
            toast(err instanceof Error ? err.message : "Gagal menyimpan transaksi", "error")
            throw err
          }
        }}
      />

      {mencari && <div className="sr-only">Mencari...</div>}
    </div>
  )
}

function ChipCat({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-accent bg-accent text-white"
          : "border-line-strong bg-surface text-ink-soft hover:bg-surface-sunken",
      )}
    >
      {children}
    </button>
  )
}
