import type { Libreta } from "@/types";
import { Droplets, Wrench, Calendar, Gauge, User } from "lucide-react";
import { LibretaPrintButton } from "@/components/LibretaPrintButton";

interface Props {
  params: Promise<{ token: string }>;
}

async function fetchLibreta(token: string): Promise<Libreta | null> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/api/portal/vehicle/${token}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const DUE_STYLE: Record<NonNullable<Libreta["dueStatus"]>, { label: string; badge: string; bar: string }> = {
  Vencido: { label: "Cambio vencido", badge: "bg-red-50 text-red-700 border-red-200", bar: "bg-red-500" },
  Proximo: { label: "Próximo a vencer", badge: "bg-amber-50 text-amber-700 border-amber-200", bar: "bg-amber-500" },
  AlDia: { label: "Al día", badge: "bg-green-50 text-green-700 border-green-200", bar: "bg-green-500" },
};

function waLink(phone: string | undefined, licensePlate: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const text = encodeURIComponent(`Hola! Quiero pedir un turno para mi ${licensePlate}.`);
  return `https://wa.me/${digits}?text=${text}`;
}

export default async function LibretaPage({ params }: Props) {
  const { token } = await params;
  const libreta = await fetchLibreta(token);

  if (!libreta) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow text-center max-w-sm">
          <p className="text-2xl mb-2">🔍</p>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Libreta no encontrada</h1>
          <p className="text-sm text-gray-500">El enlace puede haber expirado o ser incorrecto.</p>
        </div>
      </div>
    );
  }

  const turnoLink = waLink(libreta.tallerPhone, libreta.licensePlate);
  const due = libreta.dueStatus ? DUE_STYLE[libreta.dueStatus] : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-lg mx-auto space-y-4 print:space-y-3">

        <div className="print:hidden flex justify-end">
          <LibretaPrintButton targetId="libreta-content" fileName={`libreta-${libreta.licensePlate}.pdf`} />
        </div>

        <div id="libreta-content" className="space-y-4 print:space-y-3">

          {/* Cover: branding del taller + datos del vehículo, como una tarjeta única */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-center print:bg-blue-700">
              <p className="font-bold text-white text-xl tracking-tight">{libreta.tallerName}</p>
              <p className="text-blue-100 text-xs mt-0.5 uppercase tracking-wider font-medium">Libreta digital de service</p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-mono font-bold text-2xl text-slate-900 tracking-wide">{libreta.licensePlate}</p>
                <p className="text-sm text-slate-500 mt-0.5">{libreta.vehicleDescription}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-end gap-1">
                  <User className="h-3 w-3" /> Titular
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{libreta.customerName}</p>
              </div>
            </div>
          </div>

          {/* Próximo service, destacado con barra de color según urgencia */}
          {(libreta.nextServiceDate || libreta.nextServiceKm) && (
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-slate-300 print:break-inside-avoid">
              {due && <div className={`absolute left-0 top-0 bottom-0 w-1 ${due.bar}`} />}
              <div className="p-5 pl-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Próximo cambio de aceite</p>
                  {due && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${due.badge}`}>{due.label}</span>
                  )}
                </div>
                <div className="flex gap-6 flex-wrap">
                  {libreta.nextServiceDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {new Date(libreta.nextServiceDate + "T00:00:00").toLocaleDateString("es-AR")}
                        </p>
                        {libreta.daysRemaining !== undefined && libreta.daysRemaining !== null && (
                          <p className="text-xs text-slate-400">
                            {libreta.daysRemaining <= 0 ? `venció hace ${Math.abs(libreta.daysRemaining)} días` : `en ${libreta.daysRemaining} días`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {libreta.nextServiceKm && (
                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{libreta.nextServiceKm.toLocaleString("es-AR")} km</p>
                        {libreta.kmRemaining !== undefined && libreta.kmRemaining !== null && (
                          <p className="text-xs text-slate-400">
                            {libreta.kmRemaining <= 0 ? `superado por ${Math.abs(libreta.kmRemaining).toLocaleString("es-AR")} km` : `faltan ${libreta.kmRemaining.toLocaleString("es-AR")} km`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {turnoLink && (
                  <a
                    href={turnoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="print:hidden mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 transition-colors"
                  >
                    Pedir turno por WhatsApp
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 print:shadow-none print:border-slate-300">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5" /> Historial de services
            </p>

            {libreta.services.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Todavía no hay services registrados.</p>
            ) : (
              <div className="space-y-4">
                {libreta.services.map((s, i) => {
                  const filters = [
                    s.changedOilFilter && "filtro de aceite",
                    s.changedAirFilter && "filtro de aire",
                    s.changedCabinFilter && "filtro de habitáculo",
                    s.changedFuelFilter && "filtro de combustible",
                  ].filter(Boolean) as string[];

                  return (
                    <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:pb-0 pb-4 print:break-inside-avoid">
                      <div className="absolute -left-[7px] top-0.5 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-50 print:ring-0" />
                      <p className="text-sm font-semibold text-slate-800">
                        {new Date(s.date).toLocaleDateString("es-AR")}
                        {s.mileageIn && <span className="font-normal text-slate-400"> · {s.mileageIn.toLocaleString("es-AR")} km</span>}
                      </p>
                      {(s.oilBrand || s.oilType) && (
                        <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {[s.oilBrand, s.oilType, s.oilLiters && `${s.oilLiters}L`].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {filters.length > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">Cambio de {filters.join(", ")}</p>
                      )}
                      {s.notes && <p className="text-xs text-slate-500 mt-1 italic">{s.notes}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 pb-4">
            {libreta.tallerName} · Libreta digital del vehículo · TallerTotal
          </p>
        </div>
      </div>
    </div>
  );
}
