// Keys here must match ModuleRegistry.HideableKeys in the backend.
export interface ModuleDef {
  key: string;
  href: string;
  label: string;
}

export const HIDEABLE_MODULES: ModuleDef[] = [
  { key: "ordenes", href: "/ordenes", label: "Órdenes de Servicio" },
  { key: "clientes", href: "/clientes", label: "Clientes" },
  { key: "vehiculos", href: "/vehiculos", label: "Vehículos" },
  { key: "mecanicos", href: "/mecanicos", label: "Mecánicos" },
  { key: "articulos", href: "/articulos", label: "Artículos" },
  { key: "proveedores", href: "/proveedores", label: "Proveedores" },
  { key: "compras", href: "/compras", label: "Compras" },
  { key: "ventas", href: "/ventas", label: "Ventas" },
  { key: "presupuestos", href: "/presupuestos", label: "Presupuestos" },
  { key: "deudas", href: "/deudas", label: "Deudas" },
  { key: "caja", href: "/caja", label: "Caja" },
  { key: "informes", href: "/informes", label: "Informes" },
  { key: "auditoria", href: "/auditoria", label: "Auditoría" },
];
