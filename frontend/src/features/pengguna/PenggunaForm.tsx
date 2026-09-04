import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/Toast"
import { useSimpanPengguna, type Pengguna } from "./api"

const schema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["pemilik", "kasir"]),
  password: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function PenggunaForm({
  open,
  onClose,
  editing,
  isSelf,
}: {
  open: boolean
  onClose: () => void
  editing: Pengguna | null
  isSelf: boolean
}) {
  const toast = useToast()
  const simpan = useSimpanPengguna()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nama: "", email: "", role: "kasir", password: "" },
  })

  useEffect(() => {
    if (open) {
      reset(
        editing
          ? { nama: editing.nama, email: editing.email, role: editing.role, password: "" }
          : { nama: "", email: "", role: "kasir", password: "" },
      )
    }
  }, [open, editing, reset])

  async function onSubmit(values: FormValues) {
    const pw = values.password?.trim() ?? ""
    // Password wajib saat tambah; opsional saat edit tapi kalau diisi minimal 6.
    if (!editing && pw.length < 6) {
      toast("Password minimal 6 karakter", "error")
      return
    }
    if (editing && pw.length > 0 && pw.length < 6) {
      toast("Password baru minimal 6 karakter", "error")
      return
    }
    try {
      if (editing) {
        await simpan.mutateAsync({
          mode: "update",
          id: editing.id,
          input: { nama: values.nama, role: values.role, password: pw || undefined },
        })
        toast("Pengguna diperbarui", "success")
      } else {
        await simpan.mutateAsync({
          mode: "create",
          input: {
            nama: values.nama,
            email: values.email.toLowerCase(),
            role: values.role,
            password: pw,
          },
        })
        toast("Pengguna ditambahkan", "success")
      }
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error")
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Pengguna" : "Tambah Pengguna"}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={simpan.isPending}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Nama" error={errors.nama?.message} {...register("nama")} />
        <Input
          label="Email"
          type="email"
          readOnly={!!editing}
          error={errors.email?.message}
          hint={editing ? "Email tidak bisa diubah" : undefined}
          {...register("email")}
        />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink-soft">Role</label>
          <select className="input-base" {...register("role")}>
            <option value="kasir">Kasir</option>
            <option value="pemilik">Pemilik (Owner)</option>
          </select>
          {isSelf && (
            <p className="text-xs text-ink-muted">Role akun sendiri tidak bisa diubah (dijaga server).</p>
          )}
        </div>
        <Input
          label={editing ? "Password baru (opsional)" : "Password"}
          type="password"
          hint={editing ? "Kosongkan bila tidak ingin mengganti" : "Minimal 6 karakter"}
          {...register("password")}
        />
      </form>
    </Modal>
  )
}