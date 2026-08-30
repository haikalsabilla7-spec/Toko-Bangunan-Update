import { useState } from "react"
import { UserPlus, Pencil, Trash2, Users, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { InlineLoader } from "@/components/ui/Loader"
import { EmptyState, ErrorState } from "@/components/ui/State"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { useToast } from "@/components/ui/Toast"
import { tanggal } from "@/lib/format"
import { useAuth } from "@/features/auth/AuthProvider"
import { usePenggunaList, useHapusPengguna, type Pengguna } from "./api"
import { PenggunaForm } from "./PenggunaForm"

export default function PenggunaPage() {
  const toast = useToast()
  const { user } = useAuth()
  const { data, isLoading, isError, refetch } = usePenggunaList()
  const hapus = useHapusPengguna()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Pengguna | null>(null)
  const [hapusTarget, setHapusTarget] = useState<Pengguna | null>(null)

  async function konfirmasiHapus() {
    if (!hapusTarget) return
    try {
      await hapus.mutateAsync(hapusTarget.id)
      toast("Pengguna dihapus", "success")
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menghapus pengguna", "error")
    } finally {
      setHapusTarget(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kelola Pengguna"
        description={`${data?.length ?? 0} akun terdaftar`}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <UserPlus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        }
      />

      <div className="space-y-3 p-4 sm:p-6">
        <div className="card overflow-hidden">
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <InlineLoader />
          ) : (data ?? []).length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="Belum ada pengguna" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">Nama</th>
                    <th className="th">Email</th>
                    <th className="th">Role</th>
                    <th className="th">Dibuat</th>
                    <th className="th text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((u) => {
                    const isSelf = u.id === user?.id
                    return (
                      <tr key={u.id} className="hover:bg-surface-sunken">
                        <td className="td">
                          <div className="font-medium">
                            {u.nama}
                            {isSelf && <span className="ml-2 text-2xs text-ink-muted">(Anda)</span>}
                          </div>
                        </td>
                        <td className="td text-sm text-ink-soft">{u.email}</td>
                        <td className="td">
                          <Badge tone={u.role === "pemilik" ? "accent" : "neutral"}>
                            {u.role === "pemilik" ? (
                              <>
                                <ShieldCheck className="h-3 w-3" /> Pemilik
                              </>
                            ) : (
                              "Kasir"
                            )}
                          </Badge>
                        </td>
                        <td className="td text-sm text-ink-soft">{tanggal(u.created_at)}</td>
                        <td className="td">
                          <div className="flex items-center justify-end gap-1">
                            <IconBtn
                              title="Edit"
                              onClick={() => {
                                setEditing(u)
                                setFormOpen(true)
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn
                              title={isSelf ? "Tidak bisa menghapus akun sendiri" : "Hapus"}
                              danger
                              disabled={isSelf}
                              onClick={() => setHapusTarget(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
        title="Hapus Pengguna"
        danger
        loading={hapus.isPending}
        confirmLabel="Ya, Hapus"
        message={
          <>
            Yakin ingin menghapus akun <b>{hapusTarget?.nama}</b> ({hapusTarget?.email})? Tindakan
            ini tidak bisa dibatalkan.
          </>
        }
      />

      <PenggunaForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        isSelf={editing?.id === user?.id}
      />
    </div>
  )
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-md border border-line-strong hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? "text-danger hover:bg-danger-soft" : "text-ink-soft"
      }`}
    >
      {children}
    </button>
  )
}