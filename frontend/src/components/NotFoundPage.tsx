import { Link } from "react-router-dom"
import { Button } from "@/components/ui/Button"

export default function NotFoundPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="font-grotesk text-3xl font-bold text-ink">404</p>
      <p className="text-sm text-ink-muted">Halaman tidak ditemukan.</p>
      <Link to="/kasir">
        <Button variant="outline">Kembali ke Kasir</Button>
      </Link>
    </div>
  )
}
