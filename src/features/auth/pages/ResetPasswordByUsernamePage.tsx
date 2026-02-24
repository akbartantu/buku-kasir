import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const resetByUsernameSchema = z
  .object({
    username: z.string().min(1, "Username wajib diisi"),
    newPassword: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Kata sandi tidak sama",
    path: ["confirmPassword"],
  });

type ResetByUsernameFormValues = z.infer<typeof resetByUsernameSchema>;

export default function ResetPasswordByUsernamePage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetByUsernameFormValues>({
    resolver: zodResolver(resetByUsernameSchema),
    defaultValues: { username: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetByUsernameFormValues) {
    setError(null);
    try {
      await authApi.resetPasswordByUsername(values.username.trim(), values.newPassword);
      setSuccess(true);
      setTimeout(() => {
        navigate("/signin", { replace: true });
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengubah kata sandi.");
    }
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
          <CardTitle className="text-elder-xl">Lupa kata sandi</CardTitle>
          <CardDescription>
            Masukkan username akun Anda dan kata sandi baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="username"
                        placeholder="Username akun Anda"
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
