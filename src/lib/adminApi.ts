import { TOKEN_KEY } from "@/features/auth/api/authApi";
import type { Transaction, Order, Product } from "@/types/data";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export interface AdminUser {
  id: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  role: string;
}

export interface AdminTransaction extends Transaction {
  userId: string;
  sellerName?: string;
}

/** Fields allowed when updating a transaction via admin PATCH */
export type AdminTransactionUpdatePayload = Partial<Pick<
  AdminTransaction,
  "type" | "amount" | "date" | "productId" | "quantity" | "description"
>> & { category?: string; subCategory?: string };

export interface AdminOrder extends Order {
  sellerName?: string;
}

export interface AdminProduct extends Product {
  userId: string;
  sellerName?: string;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: getHeaders() });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (!res.ok) throw new Error((await res.json()).error || "Gagal mengambil daftar pengguna");
  return res.json();
}

export async function fetchAdminTransactions(params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
}): Promise<AdminTransaction[]> {
  const search = new URLSearchParams();
  if (params?.startDate) search.set("startDate", params.startDate);
  if (params?.endDate) search.set("endDate", params.endDate);
  if (params?.userId) search.set("userId", params.userId);
  const qs = search.toString();
  const url = `${BASE_URL}/api/admin/transactions${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (!res.ok) throw new Error((await res.json()).error || "Gagal mengambil transaksi");
  return res.json();
}

export async function deleteAdminTransaction(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/admin/transactions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (res.status === 404) throw new Error("Transaksi tidak ditemukan");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Gagal menghapus transaksi");
}

export async function updateAdminTransaction(
  id: string,
  payload: AdminTransactionUpdatePayload
): Promise<AdminTransaction> {
  const res = await fetch(`${BASE_URL}/api/admin/transactions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (res.status === 404) throw new Error("Transaksi tidak ditemukan");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Gagal memperbarui transaksi");
  return res.json();
}

export async function fetchAdminProducts(params?: { userId?: string }): Promise<AdminProduct[]> {
  const search = new URLSearchParams();
  if (params?.userId) search.set("userId", params.userId);
  const qs = search.toString();
  const url = `${BASE_URL}/api/admin/products${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (!res.ok) throw new Error((await res.json()).error || "Gagal mengambil produk");
  return res.json();
}

export async function fetchAdminOrders(params?: { userId?: string }): Promise<AdminOrder[]> {
  const search = new URLSearchParams();
  if (params?.userId) search.set("userId", params.userId);
  const qs = search.toString();
  const url = `${BASE_URL}/api/admin/orders${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (!res.ok) throw new Error((await res.json()).error || "Gagal mengambil pesanan");
  return res.json();
}
