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

const forgotSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Masukkan email yang valid"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotFormValues) {
    setError(null);
    setSuccess(false);
    try {
      const result = await authApi.requestPasswordReset(values.email.trim().toLowerCase());
      setSuccess(true);
      if (result.token) {
        navigate(`/reset-password?token=${encodeURIComponent(result.token)}`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim. Coba lagi.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
          <CardTitle className="text-elder-xl">Lupa kata sandi</CardTitle>
          <CardDescription>
            Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm font-medium text-success mb-4">
              Permintaan berhasil. Jika email terdaftar, periksa email Anda untuk tautan reset. Jika Anda diarahkan ke halaman ubah kata sandi, lanjutkan di sana.
            </p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <p className="text-sm font-medium text-destructive">{error}</p>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="nama@contoh.com"
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
                  {form.formState.isSubmitting ? "Memproses..." : "Kirim tautan reset"}
                </Button>
              </form>
            </Form>
          )}
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
