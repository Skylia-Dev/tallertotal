"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sessionConfigApi } from "@/lib/api";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;
const CHECK_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Cierre de sesión por inactividad (configurable en Configuración → Integraciones):
 * un heartbeat al backend cada minuto mientras hubo actividad real (mouse/teclado/scroll),
 * y un timer local que desloguea proactivamente si nadie tocó nada en timeoutMinutes.
 * La aplicación real del límite vive en el backend (InactivitySessionMiddleware) — esto
 * es la experiencia de usuario, no la fuente de verdad.
 */
export function SessionActivityTracker() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const dirtyRef = useRef(true);
  const timeoutMinutesRef = useRef(0);

  useEffect(() => {
    sessionConfigApi.get()
      .then((c) => { timeoutMinutesRef.current = c.sessionTimeoutMinutes; })
      .catch(() => {});

    const markActivity = () => {
      lastActivityRef.current = Date.now();
      dirtyRef.current = true;
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActivity, { capture: true }));

    sessionConfigApi.pingActivity().catch(() => {});

    const heartbeat = setInterval(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        sessionConfigApi.pingActivity().catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);

    const check = setInterval(() => {
      const minutes = timeoutMinutesRef.current;
      if (minutes > 0 && Date.now() - lastActivityRef.current >= minutes * 60_000) {
        fetch("/api/auth/logout", { method: "POST" }).finally(() => router.push("/login"));
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActivity, { capture: true }));
      clearInterval(heartbeat);
      clearInterval(check);
    };
  }, [router]);

  return null;
}
