import type { Libreta } from "@/types";
import { Droplets, Wrench, Calendar, Gauge } from "lucide-react";

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

const DUE_LABEL: Record<NonNullable<Libreta["dueStatus"]>, { label: string; cls: string }> = {
  Vencido: { label: "Cambio vencido", cls: "bg-red-50 text-red-700 border-red-200" },
  Proximo: { label: "Próximo a vencer", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  AlDia: { label: "Al día", cls: "bg-green-50 text-green-700 border-green-200" },
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
  const due = libreta.dueStatus ? DUE_LABEL[libreta.dueStatus] : null;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header con branding del taller */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
          <span className="font-bold text-slate-900 text-xl">{libreta.tallerName}</span>
          <p className="text-sm text-slate-500 mt-1">Libreta digital de service</p>
        </div>

        {/* Vehículo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-lg text-slate-900">{libreta.licensePlate}</p>
              <p className="text-sm text-slate-500">{libreta.vehicleDescription}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Titular</p>
              <p className="text-sm font-medium text-slate-800">{libreta.customerName}</p>
            </div>
          </div>
        </div>

        {/* Próximo service, destacado */}
        {(libreta.nextServiceDate || libreta.nextServiceKm) && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Próximo cambio de aceite</p>
              {due && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${due.cls}`}>{due.label}</span>
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
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 transition-colors"
              >
                Pedir turno por WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Historial */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
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
                  <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:pb-0 pb-4">
                    <div className="absolute -left-[7px] top-0.5 h-3 w-3 rounded-full bg-blue-500" />
                    <p className="text-sm font-semibold text-slate-800">
                      {new Date(s.date).toLocaleDateString("es-AR")}
                      {s.mileageIn && <span className="font-normal text-slate-400"> · {s.mileageIn.toLocaleString("es-AR")} km</span>}
                    </p>
                    {(s.oilBrand || s.oilType) && (
                      <p className="text-sm text-slate-600 mt-0.5 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5 text-slate-400" />
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
          {libreta.tallerName} · Libreta digital del vehículo
        </p>
      </div>
    </div>
  );
}
