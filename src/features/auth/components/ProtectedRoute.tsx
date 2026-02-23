import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-bold">Memuat...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/signin" state={{ from: location }} replace />
    );
  }

  return <>{children}</>;
}
