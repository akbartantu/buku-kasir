import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { fetchAdminUsers } from "@/lib/adminApi";

export default function AdminPenggunaPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
    retry: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Daftar Pengguna
        </CardTitle>
        <CardDescription>
          Daftar pengguna terdaftar. Akses hanya untuk admin (set ADMIN_USER_IDS di server).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-muted-foreground">Memuat daftar pengguna…</p>
        )}
        {error && (
          <p className="text-sm font-medium text-destructive">
            {error instanceof Error ? error.message : "Gagal memuat pengguna."}
          </p>
        )}
        {!isLoading && !error && users !== undefined && (
          users.length === 0 ? (
            <p className="text-muted-foreground">Belum ada pengguna terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Username</th>
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Email</th>
                    <th className="pb-2 pr-4 text-left font-medium text-muted-foreground">Peran</th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">{u.username ?? "—"}</td>
                      <td className="py-2 pr-4">{u.fullName ?? "—"}</td>
                      <td className="py-2 pr-4">{u.email ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <span className={u.role === "admin" ? "font-medium text-primary" : "text-muted-foreground"}>
                          {u.role === "admin" ? "Admin" : "Penjual"}
                        </span>
                      </td>
                      <td className="py-2">{u.createdAt ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
