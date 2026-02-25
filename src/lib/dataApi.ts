import type { Product, Transaction, Order } from "@/types/data";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const TOKEN_KEY = "catatjualan_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE_URL}/api/products`, { headers: getHeaders() });
  if (res.status === 503) return [];
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch products");
  return res.json();
}

export async function createProduct(p: {
  name: string;
  emoji: string;
  price: number;
  stock?: number | null;
}): Promise<Product> {
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create product");
  return res.json();
}

export async function updateProduct(
  productId: string,
  updates: Partial<Pick<Product, "name" | "emoji" | "price" | "stock" | "lowStockThreshold">>
): Promise<Product> {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update product");
  return res.json();
}

export async function deleteProduct(productId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok && res.status !== 204) throw new Error((await res.json()).error || "Failed to delete product");
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${BASE_URL}/api/transactions`, { headers: getHeaders() });
  if (res.status === 503) return [];
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch transactions");
  return res.json();
}

/** Payload for creating a transaction; id/timestamp are server-set; date optional (defaults to today, or use e.g. order scheduledAt). */
export type CreateTransactionPayload = Omit<Transaction, "id" | "timestamp" | "date"> & { date?: string };

export async function createTransaction(tx: CreateTransactionPayload): Promise<Transaction> {
  const res = await fetch(`${BASE_URL}/api/transactions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create transaction");
  return res.json();
}

export interface Shop {
  id: string | null;
  userId: string;
  name: string;
  createdAt: string | null;
}

export async function fetchShop(): Promise<Shop> {
  const res = await fetch(`${BASE_URL}/api/shop`, { headers: getHeaders() });
  if (res.status === 503) return { id: null, userId: "", name: "", createdAt: null };
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch shop");
  return res.json();
}

export async function updateShop(name: string): Promise<Shop> {
  const res = await fetch(`${BASE_URL}/api/shop`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update shop");
  return res.json();
}

export interface OperationalCost {
  id: string;
  userId: string;
  category: string;
  amount: number;
  period: string;
  type: "recurring" | "one-time";
  description: string;
  createdAt: string;
}

export async function fetchOperationalCosts(): Promise<OperationalCost[]> {
  const res = await fetch(`${BASE_URL}/api/operational-costs`, { headers: getHeaders() });
  if (res.status === 503) return [];
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch operational costs");
  return res.json();
}

export async function createOperationalCost(data: {
  category: string;
  amount: number;
  period: string;
  type: "recurring" | "one-time";
  description?: string;
}): Promise<OperationalCost> {
  const res = await fetch(`${BASE_URL}/api/operational-costs`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create operational cost");
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE_URL}/api/orders`, { headers: getHeaders() });
  if (res.status === 503) return [];
  if (!res.ok) throw new Error((await res.json()).error || "Failed to fetch orders");
  return res.json();
}

export async function createOrder(data: {
  customerName: string;
  productId: string;
  productName: string;
  quantity: number;
  scheduledAt: string;
  paymentMethod?: "tunai" | "e-wallet" | "transfer";
}): Promise<Order> {
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create order");
  return res.json();
}

export async function updateOrder(
  orderId: string,
  updates: { collected?: "yes" | "no"; paid?: "yes" | "no" | "dp"; paymentMethod?: "tunai" | "e-wallet" | "transfer" }
): Promise<Order> {
  const res = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update order");
  return res.json();
}
