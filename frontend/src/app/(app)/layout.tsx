import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { BottomNav } from "@/components/BottomNav";
import { ModuleConfigProvider } from "@/contexts/ModuleConfigContext";
import { SessionActivityTracker } from "@/components/SessionActivityTracker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ModuleConfigProvider>
      <SessionActivityTracker />
      <div className="h-full flex bg-background">
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </ModuleConfigProvider>
  );
}
