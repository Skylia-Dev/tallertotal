"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Users, Car, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModuleConfig } from "@/contexts/ModuleConfigContext";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, moduleKey: null },
  { href: "/ordenes", label: "Órdenes", icon: ClipboardList, moduleKey: "ordenes" },
  { href: "/clientes", label: "Clientes", icon: Users, moduleKey: "clientes" },
  { href: "/vehiculos", label: "Vehículos", icon: Car, moduleKey: "vehiculos" },
  { href: "/mecanicos", label: "Mecánicos", icon: Wrench, moduleKey: "mecanicos" },
  { href: "/articulos", label: "Artículos", icon: Package, moduleKey: "articulos" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { hiddenModules } = useModuleConfig();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex md:hidden">
      {navItems.filter(({ moduleKey }) => moduleKey === null || !hiddenModules.has(moduleKey)).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors",
            pathname === href ? "text-blue-600" : "text-gray-400"
          )}
        >
          <Icon className={cn("h-5 w-5", pathname === href ? "text-blue-600" : "text-gray-400")} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
