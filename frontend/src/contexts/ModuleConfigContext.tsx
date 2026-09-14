"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tenantModuleConfigApi } from "@/lib/api";

interface ModuleConfigContextValue {
  hiddenModules: Set<string>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ModuleConfigContext = createContext<ModuleConfigContextValue>({
  hiddenModules: new Set(),
  loading: true,
  refresh: async () => {},
});

export function ModuleConfigProvider({ children }: { children: React.ReactNode }) {
  const [hiddenModules, setHiddenModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { hiddenModules: hidden } = await tenantModuleConfigApi.get();
      setHiddenModules(new Set(hidden));
    } catch {
      // best effort — if it fails, nothing is hidden
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ModuleConfigContext.Provider value={{ hiddenModules, loading, refresh }}>
      {children}
    </ModuleConfigContext.Provider>
  );
}

export const useModuleConfig = () => useContext(ModuleConfigContext);
