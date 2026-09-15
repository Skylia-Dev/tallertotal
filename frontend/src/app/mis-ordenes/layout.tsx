"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { TallerTotalLogo } from "@/components/TallerTotalLogo";

export default function MisOrdenesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TallerTotalLogo />
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Mecánico
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
