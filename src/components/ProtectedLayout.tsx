import { Outlet } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export function ProtectedLayout() {
  return (
    <>
      <AppHeader />
      <Outlet />
      <BottomNav />
    </>
  );
}
