"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Users, Car, ClipboardList, Package, Truck, ShoppingBag, Receipt, Wallet, FileText, Banknote, BarChart3, History, UserRound, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TallerTotalLogo } from "@/components/TallerTotalLogo";
import { useModuleConfig } from "@/contexts/ModuleConfigContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, moduleKey: null },
  { href: "/ordenes", label: "Órdenes de Servicio", icon: ClipboardList, moduleKey: "ordenes" },
  { href: "/clientes", label: "Clientes", icon: Users, moduleKey: "clientes" },
  { href: "/vehiculos", label: "Vehículos", icon: Car, moduleKey: "vehiculos" },
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
  { href: "/usuarios", label: "Usuarios", icon: UserRound, roles: ["Owner", "Admin", "SuperAdmin"] },
];

// El rol Mecánico tiene un menú completamente aparte: nada del resto del taller,
// solo su dashboard restringido y sus propias órdenes.
const mechanicItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mis-ordenes", label: "Mis Órdenes", icon: ClipboardCheck },
];

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { hiddenModules } = useModuleConfig();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setRole(roleMatch ? decodeURIComponent(roleMatch[1]) : null);
  }, []);

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-800">
        <TallerTotalLogo dark />
        {process.env.NEXT_PUBLIC_APP_VERSION && (
          <span className="mt-1.5 inline-block text-[11px] font-mono font-semibold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
            {process.env.NEXT_PUBLIC_APP_VERSION}
          </span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {role === "Mechanic" ? (
          mechanicItems.map((item) => <NavLink key={item.href} {...item} active={pathname === item.href} />)
        ) : (
          <>
            {navItems
              .filter(({ moduleKey }) => moduleKey === null || !hiddenModules.has(moduleKey))
              .map((item) => <NavLink key={item.href} {...item} active={pathname === item.href} />)}
            {restrictedItems
              .filter((item) => role !== null && item.roles.includes(role))
              .map((item) => <NavLink key={item.href} {...item} active={pathname === item.href} />)}
          </>
        )}
      </nav>
    </aside>
  );
}
