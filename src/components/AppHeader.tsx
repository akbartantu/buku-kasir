import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate("/signin", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <h1 className="text-elder-lg font-black flex items-center gap-2">
          <img src="/icons/logo-buku-kasir.png" alt="" className="h-8 w-8 rounded object-contain" />
          Buku Kasir
        </h1>
        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="max-w-[120px] truncate text-elder-sm text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {user.fullName || user.username || user.email}
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="touch-target"
            aria-label="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
