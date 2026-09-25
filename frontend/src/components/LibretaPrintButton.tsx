"use client";

import { Download } from "lucide-react";

export function LibretaPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-2 shadow-sm transition-colors"
    >
      <Download className="h-3.5 w-3.5" /> Descargar PDF
    </button>
  );
}
