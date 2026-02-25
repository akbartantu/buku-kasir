import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";
import { fetchAdminOrders, fetchAdminUsers, type AdminOrder } from "@/lib/adminApi";
import type { PaymentMethod } from "@/types/data";

function formatCollected(collected: "yes" | "no"): string {
  return collected === "yes" ? "Sudah Diambil" : "Belum";
}

function formatPaid(paid: "yes" | "no" | "dp"): string {
  if (paid === "yes") return "Lunas";
  if (paid === "dp") return "DP";
  return "Belum";
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  tunai: "Tunai",
  "e-wallet": "E-wallet",
  transfer: "Transfer bank",
};

function formatPaymentMethod(m?: PaymentMethod): string {
  return m ? PAYMENT_METHOD_LABELS[m] ?? "—" : "—";
}

type PaidFilter = "" | "yes" | "no" | "dp";
type CollectedFilter = "" | "yes" | "no";

export default function AdminPesananPage() {
  const [userId, setUserId] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("");
  const [collectedFilter, setCollectedFilter] = useState<CollectedFilter>("");

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

  const filteredOrders = useMemo(() => {
    return orders.filter((o: AdminOrder) => {
      if (paidFilter && o.paid !== paidFilter) return false;
      if (collectedFilter && o.collected !== collectedFilter) return false;
      return true;
    });
  }, [orders, paidFilter, collectedFilter]);

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
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Filter penjual</label>
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[160px]"
              >
                <option value="">Semua penjual</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username || u.email || u.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Status Pembayaran</label>
              <select
                value={paidFilter}
                onChange={(e) => setPaidFilter(e.target.value as PaidFilter)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">Semua</option>
                <option value="yes">Lunas</option>
                <option value="dp">DP</option>
                <option value="no">Belum</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Status Pengambilan</label>
              <select
                value={collectedFilter}
                onChange={(e) => setCollectedFilter(e.target.value as CollectedFilter)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">Semua</option>
                <option value="yes">Sudah Diambil</option>
                <option value="no">Belum</option>
              </select>
            </div>
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
            filteredOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan yang sesuai filter"}
              </p>
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
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Status Pembayaran</th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">Metode Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => (
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
                        <td className="py-2 pr-4">
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
                        <td className="py-2 text-muted-foreground">{formatPaymentMethod(o.paymentMethod)}</td>
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
