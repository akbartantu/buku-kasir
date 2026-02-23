import type { LoginCredentials, RegisterData, AuthResponse, MeResponse, User } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("catatjualan_token");
}

function getHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Registration failed");
  }
  return json as AuthResponse;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernameOrEmail: credentials.usernameOrEmail,
      password: credentials.password,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Login failed");
  }
  return json as AuthResponse;
}

export async function getMe(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as MeResponse;
  return json.user ?? null;
}

export interface UpdateProfilePayload {
  fullName?: string;
  email?: string;
}

export async function updateProfile(updates: UpdateProfilePayload): Promise<User> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Update failed");
  }
  return (json as { user: User }).user;
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    }
  }
}

export interface ForgotPasswordResponse {
  ok: boolean;
  token?: string;
}

export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || "Request failed");
  }
  return json as ForgotPasswordResponse;
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || "Reset failed");
  }
}

export async function resetPasswordByUsername(username: string, newPassword: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth/reset-password-by-username`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username.trim(), newPassword }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || "Gagal mengubah kata sandi");
  }
}

export const TOKEN_KEY = "catatjualan_token";
