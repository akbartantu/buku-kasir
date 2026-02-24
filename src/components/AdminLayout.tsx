import { Outlet, Link, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, ShoppingCart, Package, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/ringkasan", label: "Ringkasan", icon: LayoutDashboard },
  { to: "/admin/pengguna", label: "Pengguna", icon: Users },
  { to: "/admin/produk", label: "Produk", icon: Package },
  { to: "/admin/transaksi", label: "Transaksi", icon: Receipt },
  { to: "/admin/pesanan", label: "Pesanan", icon: ShoppingCart },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 w-56 border-r border-border bg-card flex flex-col">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <span className="text-elder-base font-black">Dashboard Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/admin/ringkasan"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            Kembali ke Buku Kasir
          </Link>
        </div>
      </aside>
      <main className="flex-1 pl-56 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
