import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, Plus } from "lucide-react";
import * as dataApi from "@/lib/dataApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SHOP_QUERY_KEY = ["shop"];
const OPERATIONAL_COSTS_QUERY_KEY = ["operational-costs"];

const COST_CATEGORIES = [
  "Sewa", "Listrik", "Air", "Gas", "Bahan Baku", "Kemasan", "Lainnya",
];

export default function ShopPage() {
  const queryClient = useQueryClient();
  const [shopName, setShopName] = useState("");
  const [costCategory, setCostCategory] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costPeriod, setCostPeriod] = useState("");
  const [costType, setCostType] = useState<"recurring" | "one-time">("recurring");
  const [costDescription, setCostDescription] = useState("");

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: SHOP_QUERY_KEY,
    queryFn: dataApi.fetchShop,
  });

  const updateShopMutation = useMutation({
    mutationFn: dataApi.updateShop,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SHOP_QUERY_KEY }),
  });

  const { data: costs = [], isLoading: costsLoading } = useQuery({
    queryKey: OPERATIONAL_COSTS_QUERY_KEY,
    queryFn: dataApi.fetchOperationalCosts,
  });

  const addCostMutation = useMutation({
    mutationFn: dataApi.createOperationalCost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OPERATIONAL_COSTS_QUERY_KEY }),
  });

  const handleSaveShop = async () => {
    await updateShopMutation.mutateAsync(shopName);
  };

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(costAmount) || 0;
    if (!costCategory.trim() || amount <= 0) return;
    await addCostMutation.mutateAsync({
      category: costCategory.trim(),
      amount,
      period: costPeriod.trim() || new Date().toISOString().slice(0, 7),
      type: costType,
      description: costDescription.trim(),
    });
    setCostCategory("");
    setCostAmount("");
    setCostPeriod("");
    setCostDescription("");
  };

  useEffect(() => {
    if (shop?.name != null && shopName === "") setShopName(shop.name);
  }, [shop?.name]);

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-4">
      <div className="mx-auto max-w-md">
        <h1 className="text-elder-xl font-black mb-6 flex items-center gap-2">
          <Store className="w-7 h-7" /> Toko Saya
        </h1>

        <section className="rounded-2xl bg-card border-2 border-border p-5 mb-6">
          <h2 className="text-elder-base font-bold mb-3">Nama toko</h2>
          <div className="flex gap-2">
            <Input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Contoh: Warung Bu Ani"
              className="flex-1"
            />
            <Button
              onClick={handleSaveShop}
              disabled={shopLoading || updateShopMutation.isPending}
            >
              {updateShopMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl bg-card border-2 border-border p-5 mb-6">
          <h2 className="text-elder-base font-bold mb-3">Biaya operasional</h2>
          <form onSubmit={handleAddCost} className="space-y-3">
            <div>
              <Label>Kategori</Label>
              <Select value={costCategory} onValueChange={setCostCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {COST_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Periode (YYYY-MM, opsional)</Label>
              <Input
                value={costPeriod}
                onChange={(e) => setCostPeriod(e.target.value)}
                placeholder={new Date().toISOString().slice(0, 7)}
              />
            </div>
            <div>
              <Label>Tipe</Label>
              <Select
                value={costType}
                onValueChange={(v) => setCostType(v as "recurring" | "one-time")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">Bulanan / Berkala</SelectItem>
                  <SelectItem value="one-time">Sekali</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Keterangan (opsional)</Label>
              <Input
                value={costDescription}
                onChange={(e) => setCostDescription(e.target.value)}
                placeholder="Keterangan"
              />
            </div>
            <Button type="submit" disabled={addCostMutation.isPending} className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Tambah biaya
            </Button>
          </form>
        </section>

        {costsLoading ? (
          <p className="text-muted-foreground text-sm">Memuat...</p>
        ) : costs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Belum ada biaya operasional.</p>
        ) : (
          <div className="space-y-2">
            <h3 className="text-elder-base font-bold">Daftar biaya</h3>
            {costs.map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-card border border-border p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{c.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.period || "—"} · {c.type === "recurring" ? "Bulanan" : "Sekali"}
                    {c.description ? ` · ${c.description}` : ""}
                  </p>
                </div>
                <p className="font-bold">{formatCurrency(c.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
