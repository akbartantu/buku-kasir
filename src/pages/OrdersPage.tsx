import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Check,
  X,
  ClipboardList,
  User,
  Calendar,
  Banknote,
  Clock,
  Wallet,
} from "lucide-react";
import * as dataApi from "@/lib/dataApi";
import { useProducts } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessScreen } from "@/components/SuccessScreen";
import { formatCurrency } from "@/lib/utils";
import type { Order, PaymentMethod } from "@/types/data";
import type { Product } from "@/types/data";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  tunai: "Tunai",
  "e-wallet": "E-wallet",
  transfer: "Transfer bank",
};

function paymentMethodLabel(m?: PaymentMethod): string {
  return m ? PAYMENT_METHOD_LABELS[m] ?? "" : "";
}

const ORDERS_QUERY_KEY = ["orders"];

type FlowStep = "list" | "form" | "success";

function formatScheduledShort(s: string): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Normalize to YYYY-MM-DD for transaction date; use today if invalid. */
function scheduledAtToDateStr(scheduledAt: string): string {
  if (!scheduledAt || !scheduledAt.trim()) return new Date().toISOString().split("T")[0];
  const d = new Date(scheduledAt.trim());
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

function groupOrdersByCustomerAndDate(orders: Order[]): { customerName: string; scheduledAt: string; orders: Order[] }[] {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    const key = `${o.customerName}|${o.scheduledAt}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }
  return Array.from(map.entries()).map(([key, orders]) => {
    const [customerName, scheduledAt] = key.split("|");
    return { customerName, scheduledAt, orders };
  });
}

function OrderCard({
  group,
  products,
  onSetPaid,
  onSetCollected,
  updatePending,
}: {
  group: { customerName: string; scheduledAt: string; orders: Order[] };
  products: Product[];
  onSetPaid: (orders: Order[], paid: "dp" | "yes", paymentMethod?: PaymentMethod) => void;
  onSetCollected: (orders: Order[], collected: "yes" | "no") => void;
  updatePending?: boolean;
}) {
  const { customerName, scheduledAt, orders } = group;
  const [payMenuOpen, setPayMenuOpen] = useState(false);
  const [collectMenuOpen, setCollectMenuOpen] = useState(false);
  const payMenuRef = useRef<HTMLDivElement>(null);
  const collectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!payMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (payMenuRef.current && !payMenuRef.current.contains(e.target as Node)) setPayMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [payMenuOpen]);

  useEffect(() => {
    if (!collectMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (collectMenuRef.current && !collectMenuRef.current.contains(e.target as Node)) setCollectMenuOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [collectMenuOpen]);

  const total = orders.reduce((sum, o) => {
    const p = products.find((x) => x.id === o.productId);
    return sum + (p ? p.price * o.quantity : 0);
  }, 0);
  const allPaid = orders.every((o) => o.paid === "yes");
  const hasDp = orders.some((o) => o.paid === "dp");
  const paymentLabel = allPaid ? "Lunas" : hasDp ? "DP" : "Belum Bayar";
  const paymentStyle = allPaid
    ? "border-success bg-success/10 text-success"
    : hasDp
      ? "border-amber-600/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-destructive/50 bg-destructive/10 text-destructive";
  const allCollected = orders.every((o) => o.collected === "yes");
  const firstPaymentMethod = orders[0]?.paymentMethod;
  const methodLabel = allPaid && firstPaymentMethod ? paymentMethodLabel(firstPaymentMethod) : "";

  return (
    <div className="rounded-xl bg-card border-2 border-border p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Nama Pelanggan</p>
        <div className="flex justify-between items-start gap-2">
          <p className="font-bold text-elder-base">{customerName}</p>
          <span className="text-elder-base font-bold text-primary shrink-0">{formatCurrency(total)}</span>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-0.5">Tanggal Pengambilan</p>
        <div className="flex items-center gap-1.5 text-elder-base">
          <Calendar className="w-4 h-4 shrink-0 text-muted-foreground" />
          <span>{formatScheduledShort(scheduledAt)}</span>
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Produk</p>
        <div className="space-y-1">
          {orders.map((o) => {
            const p = products.find((x) => x.id === o.productId);
            const emoji = p?.emoji ?? "•";
            return (
              <div key={o.id} className="flex items-center gap-2 text-elder-sm text-foreground">
                <span>{emoji}</span>
                <span>{o.productName} × {o.quantity}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${paymentStyle}`}>
          {allPaid ? <Check className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />}
          {paymentLabel}
        </span>
        {methodLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-border bg-muted/30 text-muted-foreground">
            {methodLabel}
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border ${
            allCollected ? "border-success bg-success/10 text-success" : "border-muted-foreground/50 bg-muted/50 text-muted-foreground"
          }`}
        >
          {allCollected ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {allCollected ? "Sudah Diambil" : "Belum Diambil"}
        </span>
      </div>
      {(!allPaid || !allCollected) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {!allPaid && (
            <div className="relative" ref={payMenuRef}>
              <button
                type="button"
                onClick={() => setPayMenuOpen((o) => !o)}
                className="touch-target rounded-lg px-4 py-2 text-xs font-bold border-2 border-amber-700/40 bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-600/40 flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" /> Status Bayar
              </button>
              {payMenuOpen && (
                <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border-2 border-border bg-card shadow-lg py-1 min-w-[10rem]">
                  <button
                    type="button"
                    onClick={() => {
                      onSetPaid(orders, "dp");
                      setPayMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                  >
                    DP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetPaid(orders, "yes", "tunai");
                      setPayMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-success hover:bg-success/10"
                  >
                    Lunas – Tunai
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetPaid(orders, "yes", "e-wallet");
                      setPayMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-success hover:bg-success/10"
                  >
                    Lunas – E-wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSetPaid(orders, "yes", "transfer");
                      setPayMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-success hover:bg-success/10"
                  >
                    Lunas – Transfer bank
                  </button>
                </div>
              )}
            </div>
          )}
          {!allCollected && (
            <div className="relative" ref={collectMenuRef}>
              <button
                type="button"
                onClick={() => setCollectMenuOpen((o) => !o)}
                className="touch-target rounded-lg px-4 py-2 text-xs font-bold border-2 border-border bg-muted/50 text-foreground hover:bg-muted flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Status Pengambilan
              </button>
              {collectMenuOpen && (
                <div className="absolute left-0 top-full mt-1 z-10 rounded-lg border-2 border-border bg-card shadow-lg py-1 min-w-[10rem]">
                  <button
                    type="button"
                    onClick={() => {
                      onSetCollected(orders, "no");
                      setCollectMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted/50"
                  >
                    Belum Diambil
                  </button>
                  <button
                    type="button"
                    disabled={updatePending}
                    onClick={() => {
                      onSetCollected(orders, "yes");
                      setCollectMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-success hover:bg-success/10 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {updatePending ? "Menyimpan..." : "Sudah Diambil"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TRANSACTIONS_QUERY_KEY = ["transactions"];

type PaidFilter = "" | "yes" | "no" | "dp";
type CollectedFilter = "" | "yes" | "no";

export default function OrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { products } = useProducts();
  const [step, setStep] = useState<FlowStep>("list");
  const [customerName, setCustomerName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [scheduledAt, setScheduledAt] = useState("");
  const [successCustomerName, setSuccessCustomerName] = useState("");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("");
  const [collectedFilter, setCollectedFilter] = useState<CollectedFilter>("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: dataApi.fetchOrders,
  });

  const createMutation = useMutation({
    mutationFn: dataApi.createOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { collected?: "yes" | "no"; paid?: "yes" | "no" | "dp"; paymentMethod?: PaymentMethod };
    }) => dataApi.updateOrder(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY });
    },
  });

  const groups = useMemo(() => groupOrdersByCustomerAndDate(orders), [orders]);
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      if (paidFilter) {
        if (paidFilter === "yes" && !g.orders.every((o) => o.paid === "yes")) return false;
        if (paidFilter === "no" && !g.orders.some((o) => o.paid === "no")) return false;
        if (paidFilter === "dp" && !g.orders.some((o) => o.paid === "dp")) return false;
      }
      if (collectedFilter) {
        if (collectedFilter === "yes" && !g.orders.every((o) => o.collected === "yes")) return false;
        if (collectedFilter === "no" && !g.orders.some((o) => o.collected === "no")) return false;
      }
      return true;
    });
  }, [groups, paidFilter, collectedFilter]);
  const pendingGroups = filteredGroups.filter(
    (g) => g.orders.some((o) => o.paid === "no" || o.collected === "no")
  );
  const completedGroups = filteredGroups.filter(
    (g) => g.orders.every((o) => o.paid === "yes" && o.collected === "yes")
  );

  const selectedLines = useMemo(() => {
    return products
      .map((p) => ({ product: p, qty: quantities[p.id] || 0 }))
      .filter(({ qty }) => qty > 0);
  }, [products, quantities]);

  const handleStartNew = () => {
    const defaultQuantities = Object.fromEntries(products.map((p) => [p.id, 1]));
    // #region agent log
    fetch('http://127.0.0.1:7249/ingest/864063e2-f7ca-4ed0-b1fb-694bd1a92c8f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrdersPage.tsx:handleStartNew',message:'Opening Pesanan Baru form',data:{settingQuantitiesTo:defaultQuantities,runId:'post-fix',hypothesisId:'H1'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    setCustomerName("");
    setQuantities(defaultQuantities);
    setScheduledAt("");
    setStep("form");
  };

  const handleConfirmOrder = async () => {
    const dateStr = scheduledAt.trim() || new Date().toISOString().slice(0, 10);
    for (const { product, qty } of selectedLines) {
      await createMutation.mutateAsync({
        customerName: customerName.trim(),
        productId: product.id,
        productName: product.name,
        quantity: qty,
        scheduledAt: dateStr,
      });
    }
    setSuccessCustomerName(customerName.trim());
    setStep("success");
  };

  const setPaid = (orderRows: Order[], paid: "dp" | "yes", paymentMethod?: PaymentMethod) => {
    orderRows.forEach((o) =>
      updateMutation.mutate({
        id: o.id,
        updates: { paid, ...(paymentMethod && { paymentMethod }) },
      })
    );
  };

  const setCollected = (orderRows: Order[], collected: "yes" | "no") => {
    orderRows.forEach((o) => updateMutation.mutate({ id: o.id, updates: { collected } }));
  };

  const inc = (productId: string) => setQuantities((q) => ({ ...q, [productId]: (q[productId] || 0) + 1 }));
  const dec = (productId: string) => setQuantities((q) => ({ ...q, [productId]: Math.max(0, (q[productId] || 0) - 1) }));

  const header = (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => {
          if (step === "list") navigate("/");
          else setStep("list");
        }}
        className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
      >
        <ArrowLeft className="w-7 h-7" />
      </button>
      <h1 className="text-elder-xl font-black flex items-center gap-2">
        <ClipboardList className="w-7 h-7" /> Pesanan
      </h1>
    </div>
  );

  // List view
  if (step === "list") {
    return (
      <div className="min-h-screen bg-background pb-28 px-4 pt-4">
        <div className="mx-auto max-w-md">
          {header}
          <button
            type="button"
            onClick={handleStartNew}
            className="w-full mb-4 py-5 rounded-3xl bg-primary text-primary-foreground text-elder-lg font-bold flex items-center justify-center gap-2 touch-target-lg active:scale-[0.98] transition-transform shadow-md"
          >
            <Plus className="w-6 h-6" strokeWidth={2.5} /> Pesanan Baru
          </button>

          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-xs font-bold text-muted-foreground">Status Pembayaran</label>
              <select
                value={paidFilter}
                onChange={(e) => setPaidFilter(e.target.value as PaidFilter)}
                className="rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium"
              >
                <option value="">Semua</option>
                <option value="yes">Lunas</option>
                <option value="dp">DP</option>
                <option value="no">Belum Bayar</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 min-w-[120px]">
              <label className="text-xs font-bold text-muted-foreground">Status Pengambilan</label>
              <select
                value={collectedFilter}
                onChange={(e) => setCollectedFilter(e.target.value as CollectedFilter)}
                className="rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm font-medium"
              >
                <option value="">Semua</option>
                <option value="yes">Sudah Diambil</option>
                <option value="no">Belum Diambil</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : (
            <>
              {pendingGroups.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                    <Clock className="w-5 h-5" />
                    <span className="font-bold text-elder-base">Menunggu ({pendingGroups.length})</span>
                  </div>
                  <div className="space-y-3">
                    {pendingGroups.map((g) => (
                      <OrderCard
                        key={`${g.customerName}|${g.scheduledAt}`}
                        group={g}
                        products={products}
                        onSetPaid={setPaid}
                        onSetCollected={setCollected}
                        updatePending={updateMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}
              {completedGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3 text-success">
                    <Check className="w-5 h-5" />
                    <span className="font-bold text-elder-base">Selesai ({completedGroups.length})</span>
                  </div>
                  <div className="space-y-3">
                    {completedGroups.map((g) => (
                      <OrderCard
                        key={`${g.customerName}|${g.scheduledAt}`}
                        group={g}
                        products={products}
                        onSetPaid={setPaid}
                        onSetCollected={setCollected}
                        updatePending={updateMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              )}
              {filteredGroups.length === 0 && !isLoading && (
                <p className="text-muted-foreground text-sm">
                  {groups.length === 0 ? "Belum ada pesanan." : "Tidak ada pesanan yang sesuai filter."}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Single-page add order form
  if (step === "form") {
    // #region agent log
    fetch('http://127.0.0.1:7249/ingest/864063e2-f7ca-4ed0-b1fb-694bd1a92c8f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'OrdersPage.tsx:form',message:'Form render quantities',data:{quantities,productIds:products.map(p=>p.id),sampleQty:products[0]?quantities[products[0].id]:undefined,runId:'post-fix',hypothesisId:'H2'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return (
      <div className="min-h-screen bg-background pb-28 px-4 pt-4">
        <div className="mx-auto max-w-md">
          {header}
          <p className="text-muted-foreground font-bold mb-4 text-elder-base">Pesanan Baru</p>

          <div className="space-y-5">
            <div>
              <Label className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" /> Nama pelanggan
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Bu Ani"
                className="mt-2 border-2 border-primary/30 rounded-xl text-elder-base font-bold touch-target-lg"
              />
            </div>

            <div>
              <p className="text-muted-foreground font-bold mb-3 text-elder-base">Pilih produk & jumlah</p>
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4"
                  >
                    <span className="text-2xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-elder-base">{p.name}</p>
                      <p className="text-sm text-primary font-bold">{formatCurrency(p.price)}</p>
                    </div>
                    <div className="flex items-center gap-0 border rounded-lg overflow-hidden bg-muted/50">
                      <button
                        type="button"
                        onClick={() => dec(p.id)}
                        className="touch-target w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted font-bold"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={quantities[p.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0);
                          setQuantities((q) => ({ ...q, [p.id]: n }));
                        }}
                        className="w-12 h-10 text-center font-bold text-elder-base bg-background border-0 border-x border-border focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => inc(p.id)}
                        className="touch-target w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" /> Tanggal pengambilan
              </Label>
              <Input
                type="date"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-2 border-2 border-primary/30 rounded-xl text-elder-base font-bold touch-target-lg"
              />
            </div>

            <Button
              onClick={handleConfirmOrder}
              disabled={!customerName.trim() || selectedLines.length === 0 || createMutation.isPending}
              className="w-full touch-target-lg rounded-xl text-elder-base font-bold"
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (step === "success") {
    return (
      <div className="min-h-screen bg-background pb-28 px-4 pt-4">
        <div className="mx-auto max-w-md">
          {header}
          <SuccessScreen
            title="Pesanan Dicatat!"
            message={`Pesanan untuk ${successCustomerName} berhasil disimpan`}
            onDone={() => {
              setStep("list");
              setCustomerName("");
              setQuantities({});
              setScheduledAt("");
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}
