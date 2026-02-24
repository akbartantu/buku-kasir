export interface User {
  id: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  /** "admin" | "seller"; default "seller" */
  role?: string;
}

export interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  fullName: string;
  email?: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
}
