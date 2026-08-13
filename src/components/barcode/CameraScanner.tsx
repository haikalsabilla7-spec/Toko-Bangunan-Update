import { useEffect, useRef } from "react"
import type { Html5Qrcode } from "html5-qrcode"
import { Modal } from "@/components/ui/Modal"

/** Scan barcode via kamera tablet (html5-qrcode). Dipakai bila scanner BT tidak ada. */
export function CameraScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean
  onClose: () => void
  onDetected: (code: string) => void
}) {
  const regionId = useRef(`scan-${Math.random().toString(36).slice(2)}`)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true

    // Lazy-load html5-qrcode hanya saat scanner kamera dibuka (hemat bundle awal).
    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (!active) return
        const el = document.getElementById(regionId.current)
        if (!el) return
        const scanner = new Html5Qrcode(regionId.current, { verbose: false })
        scannerRef.current = scanner
        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 140 } },
            (decoded) => {
              if (!active) return
              onDetected(decoded)
              onClose()
            },
            () => {},
          )
          .catch(() => {})
      })
      .catch(() => {})

    return () => {
      active = false
      const scanner = scannerRef.current
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
        scannerRef.current = null
      }
    }
  }, [open, onClose, onDetected])

  return (
    <Modal open={open} onClose={onClose} title="Scan dengan Kamera" size="sm">
      <div id={regionId.current} className="overflow-hidden rounded-md bg-ink" />
      <p className="mt-3 text-center text-xs text-ink-muted">
        Arahkan kamera ke barcode barang. Pastikan izin kamera diaktifkan.
      </p>
    </Modal>
  )
}
