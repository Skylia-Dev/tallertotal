"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus, Loader2, Send, QrCode, RefreshCw, Plug, Settings,
  Wifi, WifiOff,
} from "lucide-react";
import {
  adminApi,
  tenantModuleConfigApi,
  type WhatsAppStatusResponse,
  type WhatsAppQrResponse,
  type WhatsAppChannelsResponse,
  type WhatsAppChannelId,
  type EmailStatusResponse,
  type PushStatusResponse,
} from "@/lib/api";
import { HIDEABLE_MODULES } from "@/lib/modules";

// ── WhatsApp card ─────────────────────────────────────────────────────────────

const CANALES: { id: WhatsAppChannelId; name: string; description: string }[] = [
  { id: "Evolution", name: "Evolution API", description: "WhatsApp Web no oficial — requiere escanear QR" },
  { id: "Meta", name: "Meta Cloud API", description: "API oficial de WhatsApp Business — token de acceso, sin QR" },
];

function ChannelPicker({ channels, onSwitch, switching }: {
  channels: WhatsAppChannelsResponse | null;
  onSwitch: (id: WhatsAppChannelId) => void;
  switching: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 pb-2 border-b">
      {CANALES.map((c) => {
        const isActive = channels?.active === c.id;
        const st = channels?.channels[c.id];
        return (
          <button
            key={c.id}
            onClick={() => !isActive && onSwitch(c.id)}
            disabled={switching || isActive}
            className={`text-left rounded-lg border px-2.5 py-2 text-xs transition-colors ${
              isActive ? "border-green-400 bg-green-50" : "border-gray-200 hover:bg-gray-50 disabled:opacity-60"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-gray-800">{c.name}</span>
              {isActive && <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Activo</span>}
            </div>
            <p className="text-gray-400 mt-0.5">{c.description}</p>
            {st && (
              <p className="mt-1 text-[11px] font-mono">
                {st.isConfigured
                  ? <span className={st.connectionState?.toLowerCase() === "open" || st.channel === "Meta" ? "text-green-600" : "text-amber-600"}>
                      {st.linkedNumber ?? st.connectionState ?? "configurado"}
                    </span>
                  : <span className="text-gray-400">sin configurar</span>}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WhatsAppCard() {
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [channels, setChannels] = useState<WhatsAppChannelsResponse | null>(null);
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [qr, setQr] = useState<WhatsAppQrResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopQrTimer = () => {
    if (qrTimerRef.current) { clearInterval(qrTimerRef.current); qrTimerRef.current = null; }
  };

  const checkStatus = useCallback(async () => {
    setLoading(true); setQr(null); setPairingCode(null); stopQrTimer(); setQrCountdown(0);
    try {
      const [s, ch] = await Promise.all([adminApi.getWhatsAppStatus(), adminApi.getWhatsAppChannels()]);
      setStatus(s);
      setChannels(ch);
    }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error al verificar"); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSwitchChannel = async (id: WhatsAppChannelId) => {
    setSwitching(true);
    try {
      await adminApi.setWhatsAppChannel(id);
      toast.success(`Canal activo: ${id}`);
      await checkStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar de canal");
    } finally {
      setSwitching(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await adminApi.whatsAppLogout();
      toast.success("Sesión cerrada");
      await checkStatus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar sesión");
    } finally {
      setLoggingOut(false);
    }
  };

  const handlePairingCode = async () => {
    if (!testPhone.trim()) { toast.error("Ingresá un teléfono primero"); return; }
    try {
      const { code } = await adminApi.getWhatsAppPairingCode(testPhone.trim());
      setPairingCode(code);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar el código");
    }
  };

  const fetchQr = useCallback(async () => {
    setLoadingQr(true);
    try {
      const result = await adminApi.getWhatsAppQr();
      setQr(result);
      if (result.isAlreadyConnected) {
        toast.success("¡Ya está conectado!");
        stopQrTimer(); setQrCountdown(0);
        await checkStatus();
      } else if (result.qrBase64) {
        setQrCountdown(18);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al obtener QR");
    } finally {
      setLoadingQr(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkStatus]);

  useEffect(() => {
    if (qrCountdown <= 0) return;
    const t = setTimeout(() => setQrCountdown((c) => { if (c <= 1) { fetchQr(); return 0; } return c - 1; }), 1000);
    return () => clearTimeout(t);
  }, [qrCountdown, fetchQr]);

  useEffect(() => () => stopQrTimer(), []);

  const connected = status?.connectionState?.toLowerCase() === "open";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="text-xl">💬</span> WhatsApp
          </CardTitle>
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading} className="h-7 text-xs gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <ChannelPicker channels={channels} onSwitch={handleSwitchChannel} switching={switching} />

        {!status ? (
          <p className="text-gray-400 text-xs">Hacé clic en "Verificar" para ver el estado.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {connected
                ? <><Wifi className="h-4 w-4 text-green-500" /><span className="text-green-700 font-medium">Conectado</span></>
                : <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-red-600 font-medium">Desconectado</span></>}
              {status.connectionState && (
                <span className="text-gray-400 font-mono text-xs">({status.connectionState})</span>
              )}
              {status.linkedNumber && (
                <span className="text-gray-500 text-xs">— {status.linkedNumber}</span>
              )}
            </div>

            {!status.isConfigured && (
              <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 space-y-0.5">
                <p className="font-semibold">Variables faltantes en Railway:</p>
                <p className="font-mono">
                  {status.channel === "Meta"
                    ? "Meta__PhoneNumberId · Meta__AccessToken"
                    : "Evolution__BaseUrl · Evolution__ApiKey · Evolution__Instance"}
                </p>
              </div>
            )}

            {status.channel === "Meta" && status.isConfigured && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Meta solo entrega texto libre dentro de las 24h desde el último mensaje del cliente.
                Fuera de esa ventana el envío se acepta pero no llega — para avisos automáticos confiables
                (orden creada, cambio de estado, etc.) hacen falta plantillas aprobadas en Meta Business Manager.
              </p>
            )}

            {status.error && (
              <div className="text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 font-mono break-all">
                {status.error}
              </div>
            )}

            {status.isConfigured && status.supportsLinking && !connected && (
              <div className="space-y-2 pt-1 border-t">
                <p className="text-xs text-amber-600 font-medium">⚠️ Sesión desconectada — re-escanear QR</p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={fetchQr} disabled={loadingQr} className="gap-1.5 h-8 text-xs">
                    {loadingQr ? <Loader2 className="h-3 w-3 animate-spin" /> : <QrCode className="h-3 w-3" />}
                    Mostrar QR
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePairingCode} className="h-8 text-xs">
                    Código de vinculación
                  </Button>
                </div>
                {pairingCode && (
                  <p className="text-sm font-mono font-bold tracking-widest bg-gray-50 border rounded px-3 py-2 text-center">{pairingCode}</p>
                )}
                {qr?.qrBase64 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">WhatsApp → ⋮ → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong></p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr.qrBase64} alt="QR WhatsApp" className="w-56 h-56 border-2 border-gray-200 rounded-xl" />
                    <div className="flex items-center gap-2">
                      {qrCountdown > 0
                        ? <span className="text-xs text-amber-600">Actualizando en {qrCountdown}s…</span>
                        : <Button size="sm" variant="outline" onClick={fetchQr} disabled={loadingQr} className="h-7 text-xs gap-1"><RefreshCw className="h-3 w-3" />Nuevo QR</Button>}
                      <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading} className="h-7 text-xs gap-1 text-green-700 border-green-300">
                        <RefreshCw className="h-3 w-3" />Verificar
                      </Button>
                    </div>
                  </div>
                )}
                {qr?.error && <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{qr.error}</p>}
              </div>
            )}

            {status.isConfigured && connected && (
              <div className="space-y-2 pt-1 border-t">
                <p className="text-xs text-gray-500 font-medium">Mensaje de prueba</p>
                <div className="flex gap-2">
                  <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+54 9 291 414-1049" className="text-xs h-8" />
                  <Button size="sm" onClick={async () => { setTesting(true); try { await adminApi.testWhatsApp(testPhone.trim()); toast.success("Enviado ✓"); } catch (err) { toast.error(err instanceof Error ? err.message : "Error"); } finally { setTesting(false); } }} disabled={testing || !testPhone.trim()} className="h-8">
                    {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
                {status.supportsLinking && (
                  <Button size="sm" variant="outline" onClick={handleLogout} disabled={loggingOut} className="h-7 text-xs text-red-600 border-red-200">
                    {loggingOut ? "Cerrando..." : "Cerrar sesión vinculada"}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Email card ────────────────────────────────────────────────────────────────

function EmailCard() {
  const [status, setStatus] = useState<EmailStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try { setStatus(await adminApi.getEmailStatus()); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Error al verificar"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="text-xl">📧</span> Email
          </CardTitle>
          <Button size="sm" variant="outline" onClick={checkStatus} disabled={loading} className="h-7 text-xs gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Verificar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!status ? (
          <p className="text-gray-400 text-xs">Hacé clic en "Verificar" para ver el estado.</p>
        ) : status.isConfigured ? (
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-700 font-medium">Configurado</span>
            <span className="text-gray-400 text-xs">— envía desde {status.from}</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-red-400" />
              <span className="text-red-600 font-medium">No configurado</span>
            </div>
            <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-700 space-y-0.5">
              <p className="font-semibold">Variables faltantes en Railway:</p>
              <p className="font-mono">Resend__ApiKey · Resend__From</p>
              <p className="text-amber-600">Requiere un dominio propio verificado en Resend para el remitente.</p>
            </div>
          </>
        )}
        <p className="text-xs text-gray-400">
          Se usa para avisar al cliente por email cuando se crea una orden, cambia de estado o hay un presupuesto listo — en paralelo a WhatsApp.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Push card ─────────────────────────────────────────────────────────────────

type PushSub = { id: string; name: string; tenantName: string };

function PushCard() {
  const [status, setStatus] = useState<PushStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [pubKey, setPubKey] = useState("");
  const [privKey, setPrivKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [subs, setSubs] = useState<PushSub[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, subscriptions] = await Promise.all([
        adminApi.getPushStatus(),
        adminApi.getPushSubscriptions().catch(() => [] as PushSub[]),
      ]);
      setStatus(s);
      setSubs(subscriptions);
    }
    catch { toast.error("No se pudo verificar Push"); }
    finally { setLoading(false); }
  }, []);

  const handleTestPush = async (mechanicId: string, mechanicName: string) => {
    setTestingId(mechanicId);
    try {
      const result = await adminApi.testPush(mechanicId);
      if (result.ok) {
        toast.success(`✅ Push enviado a ${mechanicName} — revisá el teléfono`);
      } else {
        toast.error(`❌ Error: ${result.error}`, { duration: 8000 });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar test");
    } finally {
      setTestingId(null);
    }
  };

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!pubKey.trim() || !privKey.trim()) {
      toast.error("Ambas claves son requeridas");
      return;
    }
    setSaving(true);
    try {
      await adminApi.setVapidKeys(pubKey.trim(), privKey.trim());
      toast.success("Claves VAPID guardadas en la base de datos ✓");
      setPubKey("");
      setPrivKey("");
      setShowForm(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <span className="text-xl">🔔</span> Push (VAPID)
          </CardTitle>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-7 text-xs gap-1">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading && !status ? (
          <p className="text-xs text-gray-400">Verificando…</p>
        ) : status ? (
          <>
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {status.isConfigured
                ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✅ Configurado</Badge>
                : <Badge variant="destructive" className="text-xs">❌ No configurado</Badge>}
              {status.publicKeyPreview && (
                <span className="text-gray-400 font-mono text-xs">{status.publicKeyPreview}</span>
              )}
              {status.source === "database" && (
                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">DB</span>
              )}
            </div>

            {/* Configure form */}
            {!showForm ? (
              <Button
                size="sm" variant="outline"
                onClick={() => setShowForm(true)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                {status.isConfigured ? "Actualizar claves" : "Configurar claves VAPID"}
              </Button>
            ) : (
              <div className="space-y-3 border border-gray-200 rounded-xl p-3 bg-gray-50">
                <p className="text-xs text-gray-500 font-medium">
                  Las claves se guardan en la base de datos (no dependen de Railway).
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Public Key (VAPID)</Label>
                  <Input
                    value={pubKey}
                    onChange={(e) => setPubKey(e.target.value)}
                    placeholder="BPxxxxxx…"
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Private Key (VAPID)</Label>
                  <Input
                    value={privKey}
                    onChange={(e) => setPrivKey(e.target.value)}
                    placeholder="xxxxxxxx…"
                    className="text-xs font-mono h-8"
                    type="password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setPubKey(""); setPrivKey(""); }} className="h-7 text-xs">
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Subscriptions + test */}
            {subs.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-semibold text-gray-600">Mecánicos con push activo:</p>
                {subs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-gray-800">{s.name}</span>
                      <span className="text-xs text-gray-400 ml-1.5">({s.tenantName})</span>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="h-6 text-xs gap-1"
                      disabled={testingId === s.id}
                      onClick={() => handleTestPush(s.id, s.name)}
                    >
                      {testingId === s.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Send className="h-3 w-3" />}
                      Test
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Once configured: public key + step-by-step */}
            {status.isConfigured && status.publicKey && (
              <div className="space-y-3 border-t pt-3">
                {/* Public key copy */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-600">Public Key (copiar a Vercel):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] font-mono bg-gray-100 rounded px-2 py-1.5 break-all text-gray-700 leading-relaxed">
                      {status.publicKey}
                    </code>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(status.publicKey!);
                        toast.success("Public Key copiada");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>

                {/* Steps */}
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-amber-800 space-y-1.5">
                  <p className="font-semibold">Pasos para que lleguen los push:</p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-700">
                    <li>En <strong>Vercel</strong> → Settings → Environment Variables</li>
                    <li>Actualizar <code className="font-mono bg-amber-100 px-0.5 rounded">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> con la key de arriba</li>
                    <li>Hacer <strong>Redeploy</strong> en Vercel (para que tome la nueva key)</li>
                    <li>Mecánico: <strong>Desactivar</strong> notificaciones y luego <strong>Activar</strong> de nuevo</li>
                  </ol>
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ── Integraciones tab ─────────────────────────────────────────────────────────

function IntegracionesTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <WhatsAppCard />
      <EmailCard />
      <PushCard />
    </div>
  );
}

// ── Módulos tab ───────────────────────────────────────────────────────────────

function ModulosTab() {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tenantModuleConfigApi.get()
      .then((r) => setHidden(new Set(r.hiddenModules)))
      .catch(() => toast.error("No se pudieron cargar los módulos"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantModuleConfigApi.update(Array.from(hidden));
      toast.success("Cambios guardados");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Settings className="h-4 w-4" /> Módulos visibles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Desmarcá los módulos que no se usan — desaparecen del menú para todos los usuarios.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2 pt-3 border-t">
              {HIDEABLE_MODULES.map((m) => (
                <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={!hidden.has(m.key)}
                    onChange={() => toggle(m.key)}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                  {m.label}
                </label>
              ))}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = "integraciones" | "modulos";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "integraciones", label: "Integraciones", icon: <Plug className="h-4 w-4" /> },
  { key: "modulos",       label: "Módulos",       icon: <Settings className="h-4 w-4" /> },
];

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<Tab>("integraciones");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">Panel de control del sistema</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "integraciones" && <IntegracionesTab />}
      {tab === "modulos"       && <ModulosTab />}
    </div>
  );
}
