import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setEmail(user.email ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setError(null);
    setLoading(true);
    try {
      await updateProfile({ fullName: fullName.trim() || undefined, email: email.trim() || undefined });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
    setError(null);
    setEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-28 px-4 pt-4">
        <div className="mx-auto max-w-md">
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 px-4 pt-4">
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="touch-target rounded-xl bg-secondary flex items-center justify-center p-3 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <h1 className="text-elder-xl font-black">Profil</h1>
        </div>

        <div className="space-y-4">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <div className="space-y-2">
            <Label>Nama lengkap</Label>
            {editing ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap"
              />
            ) : (
              <p className="text-elder-base border rounded-lg px-3 py-2 bg-muted/50 text-foreground">
                {user.fullName || "—"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Username</Label>
            <p className="text-elder-base border rounded-lg px-3 py-2 bg-muted/50 text-foreground">
              {user.username ?? "—"}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            {editing ? (
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (opsional)"
              />
            ) : (
              <p className="text-elder-base border rounded-lg px-3 py-2 bg-muted/50 text-foreground">
                {user.email || "—"}
              </p>
            )}
          </div>

          {editing ? (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Batal
              </Button>
            </div>
          ) : (
            <Button onClick={() => setEditing(true)} className="w-full mt-2">
              Edit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
