"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Settings, LogOut, ShieldCheck, KeyRound, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemePicker } from "@/components/ThemePicker";
import { TwoFactorDialog } from "@/components/TwoFactorDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { AvatarUpload } from "@/components/AvatarUpload";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [username, setUsername] = useState("");
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  useEffect(() => {
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setIsSuperAdmin(roleMatch ? decodeURIComponent(roleMatch[1]) === "SuperAdmin" : false);
    const usernameMatch = document.cookie.match(/(?:^|;\s*)tallertotal_username=([^;]*)/);
    if (usernameMatch) setUsername(decodeURIComponent(usernameMatch[1]));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="h-14 shrink-0 border-b bg-card flex items-center justify-between gap-2 px-4 md:px-6">
      {username && (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline text-muted-foreground/70">Usuario:</span>{" "}
            <span className="font-medium text-foreground">{username}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-1 shrink-0">
      <AvatarUpload />

      {isSuperAdmin && (
        <Link
          href="/configuracion"
          title="Configuración"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/configuracion" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Configuración</span>
        </Link>
      )}

      <ThemePicker />

      <button
        onClick={() => setChangePasswordOpen(true)}
        title="Cambiar contraseña"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <KeyRound className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Contraseña</span>
      </button>

      <button
        onClick={() => setTwoFactorOpen(true)}
        title="Autenticación de dos factores"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Seguridad</span>
      </button>

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>

      <TwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} />
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </div>
    </div>
  );
}
