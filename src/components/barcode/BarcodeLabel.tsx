import { useEffect, useRef } from "react"
import { rupiah } from "@/lib/format"
import type { Barang } from "@/types/database"

/**
 * Render 1 label barcode (nama + barcode + harga) siap cetak.
 * Barcode digambar di <canvas> resolusi tinggi (scale besar) lalu ditampilkan
 * pada lebar tetap (mm) via CSS, sehingga hasil cetak tajam & tidak terpotong.
 */
export function BarcodeLabel({
  barang,
}: {
  barang: Pick<Barang, "nama" | "kode" | "barcode" | "harga_jual">
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const value = barang.barcode || barang.kode

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    const opts = {
      text: value,
      scale: 4, // resolusi tinggi -> hasil cetak tajam
      height: 12, // tinggi bar (relatif scale)
      includetext: true,
      textxalign: "center" as const,
      textsize: 9,
      paddingwidth: 10,
      paddingheight: 4,
      backgroundcolor: "FFFFFF",
    }
    // Lazy-load bwip-js hanya saat label dibutuhkan (hemat bundle awal).
    import("bwip-js")
      .then((mod) => {
        if (cancelled) return
        const bwipjs = (mod as any).default ?? mod
        try {
          bwipjs.toCanvas(canvas, { bcid: barang.barcode ? "ean13" : "code128", ...opts })
        } catch {
          // fallback ke code128 bila EAN-13 tidak valid
          try {
            bwipjs.toCanvas(canvas, { bcid: "code128", ...opts })
          } catch {
            /* abaikan */
          }
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [value, barang.barcode])

  return (
    <div className="barcode-label">
      <p className="barcode-label__nama">{barang.nama}</p>
      <canvas ref={canvasRef} className="barcode-label__code" />
      <p className="barcode-label__harga">{rupiah(barang.harga_jual)}</p>
    </div>
  )
}
