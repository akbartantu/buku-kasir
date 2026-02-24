import { TOKEN_KEY } from "@/features/auth/api/authApi";

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

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${BASE_URL}/api/admin/users`, { headers: getHeaders() });
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Akses hanya untuk admin.");
  }
  if (!res.ok) throw new Error((await res.json()).error || "Gagal mengambil daftar pengguna");
  return res.json();
}
