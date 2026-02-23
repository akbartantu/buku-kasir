import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTransactions } from "@/hooks/useStore";
import { SuccessScreen } from "@/components/SuccessScreen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  {
    label: "Bahan Baku",
    emoji: "🥩",
    subCategories: ["Daging", "Sayuran", "Bumbu", "Lainnya"],
    amounts: [20000, 50000, 100000],
  },
  {
    label: "Gas / Minyak",
    emoji: "🔥",
    subCategories: ["Gas LPG", "Minyak Goreng", "Lainnya"],
    amounts: [15000, 30000, 50000],
  },
  {
    label: "Kemasan",
    emoji: "📦",
    subCategories: ["Box", "Plastik", "Sedotan", "Lainnya"],
    amounts: [10000, 25000, 50000],
  },
  {
    label: "Lainnya",
    emoji: "💰",
    subCategories: ["Listrik", "Air", "Sewa", "Lainnya"],
    amounts: [10000, 25000, 50000],
  },
];

type Step = "form" | "success";

export default function AddExpensePage() {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();
  const [step, setStep] = useState<Step>("form");
  const [category, setCategory] = useState<(typeof EXPENSE_CATEGORIES)[0] | null>(null);
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [manualAmountInput, setManualAmountInput] = useState("");
  const [lastRecordedAmount, setLastRecordedAmount] = useState(0);

  const handleSubmit = async () => {
    const finalAmount = amount > 0 ? amount : Number(manualAmountInput) || 0;
    if (finalAmount <= 0) return;
    const desc =
      ([category?.label, subCategory, description].filter(Boolean).join(" — ") || category?.label) ?? "";
    await addTransaction({
      type: "expense",
      amount: finalAmount,
      description: desc,
    });
    setLastRecordedAmount(finalAmount);
    setStep("success");
  };

  const canSubmit = (amount > 0 || Number(manualAmountInput) > 0) && category;

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background pb-28 px-4 pt-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/")}
              className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
            <h1 className="text-elder-xl font-black">💸 Catat Pengeluaran</h1>
          </div>
          <SuccessScreen
            title="Tercatat! ✅"
            message={`Pengeluaran ${formatCurrency(lastRecordedAmount)} berhasil dicatat`}
            onDone={() => {
              setStep("form");
              setCategory(null);
              setSubCategory("");
              setDescription("");
              setAmount(0);
              setManualAmountInput("");
            }}
          />
        </div>
      </div>
    );
  }

  const presets = category?.amounts ?? [10000, 25000, 50000];

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-4">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-elder-xl font-black">💸 Catat Pengeluaran</h1>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="text-muted-foreground font-bold mb-2 block">Kategori</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    setSubCategory("");
                  }}
                  className={`touch-target rounded-xl border-2 p-4 flex items-center gap-2 ${
                    category?.label === c.label ? "border-primary bg-primary/10" : "border-border bg-card"
                  }`}
                >
                  <span className="text-xl">{c.emoji}</span>
                  <p className="text-elder-sm font-bold truncate">{c.label}</p>
                </button>
              ))}
            </div>
          </div>

          {category && (
            <>
              <div>
                <Label className="text-muted-foreground font-bold mb-2 block">Subkategori</Label>
                <div className="flex flex-wrap gap-2">
                  {category.subCategories.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubCategory(sub)}
                      className={`touch-target rounded-xl border-2 px-4 py-2 text-elder-sm font-bold ${
                        subCategory === sub ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground font-bold mb-2 block">Deskripsi (opsional)</Label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                  placeholder="Contoh: Belanja pasar, isi gas 3kg"
                  className="w-full touch-target rounded-xl border-2 border-border bg-card text-elder-base font-bold"
                />
              </div>

              <div>
                <Label className="text-muted-foreground font-bold mb-2 block">Jumlah (Rp)</Label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {presets.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setAmount(amt);
                        setManualAmountInput("");
                      }}
                      className={`touch-target rounded-xl border-2 text-elder-sm font-bold text-center ${
                        amount === amt ? "border-primary bg-primary/10" : "border-border bg-card"
                      }`}
                    >
                      {formatCurrency(amt)}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  value={manualAmountInput !== "" ? manualAmountInput : (amount > 0 ? String(amount) : "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setManualAmountInput(v);
                    if (v !== "") setAmount(0);
                  }}
                  placeholder="Atau ketik jumlah"
                  className="w-full touch-target rounded-xl border-2 border-border bg-card text-elder-base font-bold"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full touch-target-lg rounded-xl bg-primary text-primary-foreground text-elder-lg font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                Catat
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
