import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { fetchAdminProducts, fetchAdminUsers } from "@/lib/adminApi";

export default function AdminProdukPage() {
  const [userId, setUserId] = useState("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["admin", "products", userId],
    queryFn: () => fetchAdminProducts({ userId: userId || undefined }),
    retry: false,
  });

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daftar Produk
          </CardTitle>
          <CardDescription>
            Seluruh produk yang dijual oleh penjual. Filter menurut penjual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1 max-w-xs">
            <label className="text-xs font-medium text-muted-foreground">Filter penjual</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Semua penjual</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.username || u.email || u.id}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produk</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Memuat produk…</p>}
          {error && (
            <p className="text-sm font-medium text-destructive">
              {error instanceof Error ? error.message : "Gagal memuat produk."}
            </p>
          )}
          {!isLoading && !error && (
            products.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada produk</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Penjual</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Produk</th>
                      <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Harga</th>
                      <th className="pb-2 pr-4 text-center font-medium text-muted-foreground">Stok</th>
                      <th className="pb-2 text-center font-medium text-muted-foreground">Batas stok rendah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={`${p.userId}-${p.id}`} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium">{p.sellerName ?? p.userId ?? "—"}</td>
                        <td className="py-2 pr-4">
                          <span className="mr-1.5">{p.emoji || "—"}</span>
                          {p.name || "—"}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(p.price)}</td>
                        <td className="py-2 pr-4 text-center tabular-nums">
                          {p.stock === null || p.stock === undefined ? "—" : p.stock}
                        </td>
                        <td className="py-2 text-center tabular-nums">{p.lowStockThreshold ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
