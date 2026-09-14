"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Car, ClipboardList, Wrench, Package, Truck, ShoppingBag, Receipt, Wallet, FileText, Banknote, BarChart3, History, UserRound, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { TallerTotalLogo } from "@/components/TallerTotalLogo";
import { ThemePicker } from "@/components/ThemePicker";
import { useModuleConfig } from "@/contexts/ModuleConfigContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, moduleKey: null },
  { href: "/ordenes", label: "Órdenes de Servicio", icon: ClipboardList, moduleKey: "ordenes" },
  { href: "/clientes", label: "Clientes", icon: Users, moduleKey: "clientes" },
  { href: "/vehiculos", label: "Vehículos", icon: Car, moduleKey: "vehiculos" },
  { href: "/mecanicos", label: "Mecánicos", icon: Wrench, moduleKey: "mecanicos" },
  { href: "/articulos", label: "Artículos", icon: Package, moduleKey: "articulos" },
  { href: "/proveedores", label: "Proveedores", icon: Truck, moduleKey: "proveedores" },
  { href: "/compras", label: "Compras", icon: ShoppingBag, moduleKey: "compras" },
  { href: "/ventas", label: "Ventas", icon: Receipt, moduleKey: "ventas" },
  { href: "/presupuestos", label: "Presupuestos", icon: FileText, moduleKey: "presupuestos" },
  { href: "/deudas", label: "Deudas", icon: Wallet, moduleKey: "deudas" },
  { href: "/caja", label: "Caja", icon: Banknote, moduleKey: "caja" },
  { href: "/informes", label: "Informes", icon: BarChart3, moduleKey: "informes" },
  { href: "/auditoria", label: "Auditoría", icon: History, moduleKey: "auditoria" },
];

const ownerOnlyItems = [
  { href: "/empleados", label: "Empleados", icon: UserRound },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { hiddenModules } = useModuleConfig();
  const [tenantName, setTenantName] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const tenantMatch = document.cookie.match(/(?:^|;\s*)tallertotal_tenant=([^;]*)/);
    if (tenantMatch) setTenantName(decodeURIComponent(tenantMatch[1]));
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setIsOwner(roleMatch ? decodeURIComponent(roleMatch[1]) === "Owner" : false);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-800">
        <TallerTotalLogo dark />
        {tenantName && (
          <p className="mt-1.5 text-xs text-slate-500 truncate">
            <span className="text-slate-400 font-medium">Taller:</span> {tenantName}
          </p>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.filter(({ moduleKey }) => moduleKey === null || !hiddenModules.has(moduleKey)).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
        {isOwner && ownerOnlyItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-slate-800 space-y-1">
        <ThemePicker />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
