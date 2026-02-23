export interface Product {
  id: string;
  name: string;
  emoji: string;
  price: number;
  /** null = seller does not track stock for this product */
  stock: number | null;
  lowStockThreshold: number;
}

export interface Transaction {
  id: string;
  type: "sale" | "expense";
  productId?: string;
  productName?: string;
  quantity?: number;
  amount: number;
  description?: string;
  timestamp: number;
  date: string; // YYYY-MM-DD
  /** Set when transaction was created from an order (idempotency) */
  orderId?: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  scheduledAt: string;
  collected: "yes" | "no";
  paid: "yes" | "no" | "dp";
  createdAt: string;
}

export const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", name: "Jalangkote", emoji: "🥟", price: 3000, stock: 50, lowStockThreshold: 10 },
  { id: "2", name: "Ayam Bakar", emoji: "🍗", price: 15000, stock: 30, lowStockThreshold: 5 },
  { id: "3", name: "Ayam Crispy", emoji: "🍗", price: 12000, stock: 30, lowStockThreshold: 5 },
  { id: "4", name: "Nasi Goreng", emoji: "🍚", price: 10000, stock: 20, lowStockThreshold: 5 },
  { id: "5", name: "Es Teh", emoji: "🧊", price: 5000, stock: 40, lowStockThreshold: 10 },
  { id: "6", name: "Gorengan", emoji: "🍩", price: 2000, stock: 60, lowStockThreshold: 15 },
];
