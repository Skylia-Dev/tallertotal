export function TallerTotalLogo({ dark = false, themed = false }: { dark?: boolean; themed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={40} height={40} className="rounded-xl object-contain" />
      <span className={`text-2xl font-bold ${themed ? "text-sidebar-foreground" : dark ? "text-white" : "text-slate-900"}`}>
        TallerTotal
      </span>
    </div>
  );
}
