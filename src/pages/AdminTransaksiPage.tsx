import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { fetchAdminTransactions, fetchAdminUsers, type AdminTransaction } from "@/lib/adminApi";

const today = () => new Date().toISOString().split("T")[0];

function dateOffset(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const DEFAULT_DAYS = 30;

type TypeFilter = "all" | "sale" | "expense";

export default function AdminTransaksiPage() {
  const [startDate, setStartDate] = useState(() => dateOffset(today(), -DEFAULT_DAYS + 1));
  const [endDate, setEndDate] = useState(today());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [userId, setUserId] = useState<string>("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["admin", "transactions", startDate, endDate, userId],
    queryFn: () => fetchAdminTransactions({ startDate, endDate, userId: userId || undefined }),
    retry: false,
  });

  const filtered = useMemo(() => {
    if (typeFilter === "all") return transactions;
    return transactions.filter((t) => t.type === typeFilter);
  }, [transactions, typeFilter]);

  const setPreset = useCallback((days: number) => {
    setEndDate(today());
    setStartDate(dateOffset(today(), -days + 1));
  }, []);

  const getKeterangan = (tx: AdminTransaction): string => {
    if (tx.type === "expense" && (tx.description ?? "").trim()) return (tx.description ?? "").trim();
    return "—";
  };

  const getProduk = (tx: AdminTransaction): string => {
    if (tx.type === "sale" && (tx.productName ?? "").trim()) return (tx.productName ?? "").trim();
    return "—";
  };

  const getQty = (tx: AdminTransaction): string | number => {
    if (tx.type === "sale" && (tx.quantity !== undefined && tx.quantity !== null)) return tx.quantity;
    return "—";
  };

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaksi
          </CardTitle>
          <CardDescription>
            Seluruh transaksi penjualan dan pengeluaran dari semua penjual. Filter menurut tanggal dan tipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Dari</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Sampai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={today()}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreset(7)}>
                7 hari
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(14)}>
                14 hari
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(30)}>
                30 hari
              </Button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Pengguna</label>
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
              <label className="text-xs font-medium text-muted-foreground">Tipe</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">Semua</option>
                <option value="sale">Penjualan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daftar Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <p className="text-muted-foreground">Memuat transaksi…</p>
          )}
          {error && (
            <p className="text-sm font-medium text-destructive">
              {error instanceof Error ? error.message : "Gagal memuat transaksi."}
            </p>
          )}
          {!isLoading && !error && (
            filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Tanggal</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Penjual</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Tipe</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Produk</th>
                      <th className="pb-2 pr-4 text-center font-medium text-muted-foreground">Qty</th>
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Keterangan</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/50">
                        <td className="py-2 pr-4">{tx.date}</td>
                        <td className="py-2 pr-4 font-medium">{tx.sellerName ?? tx.userId ?? "—"}</td>
                        <td className="py-2 pr-4">
                          {tx.type === "sale" ? (
                            <span className="text-green-700">Penjualan</span>
                          ) : (
                            <span className="text-red-700">Pengeluaran</span>
                          )}
                        </td>
                        <td className="py-2 pr-4">{getProduk(tx)}</td>
                        <td className="py-2 pr-4 text-center tabular-nums">{getQty(tx)}</td>
                        <td className="py-2 pr-4">{getKeterangan(tx)}</td>
                        <td className="py-2 text-right tabular-nums">{formatCurrency(tx.amount)}</td>
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
