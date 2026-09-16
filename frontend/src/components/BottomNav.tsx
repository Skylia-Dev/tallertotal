"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, ClipboardList, Users, Car, Receipt, Package, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModuleConfig } from "@/contexts/ModuleConfigContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, moduleKey: null },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList, moduleKey: "ordenes" },
  { href: "/clientes", label: "Clientes", icon: Users, moduleKey: "clientes" },
  { href: "/vehiculos", label: "Vehículos", icon: Car, moduleKey: "vehiculos" },
  { href: "/ventas", label: "Ventas", icon: Receipt, moduleKey: "ventas" },
  { href: "/articulos", label: "Artículos", icon: Package, moduleKey: "articulos" },
];

const mechanicItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mis-ordenes", label: "Mis Órdenes", icon: ClipboardCheck },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hiddenModules } = useModuleConfig();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const roleMatch = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setRole(roleMatch ? decodeURIComponent(roleMatch[1]) : null);
  }, []);

  const items = role === "Mechanic"
    ? mechanicItems
    : navItems.filter(({ moduleKey }) => moduleKey === null || !hiddenModules.has(moduleKey));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex md:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
            pathname === href ? "text-blue-600" : "text-muted-foreground"
          )}
        >
          <Icon className={cn("h-5 w-5", pathname === href ? "text-blue-600" : "text-muted-foreground")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
