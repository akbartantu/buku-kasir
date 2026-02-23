import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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

function isValidUsernameOrEmail(value: string): boolean {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) return z.string().email().safeParse(trimmed).success;
  return true;
}

const signInSchema = z.object({
  usernameOrEmail: z
    .string()
    .min(1, "Username atau email wajib diisi")
    .refine(isValidUsernameOrEmail, "Masukkan email yang valid jika menggunakan email"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { usernameOrEmail: "", password: "" },
  });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";

  async function onSubmit(values: SignInFormValues) {
    setError(null);
    try {
      await signIn(values.usernameOrEmail.trim(), values.password);
      navigate(from, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login gagal");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/icons/logo-buku-kasir.png" alt="" className="mx-auto mb-2 h-12 w-12 rounded object-contain" aria-hidden />
          <CardTitle className="text-elder-xl">Masuk</CardTitle>
          <CardDescription>Masukkan username atau email dan kata sandi</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <FormField
                control={form.control}
                name="usernameOrEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username atau email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="Username atau nama@contoh.com"
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
                        autoComplete="current-password"
                        placeholder="••••••••"
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
                {form.formState.isSubmitting ? "Memproses..." : "Masuk"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/lupa-password" className="font-medium text-primary underline">
                  Lupa kata sandi?
                </Link>
              </p>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="font-bold text-primary underline">
              Daftar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
