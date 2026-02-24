import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";
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

const registerSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap wajib diisi"),
  username: z.string().min(1, "Username wajib diisi"),
  email: z.string().optional(),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", username: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setError(null);
    const payload = {
      fullName: values.fullName.trim(),
      username: values.username.trim(),
      password: values.password,
      email: values.email?.trim() || undefined,
    };
    try {
      await signUp(payload);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pendaftaran gagal");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
          <CardTitle className="text-elder-xl">Daftar</CardTitle>
          <CardDescription>Buat akun dengan username dan kata sandi</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="name"
                        placeholder="Nama lengkap Anda"
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="username"
                        placeholder="Contoh: johndoe"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (opsional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata sandi</FormLabel>
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
              <Button
                type="submit"
                className="w-full touch-target-lg"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Memproses..." : "Daftar"}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/signin" className="font-bold text-primary underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
