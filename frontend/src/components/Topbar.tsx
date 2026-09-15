"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, LogOut, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemePicker } from "@/components/ThemePicker";
import { TwoFactorDialog } from "@/components/TwoFactorDialog";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);

  useEffect(() => {
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setIsSuperAdmin(roleMatch ? decodeURIComponent(roleMatch[1]) === "SuperAdmin" : false);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="h-14 shrink-0 border-b bg-white flex items-center justify-end gap-1 px-4 md:px-6">
      {isSuperAdmin && (
        <Link
          href="/configuracion"
          title="Configuración"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/configuracion" ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Configuración</span>
        </Link>
      )}

      <ThemePicker />

      <button
        onClick={() => setTwoFactorOpen(true)}
        title="Autenticación de dos factores"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Seguridad</span>
      </button>

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <TwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} />
    </div>
  );
}
