import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProducts, useTransactions } from "@/hooks/useStore";
import { ProductCard } from "@/components/ProductCard";
import { ConfirmScreen } from "@/components/ConfirmScreen";
import { SuccessScreen } from "@/components/SuccessScreen";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/data";

type Step = "select" | "confirm" | "success";

export default function AddSalePage() {
  const navigate = useNavigate();
  const { products, reduceStock } = useProducts();
  const { addTransaction } = useTransactions();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<Product | null>(null);
  const [saleQuantity, setSaleQuantity] = useState<number>(1);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [confirmedQuantity, setConfirmedQuantity] = useState<number>(1);

  const handleSelect = (product: Product) => {
    setSelected(product);
    setSaleQuantity(1);
    setStep("confirm");
  };

  const effectiveQuantity = Math.max(1, saleQuantity);
  const canConfirm = selected && selected.price > 0 && effectiveQuantity >= 1;

  const handleConfirm = async () => {
    if (!selected || !canConfirm) return;
    const amount = selected.price * effectiveQuantity;
    setConfirmedAmount(amount);
    setConfirmedQuantity(effectiveQuantity);
    await addTransaction({
      type: "sale",
      productId: selected.id,
      productName: selected.name,
      quantity: effectiveQuantity,
      amount,
    });
    await reduceStock(selected.id, effectiveQuantity);
    setStep("success");
  };

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
          <h1 className="text-elder-xl font-black">🛒 Catat Penjualan</h1>
        </div>

        <p className="text-elder-base text-muted-foreground font-bold mb-4">
          Pilih produk yang terjual:
        </p>

        {/* Product List */}
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Confirm */}
      {step === "confirm" && selected && (
        <ConfirmScreen
          emoji={selected.emoji}
          title="Konfirmasi Penjualan"
          message={selected.name}
          onConfirm={handleConfirm}
          onCancel={() => setStep("select")}
          confirmDisabled={!canConfirm}
        >
          <div className="mt-4 text-left space-y-4">
            <div>
              <Label className="text-muted-foreground text-elder-sm font-bold">Harga jual (Rp)</Label>
              <p className="mt-1 rounded-xl border-2 border-border bg-muted/50 px-4 py-2.5 text-elder-base font-bold">
                {formatCurrency(selected.price)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground text-elder-sm font-bold">Jumlah</Label>
              <div className="mt-1 flex items-center gap-0 border-2 border-border rounded-xl overflow-hidden bg-muted/50 w-fit">
                <button
                  type="button"
                  onClick={() => setSaleQuantity((q) => Math.max(1, q - 1))}
                  className="touch-target w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted font-bold text-elder-base"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={saleQuantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    const n = v === "" ? 1 : Math.max(1, parseInt(v, 10) || 1);
                    setSaleQuantity(n);
                  }}
                  className="w-12 h-10 text-center font-bold text-elder-base bg-background border-0 border-x border-border focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setSaleQuantity((q) => q + 1)}
                  className="touch-target w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground font-bold text-elder-base"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </ConfirmScreen>
      )}

      {/* Success */}
      {step === "success" && selected && (
        <SuccessScreen
          title="Berhasil Dicatat! ✅"
          message={
            confirmedQuantity > 1
              ? `${selected.name} × ${confirmedQuantity} — ${formatCurrency(confirmedAmount)}`
              : `${selected.name} terjual ${formatCurrency(confirmedAmount)}`
          }
          onDone={() => {
            setStep("select");
            setSelected(null);
            setConfirmedAmount(0);
            setConfirmedQuantity(1);
          }}
        />
      )}
    </div>
  );
}
