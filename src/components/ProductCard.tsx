import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types/data";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  const tracksStock = product.stock !== null && product.stock !== undefined;
  const isLowStock = tracksStock && product.stock! <= product.lowStockThreshold;
  const isOutOfStock = tracksStock && product.stock! <= 0;

  return (
    <button
      onClick={() => (!tracksStock || !isOutOfStock) && onSelect(product)}
      disabled={tracksStock && isOutOfStock}
      className={`
        touch-target-lg w-full rounded-lg border-2 p-4 text-left transition-all active:scale-95
        ${tracksStock && isOutOfStock
          ? "border-border bg-muted opacity-60 cursor-not-allowed"
          : isLowStock
            ? "border-warning bg-card shadow-sm"
            : "border-border bg-card shadow-sm active:border-primary"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-elder-2xl">{product.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-elder-lg font-bold truncate">{product.name}</p>
          <p className="text-elder-base font-bold text-primary">
            {formatCurrency(product.price)}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-elder-sm font-bold ${isLowStock ? "text-danger" : "text-muted-foreground"}`}>
            {tracksStock ? `Stok: ${product.stock}` : "Stok: —"}
          </p>
          {isLowStock && !isOutOfStock && (
            <p className="text-xs font-bold text-danger">⚠️ Hampir habis</p>
          )}
          {isOutOfStock && (
            <p className="text-xs font-bold text-danger">❌ Habis</p>
          )}
        </div>
      </div>
    </button>
  );
}
