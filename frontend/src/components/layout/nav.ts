import {
  ScanBarcode,
  History,
  LayoutDashboard,
  Package,
  Boxes,
  HandCoins,
  ReceiptText,
  BarChart3,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  pemilikOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/kasir", label: "Kasir", icon: ScanBarcode },
  { to: "/riwayat", label: "Riwayat", icon: History },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/barang", label: "Barang", icon: Package },
  { to: "/stok", label: "Stok", icon: Boxes },
  { to: "/piutang", label: "Piutang", icon: HandCoins },
  { to: "/utang", label: "Utang", icon: ReceiptText, pemilikOnly: true },
  { to: "/laporan", label: "Laporan", icon: BarChart3, pemilikOnly: true },
  { to: "/pengguna", label: "Pengguna", icon: Users, pemilikOnly: true },
]
