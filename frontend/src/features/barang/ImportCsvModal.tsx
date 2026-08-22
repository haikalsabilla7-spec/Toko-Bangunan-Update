import { useMemo, useState } from "react"
import { Upload, FileDown, CheckCircle2, AlertTriangle } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { useToast } from "@/components/ui/Toast"
import { parseBarangCsv, CSV_TEMPLATE, type ParsedRow } from "./csv"
import { useImportBarang, useKategori } from "./api"

export function ImportCsvModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const { data: kategori } = useKategori()
  const importBarang = useImportBarang()
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null)

  const kategoriMap = useMemo(() => {
    const m = new Map<string, string>()
    kategori?.forEach((k) => m.set(k.nama.toLowerCase(), k.id))
    return m
  }, [kategori])

  const valid = parsed?.filter((r) => r.data) ?? []
  const invalid = parsed?.filter((r) => r.error) ?? []

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const { rows } = parseBarangCsv(String(reader.result), kategoriMap)
      setParsed(rows)
    }
    reader.readAsText(file)
  }

  function unduhTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "template-barang.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  async function prosesImport() {
    if (valid.length === 0) return
    try {
      const n = await importBarang.mutateAsync(valid.map((r) => r.data!))
      toast(`${n} barang berhasil diimpor`, "success")
      setParsed(null)
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal impor", "error")
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Barang Massal (CSV)"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={unduhTemplate}>
            <FileDown className="h-4 w-4" /> Unduh Template
          </Button>
          <Button
            onClick={prosesImport}
            loading={importBarang.isPending}
            disabled={valid.length === 0}
          >
            Import {valid.length > 0 ? `${valid.length} barang` : ""}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Unggah file CSV dengan kolom: <code className="rounded bg-surface-sunken px-1 text-xs">kode, nama, kategori, satuan, harga_beli, harga_jual, stok, barcode</code>.
          Baris dengan kode yang sudah ada akan diperbarui.
        </p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-surface-sunken py-8 text-center hover:border-accent">
          <Upload className="h-6 w-6 text-ink-muted" />
          <span className="text-sm font-medium">Pilih file CSV</span>
          <span className="text-xs text-ink-muted">atau seret ke sini</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>

        {parsed && (
          <div className="space-y-2">
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1 text-ok">
                <CheckCircle2 className="h-4 w-4" /> {valid.length} valid
              </span>
              {invalid.length > 0 && (
                <span className="flex items-center gap-1 text-danger">
                  <AlertTriangle className="h-4 w-4" /> {invalid.length} bermasalah
                </span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-line">
              <table className="w-full">
                <thead className="sticky top-0 bg-surface-sunken">
                  <tr>
                    <th className="th">Baris</th>
                    <th className="th">Kode</th>
                    <th className="th">Nama</th>
                    <th className="th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, i) => (
                    <tr key={i}>
                      <td className="td num">{r.row}</td>
                      <td className="td font-mono text-xs">{r.data?.kode ?? "-"}</td>
                      <td className="td">{r.data?.nama ?? "-"}</td>
                      <td className="td text-xs">
                        {r.error ? (
                          <span className="text-danger">{r.error}</span>
                        ) : (
                          <span className="text-ok">Siap</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
