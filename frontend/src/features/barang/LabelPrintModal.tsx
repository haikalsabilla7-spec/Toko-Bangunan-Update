import { Printer } from "lucide-react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { BarcodeLabel } from "@/components/barcode/BarcodeLabel"
import type { BarangWithKategori } from "@/types/database"

export function LabelPrintModal({
  open,
  onClose,
  barang,
}: {
  open: boolean
  onClose: () => void
  barang: BarangWithKategori | null
}) {
  if (!barang) return null
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cetak Label Barcode"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Cetak
          </Button>
        </>
      }
    >
      <div className="flex justify-center rounded-md bg-surface-sunken p-4">
        <div className="print-area">
          <BarcodeLabel barang={barang} />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-ink-muted">
        {barang.barcode ? "Barcode EAN-13" : "Barcode Code-128 dari kode barang"}
      </p>
    </Modal>
  )
}
