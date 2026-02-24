import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InstallPrompt } from "@/components/InstallPrompt";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useStore";
import { Onboarding } from "@/components/Onboarding";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { AdminLayout } from "@/components/AdminLayout";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminPenggunaPage from "@/pages/AdminPenggunaPage";
import AdminTransaksiPage from "@/pages/AdminTransaksiPage";
import AdminPesananPage from "@/pages/AdminPesananPage";
import AdminProdukPage from "@/pages/AdminProdukPage";
import SignInPage from "@/features/auth/pages/SignInPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import ResetPasswordByUsernamePage from "@/features/auth/pages/ResetPasswordByUsernamePage";
import HomePage from "@/pages/HomePage";
import AddSalePage from "@/pages/AddSalePage";
import AddExpensePage from "@/pages/AddExpensePage";
import SummaryPage from "@/pages/SummaryPage";
import ManageProductsPage from "@/pages/ManageProductsPage";
import ShopPage from "@/pages/ShopPage";
import OrdersPage from "@/pages/OrdersPage";
import ProfilPage from "@/pages/ProfilPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { onboarded, completeOnboarding } = useOnboarding();

  if (!onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/lupa-password" element={<ResetPasswordByUsernamePage />} />
      {/* Email-based reset (hidden from UI; re-enable when email is implemented) */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/ringkasan" replace />} />
        <Route path="ringkasan" element={<AdminDashboardPage />} />
        <Route path="pengguna" element={<AdminPenggunaPage />} />
        <Route path="produk" element={<AdminProdukPage />} />
        <Route path="transaksi" element={<AdminTransaksiPage />} />
        <Route path="pesanan" element={<AdminPesananPage />} />
      </Route>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="add-sale" element={<AddSalePage />} />
        <Route path="add-expense" element={<AddExpensePage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="products" element={<ManageProductsPage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="profile" element={<ProfilPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppContent />
          <InstallPrompt />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
