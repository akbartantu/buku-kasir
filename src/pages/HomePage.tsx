import { useNavigate } from "react-router-dom";
import { ShoppingCart, Wallet, BarChart3, AlertTriangle, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useProducts, useTransactions } from "@/hooks/useStore";

export default function HomePage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { todaySales, todayExpenses } = useTransactions();

  const lowStockProducts = products.filter(
    (p) => p.stock != null && p.stock <= p.lowStockThreshold && p.stock > 0
  );
  const outOfStockProducts = products.filter(
    (p) => p.stock != null && p.stock <= 0
  );

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-6">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-elder-2xl font-black flex flex-col items-center gap-2">
            <img src="/icons/logo-buku-kasir.png" alt="" className="h-20 w-20 rounded-xl object-contain" />
            Buku Kasir
          </h1>
          <p className="text-elder-sm text-muted-foreground font-bold">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Today's Summary Card */}
        <div className="rounded-2xl bg-card border-2 border-border p-5 mb-6 shadow-sm">
          <p className="text-elder-sm text-muted-foreground font-bold mb-3">
            📊 Hari Ini
          </p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <p className="text-elder-sm text-muted-foreground font-bold">Penjualan</p>
              <p className="text-elder-xl font-black text-success">
                {formatCurrency(todaySales)}
              </p>
            </div>
            <div className="w-px bg-border" />
            <div className="flex-1 text-center">
              <p className="text-elder-sm text-muted-foreground font-bold">Pengeluaran</p>
              <p className="text-elder-xl font-black text-danger">
                {formatCurrency(todayExpenses)}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border text-center">
            <p className="text-elder-sm text-muted-foreground font-bold">Keuntungan</p>
            <p className="text-elder-2xl font-black text-primary">
              {formatCurrency(todaySales - todayExpenses)}
            </p>
          </div>
        </div>

        {/* Low Stock Warning */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="rounded-2xl border-2 border-warning bg-warning/10 p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              <p className="text-elder-base font-black">Peringatan Stok</p>
            </div>
            {outOfStockProducts.map((p) => (
              <p key={p.id} className="text-elder-sm font-bold text-danger ml-8">
                ❌ {p.emoji} {p.name} — Habis!
              </p>
            ))}
            {lowStockProducts.map((p) => (
              <p key={p.id} className="text-elder-sm font-bold text-muted-foreground ml-8">
                ⚠️ {p.emoji} {p.name} — Sisa {p.stock}
              </p>
            ))}
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/add-sale")}
            className="w-full touch-target-lg rounded-2xl bg-primary text-primary-foreground p-5 flex items-center gap-4 active:scale-[0.97] transition-transform shadow-lg"
          >
            <ShoppingCart className="w-10 h-10" strokeWidth={2.5} />
            <div className="text-left">
              <p className="text-elder-xl font-black">Catat Penjualan</p>
              <p className="text-elder-sm opacity-90">Pilih produk yang terjual</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/add-expense")}
            className="w-full touch-target-lg rounded-2xl bg-card border-2 border-border p-5 flex items-center gap-4 active:scale-[0.97] transition-transform shadow-sm"
          >
            <Wallet className="w-10 h-10 text-danger" strokeWidth={2.5} />
            <div className="text-left">
              <p className="text-elder-xl font-black">Catat Pengeluaran</p>
              <p className="text-elder-sm text-muted-foreground">
                Belanja bahan, dll
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate("/summary")}
            className="w-full touch-target-lg rounded-2xl bg-card border-2 border-border p-5 flex items-center gap-4 active:scale-[0.97] transition-transform shadow-sm"
          >
            <BarChart3 className="w-10 h-10 text-primary" strokeWidth={2.5} />
            <div className="text-left">
              <p className="text-elder-xl font-black">Lihat Ringkasan</p>
              <p className="text-elder-sm text-muted-foreground">Laporan hari ini</p>
            </div>
          </button>

          <button
            onClick={() => navigate("/products")}
            className="w-full touch-target-lg rounded-2xl bg-card border-2 border-border p-5 flex items-center gap-4 active:scale-[0.97] transition-transform shadow-sm"
          >
            <Package className="w-10 h-10 text-muted-foreground" strokeWidth={2.5} />
            <div className="text-left">
              <p className="text-elder-xl font-black">Produk Saya</p>
              <p className="text-elder-sm text-muted-foreground">Tambah atau hapus produk</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
