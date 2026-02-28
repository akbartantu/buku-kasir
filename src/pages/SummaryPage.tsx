import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Calendar, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Leaf, Trophy, Wallet } from "lucide-react";
import { useProducts, useTransactions } from "@/hooks/useStore";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types/data";

const today = () => new Date().toISOString().split("T")[0];

function dateOffset(d: string, offset: number): string {
  const t = new Date(d + "T12:00:00");
  t.setDate(t.getDate() + offset);
  return t.toISOString().split("T")[0];
}

function getMonday(d: string): string {
  const t = new Date(d + "T12:00:00");
  const day = t.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  t.setDate(t.getDate() + diff);
  return t.toISOString().split("T")[0];
}

function weekEnd(weekStart: string): string {
  return dateOffset(weekStart, 6);
}

function monthOffset(ym: string, offset: number): string {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(y, m - 1 + offset, 1);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

type GroupMode = "week" | "month" | "year";

function getGroupKey(date: string, mode: GroupMode): string {
  if (mode === "week") return date;
  if (mode === "month") return getMonday(date);
  return date.slice(0, 7); // year -> YYYY-MM
}

function getGroupLabel(key: string, mode: GroupMode): string {
  if (mode === "week") {
    return new Date(key + "T12:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  if (mode === "month") {
    const end = weekEnd(key);
    const a = new Date(key + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const b = new Date(end + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return `${a} – ${b}`;
  }
  return new Date(key + "-01T12:00:00").toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

type TransactionGroup = { key: string; label: string; transactions: Transaction[] };

type FilterMode = "day" | "week" | "month" | "year";

export default function SummaryPage() {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { transactions } = useTransactions();
  const [mode, setMode] = useState<FilterMode>("day");
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getMonday(today()));
  const [selectedMonth, setSelectedMonth] = useState(() => today().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(() => today().slice(0, 4));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const filteredTransactions = (() => {
    if (mode === "day") return transactions.filter((t) => t.date === selectedDate);
    if (mode === "week") {
      const end = weekEnd(selectedWeekStart);
      return transactions.filter((t) => inRange(t.date, selectedWeekStart, end));
    }
    if (mode === "month") {
      return transactions.filter((t) => t.date.startsWith(selectedMonth));
    }
    return transactions.filter((t) => t.date.startsWith(selectedYear));
  })();

  const totalSales = filteredTransactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const profit = totalSales - totalExpenses;
  const sales = filteredTransactions.filter((t) => t.type === "sale");
  const expenses = filteredTransactions.filter((t) => t.type === "expense");

  useEffect(() => {
    setCollapsedGroups(new Set());
  }, [mode]);

  const groupMode: GroupMode | null = mode === "day" ? null : mode;

  const groupedSales = useMemo((): TransactionGroup[] => {
    if (!groupMode) return [];
    const byKey = new Map<string, Transaction[]>();
    for (const tx of sales) {
      const key = getGroupKey(tx.date, groupMode);
      const list = byKey.get(key) ?? [];
      list.push(tx);
      byKey.set(key, list);
    }
    return Array.from(byKey.entries())
      .map(([key, transactions]) => ({ key, label: getGroupLabel(key, groupMode), transactions }))
      .sort((a, b) => (b.key > a.key ? 1 : -1));
  }, [sales, groupMode]);

  const groupedExpenses = useMemo((): TransactionGroup[] => {
    if (!groupMode) return [];
    const byKey = new Map<string, Transaction[]>();
    for (const tx of expenses) {
      const key = getGroupKey(tx.date, groupMode);
      const list = byKey.get(key) ?? [];
      list.push(tx);
      byKey.set(key, list);
    }
    return Array.from(byKey.entries())
      .map(([key, transactions]) => ({ key, label: getGroupLabel(key, groupMode), transactions }))
      .sort((a, b) => (b.key > a.key ? 1 : -1));
  }, [expenses, groupMode]);

  const isGroupExpanded = (key: string) => !collapsedGroups.has(key);
  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const salesByPaymentMethod = useMemo(() => {
    const methods: Record<string, number> = { tunai: 0, "e-wallet": 0, transfer: 0, lainnya: 0 };
    for (const t of sales) {
      const pm = t.paymentMethod && ["tunai", "e-wallet", "transfer"].includes(t.paymentMethod) ? t.paymentMethod : "lainnya";
      methods[pm] = (methods[pm] ?? 0) + t.amount;
    }
    return methods;
  }, [sales]);

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    tunai: "Tunai",
    "e-wallet": "E-wallet",
    transfer: "Transfer bank",
    lainnya: "Lainnya",
  };

  const periodLabel = (() => {
    if (mode === "day") {
      return selectedDate === today()
        ? "Hari Ini"
        : new Date(selectedDate + "T12:00:00").toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
    }
    if (mode === "week") {
      const end = weekEnd(selectedWeekStart);
      const a = new Date(selectedWeekStart + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      const b = new Date(end + "T12:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      return `${a} – ${b}`;
    }
    if (mode === "month") {
      return new Date(selectedMonth + "-01T12:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    }
    return selectedYear;
  })();

  const getProductName = (tx: { productId?: string; productName?: string }) =>
    (tx.productId && products.find((p) => p.id === tx.productId)?.name) ?? tx.productName ?? "—";

  /** Smaller font for large amounts (jutaan, belasan juta) so they fit without overflow. */
  const getSummaryAmountClass = (amount: number, isProfit = false): string => {
    const base = "tabular-nums font-black min-w-0 text-right";
    const abs = Math.abs(amount);
    if (abs >= 10_000_000) return `text-sm ${base}`;
    if (abs >= 1_000_000) return `text-base ${base}`;
    return `${isProfit ? "text-elder-xl" : "text-elder-lg"} ${base}`;
  };

  /** For non-day modes show date + time; for day mode show time only. */
  const getTxTimeLabel = (tx: { timestamp: number; date: string }): string => {
    const d = new Date(tx.timestamp);
    if (mode === "day") {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  /** For expense cards: show only the description part (after last " — ") to keep the card short. */
  const getExpenseLabel = (description: string | undefined): string => {
    if (!description || !description.trim()) return "—";
    const idx = description.lastIndexOf(" — ");
    return idx >= 0 ? description.slice(idx + 3).trim() : description.trim();
  };

  const isToday = selectedDate === today();

  const canGoNext = () => {
    if (mode === "day") return !isToday;
    if (mode === "week") return dateOffset(selectedWeekStart, 7) <= getMonday(today());
    if (mode === "month") return monthOffset(selectedMonth, 1) <= today().slice(0, 7);
    return Number(selectedYear) + 1 <= Number(today().slice(0, 4));
  };

  const handlePrev = () => {
    if (mode === "day") setSelectedDate((d) => dateOffset(d, -1));
    else if (mode === "week") setSelectedWeekStart((w) => dateOffset(w, -7));
    else if (mode === "month") setSelectedMonth((m) => monthOffset(m, -1));
    else setSelectedYear((y) => String(Number(y) - 1));
  };

  const handleNext = () => {
    if (mode === "day") setSelectedDate((d) => dateOffset(d, 1));
    else if (mode === "week") setSelectedWeekStart((w) => dateOffset(w, 7));
    else if (mode === "month") setSelectedMonth((m) => monthOffset(m, 1));
    else setSelectedYear((y) => String(Number(y) + 1));
  };

  const modes: { id: FilterMode; label: string }[] = [
    { id: "day", label: "Hari" },
    { id: "week", label: "Minggu" },
    { id: "month", label: "Bulan" },
    { id: "year", label: "Tahun" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-elder-xl font-black flex items-center gap-2">
            <BarChart3 className="w-7 h-7" /> Ringkasan
          </h1>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4 p-1 rounded-xl bg-muted/60">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 py-2.5 rounded-lg text-elder-sm font-bold transition-colors ${
                mode === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Date/period bar */}
        <div className="flex items-center justify-center gap-2 mb-6 py-3 px-4 rounded-2xl bg-secondary/80">
          <button
            type="button"
            onClick={handlePrev}
            className="touch-target w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          {mode === "day" && (
            <label
              className="flex-1 flex items-center justify-center gap-2 font-bold text-elder-base cursor-pointer"
              onClick={() => dateInputRef.current?.showPicker?.()}
            >
              {periodLabel}
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={today()}
                className="absolute w-0 h-0 opacity-0 pointer-events-none"
                tabIndex={-1}
                aria-label="Pilih tanggal"
              />
            </label>
          )}
          {mode !== "day" && <span className="flex-1 text-center font-bold text-elder-base">{periodLabel}</span>}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext()}
            className="touch-target w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl bg-card border-2 border-border p-5 mb-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <span className="text-elder-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
                <span className="text-success font-bold tabular-nums">Rp</span> Total Penjualan
              </span>
              <span className={`${getSummaryAmountClass(totalSales)} text-success`}>
                {formatCurrency(totalSales)}
              </span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span className="text-elder-base font-bold text-muted-foreground flex items-center gap-2 shrink-0">
                <Leaf className="w-5 h-5 text-danger" /> Total Pengeluaran
              </span>
              <span className={`${getSummaryAmountClass(totalExpenses)} text-danger`}>
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="border-t-2 border-border pt-4 flex justify-between items-center gap-2">
              <span className="text-elder-lg font-black flex items-center gap-2 shrink-0">
                <Trophy className="w-6 h-6 text-primary" /> Keuntungan
              </span>
              <span className={`${getSummaryAmountClass(profit, true)} ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                {profit >= 0 ? "" : "-"}
                {formatCurrency(Math.abs(profit))}
              </span>
            </div>
            {totalSales > 0 && (
              <div className="border-t-2 border-border pt-4 space-y-2">
                <p className="text-elder-sm font-bold text-muted-foreground flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4" /> Saldo per Metode Pembayaran
                </p>
                {(["tunai", "e-wallet", "transfer", "lainnya"] as const).map(
                  (key) =>
                    salesByPaymentMethod[key] > 0 && (
                      <div key={key} className="flex justify-between items-center gap-2">
                        <span className="text-elder-sm text-muted-foreground">{PAYMENT_METHOD_LABELS[key]}</span>
                        <span className="text-elder-sm font-bold text-success tabular-nums">
                          {formatCurrency(salesByPaymentMethod[key])}
                        </span>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Biaya operasional hint
        <p className="text-xs text-muted-foreground mb-4">
          Biaya operasional bulanan (sewa, listrik, dll.): tab <strong>Toko</strong> → Biaya operasional.
        </p> */}

        {/* Transaction List (day mode) or empty state */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-[4rem] block mb-4">📭</span>
            <p className="text-elder-lg font-bold text-muted-foreground">
              {mode === "day" ? "Belum ada catatan untuk tanggal ini" : "Belum ada catatan untuk periode ini"}
            </p>
            <p className="text-elder-sm text-muted-foreground mt-1">
              {mode === "day" ? "Mulai catat penjualan pertama!" : "Total di atas adalah ringkasan periode yang dipilih."}
            </p>
          </div>
        ) : mode === "day" ? (
          <>
            {sales.length > 0 && (
              <div className="mb-4">
                <p className="text-elder-base font-black mb-2 flex items-center gap-2">
                  <span className="text-success font-bold tabular-nums">Rp</span> Penjualan ({sales.length})
                </p>
                <div className="space-y-2">
                  {sales.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-xl bg-card border border-border p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-elder-base font-bold">{getProductName(tx)}</p>
                        <p className="text-elder-sm text-muted-foreground">
                          {getTxTimeLabel(tx)}
                        </p>
                      </div>
                      <p className="text-elder-base font-black text-success">
                        +{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {expenses.length > 0 && (
              <div>
                <p className="text-elder-base font-black mb-2 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-danger" /> Pengeluaran ({expenses.length})
                </p>
                <div className="space-y-2">
                  {expenses.map((tx) => (
                    <div
                      key={tx.id}
                      className="rounded-xl bg-card border border-border p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-elder-base font-bold">{getExpenseLabel(tx.description)}</p>
                        <p className="text-elder-sm text-muted-foreground">
                          {getTxTimeLabel(tx)}
                        </p>
                      </div>
                      <p className="text-elder-base font-black text-danger">
                        -{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {groupedSales.length > 0 && (
              <div className="mb-4">
                <p className="text-elder-base font-black mb-2 flex items-center gap-2">
                  <span className="text-success font-bold tabular-nums">Rp</span> Penjualan ({sales.length})
                </p>
                <div className="space-y-3">
                  {groupedSales.map((group) => {
                    const expanded = isGroupExpanded(group.key);
                    const total = group.transactions.reduce((s, t) => s + t.amount, 0);
                    return (
                      <div key={group.key} className="rounded-xl border border-border overflow-hidden bg-card">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.key)}
                          className="w-full flex items-center justify-between gap-2 p-3 text-left font-bold text-elder-sm active:bg-muted/50 transition-colors"
                          aria-expanded={expanded}
                        >
                          <span className="text-muted-foreground">{group.label}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            {!expanded && (
                              <span className="text-elder-sm text-success tabular-nums">
                                {group.transactions.length} transaksi · +{formatCurrency(total)}
                              </span>
                            )}
                            {expanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                        {expanded && (
                          <div className="border-t border-border space-y-2 p-3 pt-2">
                            {group.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="rounded-lg bg-muted/40 p-3 flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-elder-base font-bold">{getProductName(tx)}</p>
                                  <p className="text-elder-sm text-muted-foreground">
                                    {getTxTimeLabel(tx)}
                                  </p>
                                </div>
                                <p className="text-elder-base font-black text-success">
                                  +{formatCurrency(tx.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {groupedExpenses.length > 0 && (
              <div>
                <p className="text-elder-base font-black mb-2 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-danger" /> Pengeluaran ({expenses.length})
                </p>
                <div className="space-y-3">
                  {groupedExpenses.map((group) => {
                    const expanded = isGroupExpanded(group.key);
                    const total = group.transactions.reduce((s, t) => s + t.amount, 0);
                    return (
                      <div key={group.key} className="rounded-xl border border-border overflow-hidden bg-card">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.key)}
                          className="w-full flex items-center justify-between gap-2 p-3 text-left font-bold text-elder-sm active:bg-muted/50 transition-colors"
                          aria-expanded={expanded}
                        >
                          <span className="text-muted-foreground">{group.label}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            {!expanded && (
                              <span className="text-elder-sm text-danger tabular-nums">
                                {group.transactions.length} transaksi · -{formatCurrency(total)}
                              </span>
                            )}
                            {expanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </span>
                        </button>
                        {expanded && (
                          <div className="border-t border-border space-y-2 p-3 pt-2">
                            {group.transactions.map((tx) => (
                              <div
                                key={tx.id}
                                className="rounded-lg bg-muted/40 p-3 flex justify-between items-center"
                              >
                                <div>
                                  <p className="text-elder-base font-bold">{getExpenseLabel(tx.description)}</p>
                                  <p className="text-elder-sm text-muted-foreground">
                                    {getTxTimeLabel(tx)}
                                  </p>
                                </div>
                                <p className="text-elder-base font-black text-danger">
                                  -{formatCurrency(tx.amount)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
