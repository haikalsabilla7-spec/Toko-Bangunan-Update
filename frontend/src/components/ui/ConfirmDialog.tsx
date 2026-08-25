import { type ReactNode } from "react"
import { Modal } from "./Modal"
import { Button } from "./Button"

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  loading = false,
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">{message}</p>
    </Modal>
  )
}