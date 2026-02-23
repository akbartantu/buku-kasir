import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useProducts } from "@/hooks/useStore";
import { ConfirmScreen } from "@/components/ConfirmScreen";
import { SuccessScreen } from "@/components/SuccessScreen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

const EMOJI_OPTIONS = ["🍗", "🥟", "🍚", "🍜", "🍩", "🧊", "🥤", "🍰", "🥩", "🌽", "🍳", "🥘"];
const PRICE_PRESETS = [1000, 2000, 3000, 5000, 8000, 10000, 12000, 15000, 20000, 25000];
const STOCK_PRESETS = [10, 20, 30, 50, 100];

type Step = "list" | "form" | "success";

export default function ManageProductsPage() {
  const navigate = useNavigate();
  const { products, addProduct, deleteProduct } = useProducts();
  const [step, setStep] = useState<Step>("list");
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [customPriceInput, setCustomPriceInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const resetForm = () => {
    setEmoji("");
    setName("");
    setPrice(0);
    setStock(0);
    setCustomPriceInput("");
    setStep("list");
  };

  const handleSubmitAdd = async () => {
    if (!name.trim() || price <= 0) return;
    await addProduct(name.trim(), emoji, price, stock);
    setStep("success");
  };

  const canSubmit = name.trim().length > 0 && price > 0 && stock >= 0;

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => (step === "list" ? navigate("/") : setStep("list"))}
            className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-elder-xl font-black">📦 Produk Saya</h1>
        </div>

        {/* Product List */}
        {step === "list" && (
          <>
            <div className="space-y-3 mb-6">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-3 shadow-sm"
                >
                  <span className="text-elder-2xl">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-elder-base font-bold truncate">{p.name}</p>
                    <p className="text-elder-sm font-bold text-primary">
                      {formatCurrency(p.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(p.id)}
                    className="touch-target rounded-xl bg-destructive/10 flex items-center justify-center p-3 active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("form")}
              className="w-full touch-target-lg rounded-2xl bg-primary text-primary-foreground p-5 text-elder-xl font-black active:scale-[0.97] transition-transform shadow-lg"
            >
              ➕ Tambah Produk Baru
            </button>
          </>
        )}

        {/* Single-page Add Product Form */}
        {step === "form" && (
          <div className="space-y-5">
            <p className="text-muted-foreground font-bold text-elder-base">Tambah Produk Baru</p>

            <div>
              <Label className="text-muted-foreground font-bold mb-2 block">Gambar (emoji)</Label>
              <div className="grid grid-cols-4 gap-3">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`touch-target-lg rounded-xl border-2 flex items-center justify-center text-[2rem] active:scale-95 transition-transform ${
                      emoji === e ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground font-bold mb-2 block">Nama produk</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 50))}
                placeholder="Contoh: Ayam Goreng"
                className="w-full touch-target-lg rounded-xl border-2 border-border bg-card text-elder-base font-bold"
              />
            </div>

            <div>
              <Label className="text-muted-foreground font-bold mb-2 block">Harga (Rp)</Label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {PRICE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrice(p)}
                    className={`touch-target rounded-xl border-2 text-elder-sm font-bold text-center ${
                      price === p ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    {formatCurrency(p)}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={customPriceInput}
                onChange={(e) => {
                  setCustomPriceInput(e.target.value);
                  const val = Number(e.target.value) || 0;
                  if (val > 0) setPrice(val);
                }}
                placeholder="Atau ketik (contoh: 7500)"
                className="w-full touch-target rounded-xl border-2 border-border bg-card text-elder-base font-bold"
              />
            </div>

            <div>
              <Label className="text-muted-foreground font-bold mb-2 block">Stok awal (opsional)</Label>
              <p className="text-sm text-muted-foreground mb-2">Isi jika ingin catat stok; bisa dikosongkan.</p>
              <div className="grid grid-cols-3 gap-2">
                {STOCK_PRESETS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStock(s)}
                    className={`touch-target rounded-xl border-2 text-elder-base font-bold text-center ${
                      stock === s ? "border-primary bg-primary/10" : "border-border bg-card"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                value={stock === 0 ? "" : stock}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = v === "" ? 0 : Math.max(0, parseInt(v, 10) || 0);
                  setStock(n);
                }}
                placeholder="Kosongkan = 0"
                className="mt-2 w-full touch-target rounded-xl border-2 border-border bg-card text-elder-base font-bold"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitAdd}
              disabled={!canSubmit}
              className="w-full touch-target-lg rounded-xl bg-primary text-primary-foreground text-elder-lg font-bold active:scale-[0.98] transition-transform disabled:opacity-40"
            >
              Simpan
            </button>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <SuccessScreen
            title="Produk Ditambahkan! ✅"
            message={`${emoji} ${name} siap dijual`}
            onDone={resetForm}
          />
        )}

        {/* Delete Confirm */}
        {deleteTarget && (
          <ConfirmScreen
            emoji="🗑️"
            title="Hapus Produk?"
            message="Produk ini akan dihapus dari daftar"
            onConfirm={async () => {
              await deleteProduct(deleteTarget);
              setDeleteTarget(null);
            }}
            onCancel={() => setDeleteTarget(null)}
            confirmLabel="Hapus"
          />
        )}
      </div>
    </div>
  );
}
