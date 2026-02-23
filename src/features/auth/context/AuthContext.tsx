import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import * as authApi from "../api/authApi";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (usernameOrEmail: string, password: string) => Promise<void>;
  signUp: (data: import("../types").RegisterData) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: { fullName?: string; email?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem(authApi.TOKEN_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem(authApi.TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signIn = useCallback(
    async (usernameOrEmail: string, password: string) => {
      const { user: u, token } = await authApi.login({ usernameOrEmail, password });
      localStorage.setItem(authApi.TOKEN_KEY, token);
      setUser(u);
    },
    []
  );

  const signUp = useCallback(
    async (data: import("../types").RegisterData) => {
      const { user: u, token } = await authApi.register(data);
      localStorage.setItem(authApi.TOKEN_KEY, token);
      setUser(u);
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(authApi.TOKEN_KEY);
    setUser(null);
    authApi.logout().catch(() => {});
  }, []);

  const updateProfile = useCallback(
    async (updates: { fullName?: string; email?: string }) => {
      const updated = await authApi.updateProfile(updates);
      setUser(updated);
    },
    []
  );

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
