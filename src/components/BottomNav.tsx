import { Home, ShoppingCart, Wallet, BarChart3, ClipboardList, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", icon: Home, label: "Beranda" },
  { path: "/add-sale", icon: ShoppingCart, label: "Jual" },
  { path: "/add-expense", icon: Wallet, label: "Biaya" },
  { path: "/summary", icon: BarChart3, label: "Ringkasan" },
  { path: "/orders", icon: ClipboardList, label: "Pesanan" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-border bg-card safe-area-bottom">
      <div className="mx-auto flex max-w-md">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors touch-target ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-7 h-7" strokeWidth={active ? 2.5 : 2} />
              <span className={`text-xs font-bold ${active ? "text-primary" : ""}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
