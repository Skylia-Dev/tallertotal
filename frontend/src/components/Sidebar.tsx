"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Car, ClipboardList, Wrench, Package, Truck, ShoppingBag, Receipt, Wallet, FileText, Banknote, BarChart3, History, UserRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { TallerTotalLogo } from "@/components/TallerTotalLogo";
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

// Ítems visibles solo para ciertos roles, además de los módulos normales de arriba
const restrictedItems = [
  { href: "/empleados", label: "Empleados", icon: UserRound, roles: ["Owner", "SuperAdmin"] },
  { href: "/configuracion", label: "Configuración", icon: Settings, roles: ["SuperAdmin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hiddenModules } = useModuleConfig();
  const [tenantName, setTenantName] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const tenantMatch = document.cookie.match(/(?:^|;\s*)tallertotal_tenant=([^;]*)/);
    if (tenantMatch) setTenantName(decodeURIComponent(tenantMatch[1]));
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setRole(roleMatch ? decodeURIComponent(roleMatch[1]) : null);
  }, []);

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
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
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
        {restrictedItems.filter((item) => role !== null && item.roles.includes(role)).map(({ href, label, icon: Icon }) => (
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
    </aside>
  );
}
