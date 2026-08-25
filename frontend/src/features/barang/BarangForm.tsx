import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useToast } from "@/components/ui/Toast"
import { rupiah } from "@/lib/format"
import { useKategori, useSimpanBarang, type BarangInput } from "./api"
import type { BarangWithKategori } from "@/types/database"

const schema = z.object({
  kode: z.string().min(1, "Kode wajib diisi"),
  nama: z.string().min(1, "Nama wajib diisi"),
  kategori_id: z.string().nullable(),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  harga_beli: z.coerce.number().min(0, "Tidak boleh negatif"),
  harga_jual: z.coerce.number().min(0, "Tidak boleh negatif"),
  stok: z.coerce.number().min(0, "Tidak boleh negatif"),
  barcode: z.string().nullable(),
})
type FormValues = z.input<typeof schema>

const SATUAN = ["pcs", "sak", "batang", "lembar", "kg", "meter", "galon", "kaleng", "botol", "roll"]

export function BarangForm({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: BarangWithKategori | null
}) {
  const toast = useToast()
  const { data: kategori } = useKategori()
  const simpan = useSimpanBarang()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { satuan: "pcs", kategori_id: null, barcode: null, harga_beli: 0, harga_jual: 0, stok: 0 },
  })

  useEffect(() => {
    if (open) { 
      reset(
        editing
          ? {
              kode: editing.kode,
              nama: editing.nama,
              kategori_id: editing.kategori_id,
              satuan: editing.satuan,
              harga_beli: editing.harga_beli,
              harga_jual: editing.harga_jual,
              stok: editing.stok,
              barcode: editing.barcode,
            }
          : { satuan: "pcs", kategori_id: null, barcode: null, harga_beli: 0, harga_jual: 0, stok: 0, kode: "", nama: "" },
      )
    }
  }, [open, editing, reset])

  const beli = Number(watch("harga_beli")) || 0
  const jual = Number(watch("harga_jual")) || 0
  const margin = jual - beli

  async function onSubmit(values: FormValues) {
    const input: BarangInput = {
      kode: values.kode,
      nama: values.nama,
      kategori_id: values.kategori_id || null,
      satuan: values.satuan,
      harga_beli: Number(values.harga_beli),
      harga_jual: Number(values.harga_jual),
      stok: Number(values.stok),
      barcode: values.barcode?.trim() || null,
    }
    try {
      await simpan.mutateAsync({ id: editing?.id, input })
      toast(editing ? "Barang diperbarui" : "Barang ditambahkan", "success")
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : "Gagal menyimpan", "error")
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit Barang" : "Tambah Barang"}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={simpan.isPending}>Simpan</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Kode barang" error={errors.kode?.message} {...register("kode")} />
        <Input label="Barcode (opsional)" hint="Kosongkan utk barang curah" {...register("barcode")} />
        <div className="sm:col-span-2">
          <Input label="Nama barang" error={errors.nama?.message} {...register("nama")} />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink-soft">Kategori</label>
          <select className="input-base" {...register("kategori_id")}>
            <option value="">— Tanpa kategori —</option>
            {kategori?.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ink-soft">Satuan</label>
          <select className="input-base" {...register("satuan")}>
            {SATUAN.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <Input label="Harga beli (modal)" type="number" error={errors.harga_beli?.message} {...register("harga_beli")} />
        <Input label="Harga jual" type="number" error={errors.harga_jual?.message} {...register("harga_jual")} />
        <Input label="Stok awal" type="number" error={errors.stok?.message} {...register("stok")} />
        <div className="flex items-end">
          <div className="w-full rounded-md bg-surface-sunken px-3 py-2 text-sm">
            <span className="text-ink-muted">Margin: </span>
            <span className={margin >= 0 ? "font-semibold text-ok" : "font-semibold text-danger"}>
              {rupiah(margin)}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  )
}