"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ThemePicker } from "@/components/ThemePicker";

export function Topbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="h-14 shrink-0 border-b bg-white flex items-center justify-end gap-1 px-4 md:px-6">
      <ThemePicker />

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </div>
  );
}
