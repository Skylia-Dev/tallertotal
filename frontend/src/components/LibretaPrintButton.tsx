"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface Props {
  targetId: string;
  fileName: string;
}

export function LibretaPrintButton({ targetId, fileName }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    const el = document.getElementById(targetId);
    if (!el) return;

    setLoading(true);
    try {
      // html2canvas-pro (no el html2canvas original) — Tailwind v4 usa oklch() para
      // toda su paleta por defecto, y el html2canvas clásico no sabe parsear ese
      // formato de color; este fork sí.
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#f8fafc", useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

      // pdf.save() dispara la descarga con dispatchEvent(new MouseEvent("click")),
      // que en algunos navegadores no respeta el atributo `download` en un <a> con
      // blob: (termina navegando en vez de descargar). a.click() sí es confiable.
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="print:hidden flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-600 text-xs font-semibold px-3 py-2 shadow-sm transition-colors"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {loading ? "Generando..." : "Descargar PDF"}
    </button>
  );
}
