"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  licensePlate: string;
  portalToken: string;
  customerPhone?: string;
}

export function LibretaShareDialog({ open, onOpenChange, licensePlate, portalToken, customerPhone }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const link = open && typeof window !== "undefined" ? `${window.location.origin}/libreta/${portalToken}` : "";

  useEffect(() => {
    if (!open || !link) return;
    setQrDataUrl(null);
    QRCode.toDataURL(link, { width: 220, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [open, link]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 1500);
  };

  const waLink = customerPhone
    ? `https://wa.me/${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hola! Te paso la libreta digital de tu ${licensePlate}, con el historial de services: ${link}`
      )}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Libreta digital — {licensePlate}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Código QR de la libreta" className="h-[220px] w-[220px] rounded-lg border border-border" />
          ) : (
            <div className="h-[220px] w-[220px] rounded-lg border border-border animate-pulse bg-muted" />
          )}

          <div className="flex w-full gap-2">
            <Input value={link} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copiar link">
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
            </a>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              El cliente no tiene teléfono cargado — copiá el link y compartilo manualmente.
            </p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <DialogClose render={<Button variant="outline" />}>Cerrar</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
