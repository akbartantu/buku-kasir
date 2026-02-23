import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as authApi from "../api/authApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const resetSchema = z
  .object({
    newPassword: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Kata sandi tidak sama",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      setError("Tautan tidak valid. Minta tautan reset baru dari halaman lupa kata sandi.");
    }
  }, [token]);

  async function onSubmit(values: ResetFormValues) {
    if (!token) return;
    setError(null);
    try {
      await authApi.resetPassword(token, values.newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah kata sandi.");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
            <CardTitle className="text-elder-xl">Tautan tidak valid</CardTitle>
            <CardDescription>
              Tautan reset kata sandi tidak valid atau sudah kadaluarsa. Silakan minta tautan baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Ke lupa kata sandi</Link>
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link to="/signin" className="font-bold text-primary underline">
                Kembali ke masuk
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
            <CardTitle className="text-elder-xl text-success">Kata sandi berhasil diubah</CardTitle>
            <CardDescription>
              Anda akan diarahkan ke halaman masuk dalam beberapa detik.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/signin">Masuk sekarang</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
          <CardTitle className="text-elder-xl">Atur ulang kata sandi</CardTitle>
          <CardDescription>Masukkan kata sandi baru untuk akun Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata sandi baru</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Min. 6 karakter"
                        className="touch-target"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi kata sandi</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder="Ulangi kata sandi baru"
                        className="touch-target"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full touch-target-lg"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan kata sandi baru"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/signin" className="font-bold text-primary underline">
              Kembali ke masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
