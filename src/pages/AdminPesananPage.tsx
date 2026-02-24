import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";
import { fetchAdminOrders, fetchAdminUsers } from "@/lib/adminApi";

function formatCollected(collected: "yes" | "no"): string {
  return collected === "yes" ? "Sudah Diambil" : "Belum";
}

function formatPaid(paid: "yes" | "no" | "dp"): string {
  if (paid === "yes") return "Lunas";
  if (paid === "dp") return "DP";
  return "Belum";
}

export default function AdminPesananPage() {
  const [userId, setUserId] = useState("");
  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["admin", "orders", userId],
    queryFn: () => fetchAdminOrders({ userId: userId || undefined }),
    retry: false,
  });

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Daftar Pesanan
          </CardTitle>
          <CardDescription>
            Seluruh pesanan dari penjual. Status pengambilan dan status pembayaran.
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
          <CardTitle>Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground">Memuat pesanan…</p>}
          {error && (
            <p className="text-sm font-medium text-destructive">
              {error instanceof Error ? error.message : "Gagal memuat pesanan."}
            </p>
          )}
          {!isLoading && !error && (
            orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pesanan</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Tanggal Pemesanan</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Penjual</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Pemesan</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Produk</th>
                      <th className="pb-2 pr-4 text-center font-medium text-muted-foreground">Qty</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Tanggal Pengambilan</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Status Pengambilan</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Status Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                        <td className="py-2 pr-4 font-medium">{o.sellerName ?? o.userId ?? "—"}</td>
                        <td className="py-2 pr-4">{o.customerName || "—"}</td>
                        <td className="py-2 pr-4">{o.productName || "—"}</td>
                        <td className="py-2 pr-4 text-center tabular-nums">{o.quantity ?? "—"}</td>
                        <td className="py-2 pr-4 whitespace-nowrap">{formatDate(o.scheduledAt)}</td>
                        <td className="py-2 pr-4">
                          <span className={o.collected === "yes" ? "text-green-700" : "text-muted-foreground"}>
                            {formatCollected(o.collected)}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              o.paid === "yes"
                                ? "text-green-700"
                                : o.paid === "dp"
                                  ? "text-amber-700"
                                  : "text-muted-foreground"
                            }
                          >
                            {formatPaid(o.paid)}
                          </span>
                        </td>
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
