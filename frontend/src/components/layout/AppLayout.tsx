import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { Menu, LogOut, HardHat } from "lucide-react"
import { NAV_ITEMS } from "./nav"
import { useAuth } from "@/features/auth/AuthProvider"
import { Badge } from "@/components/ui/Badge"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { cn } from "@/lib/cn"

export function AppLayout() {
  const { profil, isPemilik, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [keluar, setKeluar] = useState(false)

  const items = NAV_ITEMS.filter((i) => !i.pemilikOnly || isPemilik)

  async function konfirmasiLogout() {
    setKeluar(true)
    try {
      await signOut()
      navigate("/login", { replace: true })
    } finally {
      setKeluar(false)
      setLogoutOpen(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-sunken">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 flex-col border-r border-line bg-ink text-white",
          "transition-transform lg:static lg:flex lg:translate-x-0",
          open ? "flex translate-x-0" : "hidden -translate-x-full lg:flex",
        )}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-grotesk text-sm font-bold">Toko Bangunan</p>
            <p className="text-2xs uppercase tracking-widest text-white/50">Sistem Kasir</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profil?.nama ?? "Pengguna"}</p>
            </div>
            <Badge tone={isPemilik ? "accent" : "neutral"}>{profil?.role ?? "kasir"}</Badge>
          </div>
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Konten */}
            {/* Konten */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-md p-2 hover:bg-surface-sunken" aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-grotesk font-bold">Toko Bangunan</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={konfirmasiLogout}
        title="Keluar dari aplikasi?"
        loading={keluar}
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        message={
          <>
            Anda akan keluar dari akun <b>{profil?.nama ?? "ini"}</b>. Pastikan tidak
            ada transaksi yang belum disimpan.
          </>
        }
      />
    </div>
  )
}
