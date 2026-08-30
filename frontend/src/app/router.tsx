import { createHashRouter, Navigate } from "react-router-dom"
import { lazy, Suspense, type ReactNode } from "react"
import { AppLayout } from "@/components/layout/AppLayout"
import { RequireAuth, RequirePemilik } from "@/features/auth/guards"
import { FullScreenLoader } from "@/components/ui/Loader"

// Code-split tiap halaman agar bundle awal ringan (hanya load halaman yang dibuka).
const LoginPage = lazy(() => import("@/features/auth/LoginPage"))
const DashboardPage = lazy(() => import("@/features/dashboard/DashboardPage"))
const KasirPage = lazy(() => import("@/features/kasir/KasirPage"))
const RiwayatPage = lazy(() => import("@/features/riwayat/RiwayatPage"))
const BarangPage = lazy(() => import("@/features/barang/BarangPage"))
const StokPage = lazy(() => import("@/features/stok/StokPage"))
const PiutangPage = lazy(() => import("@/features/piutang/PiutangPage"))
const UtangPage = lazy(() => import("@/features/utang/UtangPage"))
const LaporanPage = lazy(() => import("@/features/laporan/LaporanPage"))
const NotFoundPage = lazy(() => import("@/components/NotFoundPage"))
const PenggunaPage = lazy(() => import("@/features/pengguna/PenggunaPage"))

function L(node: ReactNode) {
  return <Suspense fallback={<FullScreenLoader />}>{node}</Suspense>
}

export const router = createHashRouter([
  { path: "/login", element: L(<LoginPage />) },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/kasir" replace /> },
      { path: "kasir", element: L(<KasirPage />) },
      { path: "riwayat", element: L(<RiwayatPage />) },
      { path: "dashboard", element: L(<DashboardPage />) },
      { path: "barang", element: L(<BarangPage />) },
      { path: "stok", element: L(<StokPage />) },
      { path: "piutang", element: L(<PiutangPage />) },
      {
        path: "utang",
        element: <RequirePemilik>{L(<UtangPage />)}</RequirePemilik>,
      },
      {
        path: "laporan",
        element: <RequirePemilik>{L(<LaporanPage />)}</RequirePemilik>,
      },
      {
        path: "pengguna",
        element: <RequirePemilik>{L(<PenggunaPage />)}</RequirePemilik>,
      },
      { path: "*", element: L(<NotFoundPage />) },
    ],
  },
])
