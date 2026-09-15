export type ServiceOrderStatus = "Open" | "InProgress" | "Completed" | "Cancelled";
export type ServiceItemType = "Labor" | "Part";
export type QuoteStatus = "None" | "Pending" | "Approved" | "Rejected";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
  vehicleCount: number;
}

export interface Vehicle {
  id: string;
  customerId: string;
  customerName: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  notes?: string;
}

export interface ServiceItem {
  id: string;
  description: string;
  type: ServiceItemType;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ServiceOrder {
  id: string;
  vehicleId: string;
  licensePlate: string;
  vehicleDescription: string;
  customerName: string;
  customerPhone: string;
  status: ServiceOrderStatus;
  diagnosisNotes?: string;
  mileageIn?: number;
  assignedMechanic?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
  totalEstimate: number;
  totalFinal: number;
  createdAt: string;
  completedAt?: string;
  quoteStatus: QuoteStatus;
  lastActivityAt: string;
  items: ServiceItem[];
  portalToken: string;
  mpPaymentLinkUrl?: string;
}

// Lean read-only view exposed to the customer via /portal/[token]
export interface PortalOrder {
  id: string;
  licensePlate: string;
  vehicleDescription: string;
  customerName: string;
  status: ServiceOrderStatus;
  quoteStatus: QuoteStatus;
  diagnosisNotes?: string;
  estimatedDeliveryAt?: string;
  totalEstimate: number;
  totalFinal: number;
  createdAt: string;
  completedAt?: string;
  items: ServiceItem[];
}

export interface ServiceOrderLog {
  id: string;
  event: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
}

export interface DashboardMetrics {
  revenueThisMonth: number;
  revenueLastMonth: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  ordersByStatus: { status: string; count: number; revenue: number }[];
  topMechanic?: { name: string; orderCount: number };
  monthlyStats: { month: string; revenue: number; orders: number }[];
  mechanicStats: { name: string; orders: number; revenue: number }[];
  avgTicket: number;
  overdueCount: number;
  completionRate: number;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
}

export interface CreateVehicleDto {
  customerId: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  notes?: string;
}

export interface CreateServiceItemDto {
  description: string;
  type: ServiceItemType;
  quantity: number;
  unitPrice: number;
}

export interface UpdateServiceOrderDto {
  status: ServiceOrderStatus;
  diagnosisNotes?: string;
  mileageIn?: number;
  assignedMechanic?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
  totalEstimate: number;
  totalFinal: number;
  items: CreateServiceItemDto[];
}

export interface CreateServiceOrderDto {
  vehicleId: string;
  diagnosisNotes?: string;
  mileageIn?: number;
  assignedMechanic?: string;
  internalNotes?: string;
  estimatedDeliveryAt?: string;
  items: CreateServiceItemDto[];
}

export interface Mechanic {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  isActive: boolean;
}

export interface CreateMechanicDto {
  name: string;
  phone?: string;
  specialty?: string;
}

export interface Articulo {
  id: string;
  marca: string;
  modelo: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  activo: boolean;
  createdAt: string;
}

export interface CreateArticuloDto {
  marca: string;
  modelo: string;
  descripcion?: string;
  stock: number;
  stockMinimo: number;
  precio: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  createdAt: string;
}

export interface CreateProveedorDto {
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
}

export interface CompraItem {
  id: string;
  articuloId: string;
  articuloNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  fecha: string;
  proveedorId: string;
  proveedorNombre: string;
  createdByUsername: string;
  total: number;
  pagoInmediato: boolean;
  montoPagado: number;
  saldoPendiente: number;
  items: CompraItem[];
}

export interface CompraListItem {
  id: string;
  fecha: string;
  proveedorNombre: string;
  itemsCount: number;
  total: number;
  pagoInmediato: boolean;
  saldoPendiente: number;
}

export interface CompraItemRequest {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateCompraDto {
  proveedorId: string;
  pagoInmediato: boolean;
  items: CompraItemRequest[];
}

export type PaymentMethod = "Contado" | "Tarjeta" | "Transferencia" | "Deuda";

export interface VentaItem {
  id: string;
  articuloId: string;
  articuloNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  id: string;
  fecha: string;
  customerId?: string;
  customerName?: string;
  createdByUsername: string;
  total: number;
  descuento: number;
  formaPago: PaymentMethod;
  montoPagado: number;
  saldoPendiente: number;
  items: VentaItem[];
}

export interface VentaListItem {
  id: string;
  fecha: string;
  customerName?: string;
  itemsCount: number;
  total: number;
  formaPago: PaymentMethod;
}

export interface VentaItemRequest {
  articuloId: string;
  cantidad: number;
  precioUnitario: number;
}

export interface CreateVentaDto {
  customerId?: string;
  descuento: number;
  formaPago: PaymentMethod;
  items: VentaItemRequest[];
}

export interface PresupuestoItem {
  id: string;
  articuloId: string;
  articuloNombre: string;
  stock: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Presupuesto {
  id: string;
  fecha: string;
  vencimiento: string;
  customerId?: string;
  customerName?: string;
  createdByUsername: string;
  total: number;
  observacion?: string;
  vencido: boolean;
  items: PresupuestoItem[];
}

export interface PresupuestoListItem {
  id: string;
  fecha: string;
  vencimiento: string;
  customerName?: string;
  itemsCount: number;
  total: number;
  vencido: boolean;
}

export interface PresupuestoItemRequest {
  articuloId: string;
  cantidad: number;
}

export interface CreatePresupuestoDto {
  customerId?: string;
  vencimiento: string;
  observacion?: string;
  items: PresupuestoItemRequest[];
}

export type CajaMovimientoTipo = "Apertura" | "Cierre" | "Arqueo" | "Retiro" | "Ingreso";

export interface CajaMovimiento {
  id: string;
  fecha: string;
  tipo: CajaMovimientoTipo;
  monto: number;
  observacion?: string;
  createdByUsername: string;
}

export interface CajaResumen {
  movimientos: CajaMovimiento[];
  balance: number;
}

export interface CreateCajaMovimientoDto {
  tipo: CajaMovimientoTipo;
  monto: number;
  observacion?: string;
}

export interface VentasPorFormaPago {
  formaPago: string;
  total: number;
  cantidad: number;
}

export interface InformeResumen {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  totalCompras: number;
  cantidadCompras: number;
  ventasPorFormaPago: VentasPorFormaPago[];
}

export interface VentaPorDia {
  fecha: string;
  total: number;
  cantidad: number;
}

export interface TopArticulo {
  articulo: string;
  unidadesVendidas: number;
  totalVendido: number;
}

export interface StockBajo {
  id: string;
  marca: string;
  modelo: string;
  stock: number;
}

export interface UserListItem {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  // Solo presentes cuando role = "Mechanic"
  mechanicId?: string;
  name?: string;
  phone?: string;
  specialty?: string;
  isActive?: boolean;
}

export interface CreateUserDto {
  username: string;
  password: string;
  role: string;
  // Solo se usan (y son requeridos) cuando role = "Mechanic"
  name?: string;
  phone?: string;
  specialty?: string;
}

export interface ActivityLogItem {
  id: string;
  username: string;
  action: string;
  description: string;
  createdAt: string;
}

export interface ActivityLogPage {
  items: ActivityLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Deuda {
  id: string;
  customerId: string;
  customerName: string;
  ventaId: string;
  montoOriginal: number;
  montoPagado: number;
  saldoPendiente: number;
  createdAt: string;
}
