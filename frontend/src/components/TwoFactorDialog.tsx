"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { twoFactorApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

type Phase = "loading" | "status" | "setup" | "disable";

export function TwoFactorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhase("loading");
    setCode("");
    setPassword("");
    twoFactorApi
      .getStatus()
      .then((s) => {
        setEnabled(s.enabled);
        setPhase("status");
      })
      .catch(() => {
        toast.error("No se pudo cargar el estado de 2FA");
        onOpenChange(false);
      });
  }, [open, onOpenChange]);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const res = await twoFactorApi.setup();
      setSecret(res.secret);
      setQrDataUrl(await QRCode.toDataURL(res.otpAuthUri));
      setPhase("setup");
    } catch {
      toast.error("No se pudo generar el código QR");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await twoFactorApi.enable(code);
      toast.success("Autenticación de dos factores activada");
      setEnabled(true);
      setPhase("status");
    } catch {
      toast.error("Código incorrecto");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await twoFactorApi.disable(password);
      toast.success("Autenticación de dos factores desactivada");
      setEnabled(false);
      setPhase("status");
    } catch {
      toast.error("Contraseña incorrecta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Autenticación de dos factores
          </DialogTitle>
          <DialogDescription>
            Sumá una capa extra de seguridad a tu cuenta con una app como Google Authenticator.
          </DialogDescription>
        </DialogHeader>

        {phase === "loading" && (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {phase === "status" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Estado actual</p>
                <p className="text-xs text-muted-foreground">
                  {enabled ? "Tu cuenta está protegida con 2FA" : "Tu cuenta no tiene 2FA activado"}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                  enabled ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                }`}
              >
                {enabled ? "Activa" : "Inactiva"}
              </span>
            </div>
            {enabled ? (
              <Button variant="outline" className="w-full" onClick={() => setPhase("disable")}>
                Desactivar
              </Button>
            ) : (
              <Button className="w-full" onClick={handleStartSetup} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  "Activar"
                )}
              </Button>
            )}
          </div>
        )}

        {phase === "setup" && (
          <form onSubmit={handleConfirmSetup} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Escaneá este código con Google Authenticator, Authy u otra app similar.
            </p>
            <div className="flex justify-center">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Código QR para configurar 2FA" className="rounded-lg border" width={200} height={200} />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">¿No podés escanear? Ingresá este código manualmente:</p>
              <code className="block text-xs bg-muted rounded px-2 py-1.5 break-all">{secret}</code>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totp-code" required>
                Código de verificación
              </Label>
              <Input
                id="totp-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="tracking-[0.5em] text-center font-mono"
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPhase("status")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {phase === "disable" && (
          <form onSubmit={handleDisable} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ingresá tu contraseña para desactivar la autenticación de dos factores.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="disable-password" required>
                Contraseña
              </Label>
              <PasswordInput
                id="disable-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPhase("status")}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={loading || !password}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desactivando...
                  </>
                ) : (
                  "Desactivar"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
