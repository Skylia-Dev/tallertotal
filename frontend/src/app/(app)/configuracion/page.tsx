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
  Wifi, WifiOff, Timer,
} from "lucide-react";
import {
  adminApi,
  tenantModuleConfigApi,
  tenantProfileApi,
  sessionConfigApi,
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
              isActive ? "border-green-400 bg-green-50" : "border-border hover:bg-muted/60 disabled:opacity-60"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-foreground">{c.name}</span>
              {isActive && <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Activo</span>}
            </div>
            <p className="text-muted-foreground mt-0.5">{c.description}</p>
            {st && (
              <p className="mt-1 text-[11px] font-mono">
                {st.isConfigured
                  ? <span className={st.connectionState?.toLowerCase() === "open" || st.channel === "Meta" ? "text-green-600" : "text-amber-600"}>
                      {st.linkedNumber ?? st.connectionState ?? "configurado"}
                    </span>
                  : <span className="text-muted-foreground">sin configurar</span>}
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
          <p className="text-muted-foreground text-xs">Hacé clic en "Verificar" para ver el estado.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {connected
                ? <><Wifi className="h-4 w-4 text-green-500" /><span className="text-green-700 font-medium">Conectado</span></>
                : <><WifiOff className="h-4 w-4 text-red-400" /><span className="text-red-600 font-medium">Desconectado</span></>}
              {status.connectionState && (
                <span className="text-muted-foreground font-mono text-xs">({status.connectionState})</span>
              )}
              {status.linkedNumber && (
                <span className="text-muted-foreground text-xs">— {status.linkedNumber}</span>
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
                  <p className="text-sm font-mono font-bold tracking-widest bg-muted border rounded px-3 py-2 text-center">{pairingCode}</p>
                )}
                {qr?.qrBase64 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">WhatsApp → ⋮ → <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong></p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr.qrBase64} alt="QR WhatsApp" className="w-56 h-56 border-2 border-border rounded-xl" />
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
                <p className="text-xs text-muted-foreground font-medium">Mensaje de prueba</p>
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
          <p className="text-muted-foreground text-xs">Hacé clic en "Verificar" para ver el estado.</p>
        ) : status.isConfigured ? (
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-700 font-medium">Configurado</span>
            <span className="text-muted-foreground text-xs">— envía desde {status.from}</span>
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
        <p className="text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">Verificando…</p>
        ) : status ? (
          <>
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {status.isConfigured
                ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">✅ Configurado</Badge>
                : <Badge variant="destructive" className="text-xs">❌ No configurado</Badge>}
              {status.publicKeyPreview && (
                <span className="text-muted-foreground font-mono text-xs">{status.publicKeyPreview}</span>
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
              <div className="space-y-3 border border-border rounded-xl p-3 bg-muted">
                <p className="text-xs text-muted-foreground font-medium">
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
                <p className="text-xs font-semibold text-muted-foreground">Mecánicos con push activo:</p>
                {subs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 bg-muted rounded-lg px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground ml-1.5">({s.tenantName})</span>
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
                  <p className="text-xs font-semibold text-muted-foreground">Public Key (copiar a Vercel):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-[10px] font-mono bg-muted rounded px-2 py-1.5 break-all text-foreground leading-relaxed">
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

// ── Sesión ────────────────────────────────────────────────────────────────────

function SessionTimeoutCard() {
  const [minutes, setMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    sessionConfigApi.get()
      .then((c) => setMinutes(c.sessionTimeoutMinutes))
      .catch(() => toast.error("No se pudo cargar la configuración de sesión"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (minutes === null || minutes < 1 || minutes > 1440) {
      toast.error("Ingresá un valor entre 1 y 1440 minutos");
      return;
    }
    setSaving(true);
    try {
      await sessionConfigApi.update(minutes);
      toast.success("Guardado ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Timer className="h-4 w-4" /> Cierre de sesión por inactividad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Si nadie usa el sistema durante este tiempo, la sesión se cierra automáticamente.
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={1440}
                value={minutes ?? ""}
                onChange={(e) => setMinutes(e.target.value ? Number(e.target.value) : null)}
                className="w-24 text-sm"
              />
              <span className="text-xs text-muted-foreground">minutos</span>
              <Button size="sm" onClick={handleSave} disabled={saving} className="ml-auto h-8 text-xs">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Teléfono de WhatsApp del taller, usado en la Libreta Digital pública (branding + botón "Pedir turno")
function TallerCard() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tenantProfileApi.get()
      .then((p) => setPhone(p.phone ?? ""))
      .catch(() => toast.error("No se pudo cargar la configuración del taller"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantProfileApi.update(phone);
      toast.success("Guardado ✓");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <QrCode className="h-4 w-4" /> Libreta Digital del vehículo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              WhatsApp del taller que se muestra en la libreta pública de cada vehículo (botón &quot;Pedir turno&quot;).
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="tel"
                placeholder="+54 9 291 ..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs shrink-0">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </>
        )}
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
      <SessionTimeoutCard />
      <TallerCard />
    </div>
  );
}

// ── Módulos tab ───────────────────────────────────────────────────────────────
// Matriz módulo × rol: qué ve cada rol en su menú. Mechanic no aparece acá — tiene
// su propio menú fijo y reducido (Dashboard + Mis Órdenes), no basado en estas keys.

const CONFIGURABLE_ROLES: { key: string; label: string }[] = [
  { key: "Owner", label: "Dueño" },
  { key: "Admin", label: "Administrador" },
  { key: "Employee", label: "Empleado" },
  { key: "SuperAdmin", label: "SuperAdmin" },
];

function ModulosTab() {
  const [hiddenByRole, setHiddenByRole] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    tenantModuleConfigApi.getAll()
      .then((r) => {
        const next: Record<string, Set<string>> = {};
        for (const role of CONFIGURABLE_ROLES) next[role.key] = new Set(r[role.key] ?? []);
        setHiddenByRole(next);
      })
      .catch(() => toast.error("No se pudieron cargar los módulos"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (role: string, key: string) => {
    setHiddenByRole((prev) => {
      const next = new Set(prev[role]);
      next.has(key) ? next.delete(key) : next.add(key);
      return { ...prev, [role]: next };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        CONFIGURABLE_ROLES.map((role) =>
          tenantModuleConfigApi.update(role.key, Array.from(hiddenByRole[role.key] ?? []))
        )
      );
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
          <Settings className="h-4 w-4" /> Módulos visibles por rol
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Desmarcá lo que cada rol no necesita ver en su menú — Mecánico ya tiene su propio menú aparte
              (Dashboard + Mis Órdenes) y no se configura acá.
            </p>
            <div className="overflow-x-auto pt-2 border-t">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-muted-foreground py-2 pr-2">Módulo</th>
                    {CONFIGURABLE_ROLES.map((role) => (
                      <th key={role.key} className="text-center font-medium text-muted-foreground py-2 px-2 whitespace-nowrap">
                        {role.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HIDEABLE_MODULES.map((m) => (
                    <tr key={m.key} className="border-b border-border last:border-0">
                      <td className="py-2 pr-2">{m.label}</td>
                      {CONFIGURABLE_ROLES.map((role) => (
                        <td key={role.key} className="text-center py-2 px-2">
                          <input
                            type="checkbox"
                            checked={!(hiddenByRole[role.key]?.has(m.key))}
                            onChange={() => toggle(role.key, m.key)}
                            className="h-4 w-4 rounded border-border cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">Panel de control del sistema</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
