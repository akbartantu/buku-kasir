import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Receipt, Calendar, Pencil, Trash2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  fetchAdminTransactions,
  fetchAdminUsers,
  deleteAdminTransaction,
  updateAdminTransaction,
  type AdminTransaction,
  type AdminTransactionUpdatePayload,
} from "@/lib/adminApi";

const today = () => new Date().toISOString().split("T")[0];

function dateOffset(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const DEFAULT_DAYS = 30;

type TypeFilter = "all" | "sale" | "expense";

export default function AdminTransaksiPage() {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(() => dateOffset(today(), -DEFAULT_DAYS + 1));
  const [endDate, setEndDate] = useState(today());
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [userId, setUserId] = useState<string>("");
  const [editingTx, setEditingTx] = useState<AdminTransaction | null>(null);
  const [editForm, setEditForm] = useState<AdminTransactionUpdatePayload>({});

  const invalidateTransactions = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: deleteAdminTransaction,
    onSuccess: invalidateTransactions,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AdminTransactionUpdatePayload }) =>
      updateAdminTransaction(id, payload),
    onSuccess: () => {
      invalidateTransactions();
      setEditingTx(null);
    },
  });

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

  const { totalPenjualan, totalPengeluaran, totalProfit } = useMemo(() => {
    const penjualan = filtered.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0);
    const pengeluaran = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return {
      totalPenjualan: penjualan,
      totalPengeluaran: pengeluaran,
      totalProfit: penjualan - pengeluaran,
    };
  }, [filtered]);

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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPenjualan)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalPengeluaran)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-foreground" : "text-red-600"}`}>
              {formatCurrency(totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

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
                      <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Jumlah</th>
                      <th className="pb-2 pl-4 w-[1%] whitespace-nowrap font-medium text-muted-foreground">Aksi</th>
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
                        <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(tx.amount)}</td>
                        <td className="py-2 pl-4">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingTx(tx);
                                setEditForm({
                                  date: tx.date,
                                  type: tx.type,
                                  amount: tx.amount,
                                  quantity: tx.quantity,
                                  description: tx.description ?? "",
                                });
                              }}
                              aria-label="Edit transaksi"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                if (window.confirm("Hapus transaksi ini?")) {
                                  deleteMutation.mutate(tx.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              aria-label="Hapus transaksi"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit transaksi</DialogTitle>
            <DialogDescription>
              Ubah data transaksi. Penjual tidak dapat diubah.
            </DialogDescription>
          </DialogHeader>
          {editingTx && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const payload: AdminTransactionUpdatePayload = {
                  date: editForm.date,
                  type: editForm.type,
                  amount: editForm.amount,
                  description: editForm.description,
                };
                if (editForm.type === "sale" && editForm.quantity !== undefined) {
                  payload.quantity = editForm.quantity;
                }
                updateMutation.mutate({ id: editingTx.id, payload });
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
                  <input
                    type="date"
                    value={editForm.date ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Tipe</label>
                  <select
                    value={editForm.type ?? editingTx.type}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, type: e.target.value as "sale" | "expense" }))
                    }
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="sale">Penjualan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Jumlah (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.amount ?? editingTx.amount ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {(editForm.type ?? editingTx.type) === "sale" && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Qty</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.quantity ?? editingTx.quantity ?? ""}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, quantity: Number(e.target.value) || 0 }))
                    }
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Keterangan</label>
                <input
                  type="text"
                  value={editForm.description ?? editingTx.description ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Opsional"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingTx(null)}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Menyimpan…" : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
