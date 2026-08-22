import { Link } from "react-router-dom"
import { TrendingUp, Receipt, AlertTriangle, HandCoins, ArrowRight } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardHeader } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { InlineLoader } from "@/components/ui/Loader"
import { ErrorState, EmptyState } from "@/components/ui/State"
import { rupiah, angka } from "@/lib/format"
import { StatCard } from "@/components/ui/StatCard"
import { useDashboard, useStokMenipis } from "./api"

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard()
  const stok = useStokMenipis()

  return (
    <div>
      <PageHeader title="Dashboard" description="Ringkasan operasional toko hari ini." />
      <div className="space-y-4 p-4 sm:p-6">
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <InlineLoader />
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatCard
              icon={TrendingUp}
              tone="accent"
              label="Penjualan Hari Ini"
              value={rupiah(data.penjualanHariIni)}
            />
            <StatCard
              icon={Receipt}
              label="Transaksi Hari Ini"
              value={angka(data.jumlahTransaksiHariIni)}
              suffix="transaksi"
            />
            <StatCard
              icon={AlertTriangle}
              tone={data.jumlahStokMenipis > 0 ? "warn" : "neutral"}
              label="Stok Menipis"
              value={angka(data.jumlahStokMenipis)}
              suffix="barang"
            />
            <StatCard
              icon={HandCoins}
              tone={data.totalPiutangBelumLunas > 0 ? "danger" : "neutral"}
              label="Piutang Belum Lunas"
              value={rupiah(data.totalPiutangBelumLunas)}
            />
          </div>
        )}

        <Card>
          <CardHeader
            title="Barang Stok Menipis"
            subtitle="Perlu segera dipesan ulang ke supplier"
            action={
              <Link to="/stok" className="flex items-center gap-1 text-sm text-accent hover:underline">
                Kelola stok <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {stok.isLoading ? (
            <InlineLoader />
          ) : stok.data && stok.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-sunken">
                  <tr>
                    <th className="th">Kode</th>
                    <th className="th">Nama Barang</th>
                    <th className="th text-right">Sisa Stok</th>
                    <th className="th text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stok.data.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-sunken">
                      <td className="td font-mono text-xs text-ink-muted">{b.kode}</td>
                      <td className="td font-medium">{b.nama}</td>
                      <td className="td num text-right">
                        {angka(b.stok)} {b.satuan}
                      </td>
                      <td className="td text-right">
                        <Badge tone={b.stok <= 0 ? "danger" : "warn"}>
                          {b.stok <= 0 ? "Habis" : "Menipis"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Semua stok aman" description="Tidak ada barang di bawah ambang batas." />
          )}
        </Card>
      </div>
    </div>
  )
}
