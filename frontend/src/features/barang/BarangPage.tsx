import { useMemo, useState } from "react"
import { Plus, Search, Pencil, Trash2, Barcode, Upload, ArrowUpDown } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { InlineLoader } from "@/components/ui/Loader"
import { ErrorState, EmptyState } from "@/components/ui/State"
import { useToast } from "@/components/ui/Toast"
import { rupiah, angka } from "@/lib/format"
import { BATAS_STOK_MENIPIS, type BarangWithKategori } from "@/types/database"
import { useAuth } from "@/features/auth/AuthProvider"
import { useBarangList, useHapusBarang, useKategori } from "./api"
import { BarangForm } from "./BarangForm"
import { ImportCsvModal } from "./ImportCsvModal"
import { LabelPrintModal } from "./LabelPrintModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type SortKey = "nama" | "stok" | "harga_jual"

export default function BarangPage() {
  const toast = useToast()
  const { isPemilik } = useAuth()
  const { data, isLoading, isError, refetch } = useBarangList()
  const { data: kategori } = useKategori()
  const hapus = useHapusBarang()

  const [q, setQ] = useState("")
  const [katFilter, setKatFilter] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("nama")
  const [sortAsc, setSortAsc] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BarangWithKategori | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [labelBarang, setLabelBarang] = useState<BarangWithKategori | null>(null)
  const [hapusTarget, setHapusTarget] = useState<BarangWithKategori | null>(null)

  const rows = useMemo(() => {
    let list = data ?? []
    const term = q.trim().toLowerCase()
    if (term) {
      list = list.filter(
        (b) =>
          b.nama.toLowerCase().includes(term) ||
          b.kode.toLowerCase().includes(term) ||
          (b.barcode ?? "").includes(term),
      )
    }
    if (katFilter) list = list.filter((b) => b.kategori_id === katFilter)
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === "nama") cmp = a.nama.localeCompare(b.nama)
      else cmp = Number(a[sortKey]) - Number(b[sortKey])
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [data, q, katFilter, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

    async function konfirmasiHapus() {
    if (!hapusTarget) return
    try {
      await hapus.mutateAsync(hapusTarget.id)
      toast("Barang dihapus", "success")
    } catch {
      toast("Gagal menghapus. Hanya pemilik yang boleh hapus data master.", "error")
    } finally {
      setHapusTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Master Barang"
        description={`${data?.length ?? 0} jenis barang terdaftar`}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus className="h-4 w-4" /> Tambah Barang
            </Button>
          </>
        }
      />

      <div className="space-y-3 p-4 sm:p-6">
        {/* Toolbar cari + filter */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama, kode, atau barcode..."
              className="input-base pl-9"
            />
          </div>
          <select
            value={katFilter}
            onChange={(e) => setKatFilter(e.target.value)}
            className="input-base sm:w-56"
          >
            <option value="">Semua kategori</option>
            {kategori?.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>

        <div className="card overflow-hidden">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <InlineLoader />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Tidak ada barang"
              description="Ubah kata kunci pencarian atau tambah barang baru."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">Kode</th>
                    <th className="th">
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort("nama")}>
                        Nama <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="th">Kategori</th>
                    <th className="th text-right">
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort("stok")}>
                        Stok <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="th text-right">
                      <button className="inline-flex items-center gap-1" onClick={() => toggleSort("harga_jual")}>
                        Harga Jual <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-sunken">
                      <td className="td font-mono text-xs text-ink-muted">{b.kode}</td>
                      <td className="td">
                        <div className="font-medium">{b.nama}</div>
                        {b.barcode && <div className="text-2xs text-ink-muted">{b.barcode}</div>}
                      </td>
                      <td className="td text-sm text-ink-soft">{b.kategori?.nama ?? "-"}</td>
                      <td className="td num text-right">
                        <span className={b.stok <= BATAS_STOK_MENIPIS ? "font-semibold text-warn" : ""}>
                          {angka(b.stok)}
                        </span>
                        <span className="text-ink-muted"> {b.satuan}</span>
                      </td>
                      <td className="td num text-right font-medium">{rupiah(b.harga_jual)}</td>
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn title="Cetak label" onClick={() => setLabelBarang(b)}>
                            <Barcode className="h-4 w-4" />
                          </IconBtn>
                          <IconBtn
                            title="Edit"
                            onClick={() => {
                              setEditing(b)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </IconBtn>
                          {isPemilik && (
                            <IconBtn title="Hapus" danger onClick={() => setHapusTarget(b)}>
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

            <ConfirmDialog
        open={!!hapusTarget}
        onClose={() => setHapusTarget(null)}
        onConfirm={konfirmasiHapus}
        title="Hapus Barang"
        danger
        loading={hapus.isPending}
        confirmLabel="Ya, Hapus"
        message={
          <>
            Yakin ingin menghapus <b>{hapusTarget?.nama}</b>? Tindakan ini tidak bisa
            dibatalkan.
          </>
        }
      />

      <BarangForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
      <ImportCsvModal open={importOpen} onClose={() => setImportOpen(false)} />
      <LabelPrintModal open={!!labelBarang} onClose={() => setLabelBarang(null)} barang={labelBarang} />
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-md border border-line-strong hover:bg-surface-sunken ${
        danger ? "text-danger hover:bg-danger-soft" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  )
}
