import { useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { fetchAdminTransactions, fetchAdminUsers } from "@/lib/adminApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, Download, Calendar } from "lucide-react";
import type { Transaction } from "@/types/data";
import type { Product } from "@/types/data";

const today = () => new Date().toISOString().split("T")[0];

function dateOffset(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getDatesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  let d = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  while (d <= endDate) {
    out.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function aggregateByDay(
  transactions: Transaction[],
  dates: string[]
): { date: string; penjualan: number; pengeluaran: number; profit: number }[] {
  const byDate = new Map<string, { penjualan: number; pengeluaran: number }>();
  for (const d of dates) {
    byDate.set(d, { penjualan: 0, pengeluaran: 0 });
  }
  for (const t of transactions) {
    if (!byDate.has(t.date)) continue;
    const row = byDate.get(t.date)!;
    if (t.type === "sale") row.penjualan += t.amount;
    else row.pengeluaran += t.amount;
  }
  return dates.map((date) => {
    const row = byDate.get(date) ?? { penjualan: 0, pengeluaran: 0 };
    return {
      date,
      penjualan: row.penjualan,
      pengeluaran: row.pengeluaran,
      profit: row.penjualan - row.pengeluaran,
    };
  });
}

function getProductSales(
  transactions: Transaction[],
  products: Product[],
  dateSet?: Set<string>
): { name: string; value: number }[] {
  const byName = new Map<string, number>();
  const resolveName = (t: Transaction) => {
    if (t.productName?.trim()) return t.productName.trim();
    if (products.length > 0 && t.productId) {
      const p = products.find((x) => x.id === t.productId);
      if (p) return p.name;
    }
    return "Lainnya";
  };
  for (const t of transactions) {
    if (t.type !== "sale") continue;
    if (dateSet && !dateSet.has(t.date)) continue;
    const name = resolveName(t);
    const qty = t.quantity ?? 1;
    byName.set(name, (byName.get(name) ?? 0) + qty);
  }
  return Array.from(byName.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

const lineChartConfig = {
  date: { label: "Tanggal" },
  penjualan: { label: "Penjualan", color: "hsl(142, 76%, 36%)" },
  pengeluaran: { label: "Pengeluaran", color: "hsl(0, 84%, 60%)" },
} satisfies ChartConfig;

const barChartConfig = {
  date: { label: "Tanggal" },
  profit: { label: "Profit", color: "hsl(38, 92%, 50%)" },
} satisfies ChartConfig;

const PIE_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(217, 91%, 60%)",
  "hsl(0, 84%, 60%)",
  "hsl(48, 96%, 53%)",
];

const DEFAULT_DAYS = 30;

export default function AdminDashboardPage() {
  const [startDate, setStartDate] = useState(() => dateOffset(today(), -DEFAULT_DAYS + 1));
  const [endDate, setEndDate] = useState(today());
  const [userId, setUserId] = useState<string>("");

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["admin", "transactions", "ringkasan", startDate, endDate, userId],
    queryFn: () => fetchAdminTransactions({ startDate, endDate, userId: userId || undefined }),
    retry: false,
  });

  const products: Product[] = [];

  const rangeDates = useMemo(() => getDatesInRange(startDate, endDate), [startDate, endDate]);
  const rangeSet = useMemo(() => new Set(rangeDates), [rangeDates]);

  const prevStart = useMemo(() => {
    const len = rangeDates.length;
    return len ? dateOffset(startDate, -len) : startDate;
  }, [startDate, rangeDates.length]);
  const prevEnd = useMemo(() => dateOffset(startDate, -1), [startDate]);
  const prevDates = useMemo(() => getDatesInRange(prevStart, prevEnd), [prevStart, prevEnd]);
  const prevSet = useMemo(() => new Set(prevDates), [prevDates]);

  const txInRange = useMemo(
    () => transactions.filter((t) => rangeSet.has(t.date)),
    [transactions, rangeSet]
  );
  const txPrev = useMemo(
    () => transactions.filter((t) => prevSet.has(t.date)),
    [transactions, prevSet]
  );

  const dayAggregate = useMemo(
    () => aggregateByDay(transactions, rangeDates),
    [transactions, rangeDates]
  );

  const totalPenjualan = useMemo(
    () => txInRange.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0),
    [txInRange]
  );
  const totalPengeluaran = useMemo(
    () => txInRange.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [txInRange]
  );
  const totalProfit = totalPenjualan - totalPengeluaran;

  const prevPenjualan = useMemo(
    () => txPrev.filter((t) => t.type === "sale").reduce((s, t) => s + t.amount, 0),
    [txPrev]
  );
  const prevPengeluaran = useMemo(
    () => txPrev.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [txPrev]
  );
  const prevProfit = prevPenjualan - prevPengeluaran;

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr === 0 ? 0 : 100) : Math.round(((curr - prev) / prev) * 100);
  const pctPenjualan = pctChange(totalPenjualan, prevPenjualan);
  const pctPengeluaran = pctChange(totalPengeluaran, prevPengeluaran);
  const pctProfit = pctChange(totalProfit, prevProfit);

  const productSales = useMemo(
    () => getProductSales(transactions, products, rangeSet),
    [transactions, rangeSet]
  );

  const lineData = useMemo(
    () =>
      dayAggregate.map((r) => ({
        date: r.date.slice(5).replace("-", "/"),
        penjualan: r.penjualan,
        pengeluaran: r.pengeluaran,
      })),
    [dayAggregate]
  );

  const barData = useMemo(
    () =>
      dayAggregate.map((r) => ({
        date: r.date.slice(5).replace("-", "/"),
        profit: r.profit,
      })),
    [dayAggregate]
  );

  const setPreset = useCallback((days: number) => {
    setEndDate(today());
    setStartDate(dateOffset(today(), -days + 1));
  }, []);

  const exportCsv = useCallback(() => {
    const header = "Tanggal,Penjualan,Pengeluaran,Profit\n";
    const rows = dayAggregate
      .slice()
      .reverse()
      .map(
        (r) =>
          `${r.date},${r.penjualan},${r.pengeluaran},${r.profit}`
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ringkasan-harian-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dayAggregate, startDate, endDate]);

  if (loadingTx) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Memuat data…
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rentang Tanggal
          </CardTitle>
          <CardDescription>Data dari semua penjual. Pilih periode untuk analisis. Bandingkan dengan periode sebelumnya.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
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
              <Button variant="outline" size="sm" onClick={() => setPreset(7)}>7 hari</Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(14)}>14 hari</Button>
              <Button variant="outline" size="sm" onClick={() => setPreset(30)}>30 hari</Button>
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
                <p className="text-xs text-muted-foreground mt-1">
                  vs periode lalu: {formatCurrency(prevPenjualan)}{" "}
                  <span className={pctPenjualan >= 0 ? "text-green-600" : "text-red-600"}>
                    ({pctPenjualan >= 0 ? "naik" : "turun"} {Math.abs(pctPenjualan)}%)
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(totalPengeluaran)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs periode lalu: {formatCurrency(prevPengeluaran)}{" "}
                  <span className={pctPengeluaran >= 0 ? "text-red-600" : "text-green-600"}>
                    ({pctPengeluaran >= 0 ? "naik" : "turun"} {Math.abs(pctPengeluaran)}%)
                  </span>
                </p>
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
                <p className="text-xs text-muted-foreground mt-1">
                  vs periode lalu: {formatCurrency(prevProfit)}{" "}
                  <span className={pctProfit >= 0 ? "text-green-600" : "text-red-600"}>
                    ({pctProfit >= 0 ? "naik" : "turun"} {Math.abs(pctProfit)}%)
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tren Penjualan & Pengeluaran</CardTitle>
              <CardDescription>Garis hijau: penjualan. Garis merah: pengeluaran. Periode terpilih.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineChartConfig} className="h-[280px] w-full">
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} />
                  <YAxis tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="penjualan" stroke="var(--color-penjualan)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="pengeluaran" stroke="var(--color-pengeluaran)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profit Harian</CardTitle>
                <CardDescription>Periode terpilih</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={barChartConfig} className="h-[280px] w-full">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} />
                    <YAxis
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      domain={["auto", "auto"]}
                    />
                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />} />
                    <Bar dataKey="profit" fill="var(--color-profit)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produk Terlaris</CardTitle>
                <CardDescription>Produk yang dijual penjual (periode terpilih). Grafik dan daftar jumlah terjual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {productSales.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data penjualan</p>
                ) : (
                  <>
                    <ChartContainer
                      config={productSales.reduce<ChartConfig>((acc, _, i) => ({ ...acc, [productSales[i].name]: { label: productSales[i].name } }), { value: { label: "Terjual" } })}
                      className="h-[280px] w-full"
                    >
                      <PieChart>
                        <Pie
                          data={productSales}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {productSales.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="rounded-md border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Produk</th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">Jumlah Terjual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productSales.map((row, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2">{row.name}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ringkasan Harian
                </CardTitle>
                <CardDescription>{startDate} s/d {endDate}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} className="shrink-0">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Tanggal</th>
                      <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Penjualan</th>
                      <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Pengeluaran</th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayAggregate.slice().reverse().map((r) => (
                      <tr key={r.date} className="border-b border-border/50">
                        <td className="py-2 pr-4">{r.date}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.penjualan)}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatCurrency(r.pengeluaran)}</td>
                        <td className={`py-2 text-right tabular-nums ${r.profit >= 0 ? "" : "text-red-600"}`}>
                          {formatCurrency(r.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
