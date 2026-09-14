# Historial de builds — TallerTotal

Changelog de cada deploy a producción. Se actualiza a mano en cada build nuevo (mismo criterio que `frontend/next.config.ts`, que define `NEXT_PUBLIC_APP_VERSION` y se muestra en el login).

**Convención**: cada fila es un deploy real a producción (Vercel para el frontend, Railway para el backend — la mayoría de los builds tocan uno de los dos, algunos ambos). El número de build es el orden cronológico de deploys. La versión se incrementa un paso (`v1.X` → `v1.X+1`) en cada deploy nuevo, en `frontend/next.config.ts`.

## Notas operativas

- **2026-09-14**: se empieza a llevar este changelog. Los builds 1 a 19 (migración completa de funcionalidad de FiltCar + WhatsApp Meta + temas + módulos ocultables + rename de MecaFlow→TallerTotal + fixes) ya estaban deployados bajo la misma versión `v1.50` (no se incrementaba con cada deploy todavía). Desde el build 20 se bump la versión en cada deploy.
- **2026-09-14**: se detectó que el auto-deploy de Railway y Vercel estaba roto desde hacía meses — el repo se había transferido de `julianmarmol1979/tallertotal` a la org `Skylia-Dev/tallertotal` en GitHub y la conexión Git quedó rota en ambos paneles. Railway además tenía el Root Directory apuntando a una carpeta que no existía todavía (`/backend/TallerTotal.Api`, cuando la carpeta real seguía llamándose `MecaFlow.Api`). Se resolvió renombrando la carpeta y reconectando Git en ambos paneles (disconnect + reconnect completo). Confirmado funcionando con pushes de prueba (builds 15-17).

## Builds

| # | Fecha | Commit | Versión | Qué se hizo |
|---|-------|--------|---------|-------------|
| 20 | 2026-09-14 | — | v1.51 | Se agrega este changelog (`BUILDS.md`) y se arranca a bumpear versión en cada deploy |
| 19 | 2026-09-14 13:58 | `3da30f4` | v1.50 | Fix: Informes tiraba 500 al cargar — `top-articulos` agrupaba y sumaba dentro de la misma consulta LINQ tras dos Joins, algo que EF Core no puede traducir a SQL |
| 18 | 2026-09-14 13:48 | `a3c385c` | v1.50 | Fix: la sidebar dejaba ver el fondo blanco de la página por debajo de "Configuración" — al nav le faltaba `overflow-y-auto` y los últimos ítems se desbordaban fuera del panel oscuro |
| 17 | 2026-09-14 13:41 | `47f793f` | v1.50 | Fix: layout angosto en `/configuracion` (usaba `max-w-2xl` en vez de `max-w-5xl` como el resto de la app) |
| 16 | 2026-09-14 13:07-13:28 | `c256db6`…`7b99022` | v1.50 | Renombre de carpeta backend `MecaFlow.Api` → `TallerTotal.Api` y reconexión de auto-deploy en Railway y Vercel (repo transferido a la org Skylia-Dev) |
| 15 | 2026-09-14 12:39 | `c9ad5c1` | v1.50 | Fix: build de producción fallaba — `useSearchParams()` sin `<Suspense>` en `/ventas/nueva` |
| 14 | 2026-09-14 12:18 | `1798ae0` | v1.50 | Ocultamiento de módulos por taller — cada dueño puede desactivar módulos que no usa (migrando concepto de CEMDI) |
| 13 | 2026-09-14 11:08 | `fe43365` | v1.50 | Personalización de tema — modo claro/oscuro + 8 colores de acento |
| 12 | 2026-09-14 11:04 | `493994c` | v1.50 | WhatsApp vía Meta Cloud API además de Evolution API (canal switcheable desde el panel admin) + panel de estado de Email |
| 11 | 2026-09-14 10:03 | `1bb8f1f` | v1.50 | Gestión de empleados con rol dedicado (migrando de FiltCar) |
| 10 | 2026-09-14 09:58 | `17a49bd` | v1.50 | Módulo Auditoría (migrando de FiltCar) |
| 9 | 2026-09-14 09:50 | `c247152` | v1.50 | Módulo Informes (migrando de FiltCar) |
| 8 | 2026-09-14 09:48 | `bada365` | v1.50 | Módulo Caja (migrando de FiltCar) |
| 7 | 2026-09-14 09:45 | `be326c2` | v1.50 | Módulo Presupuestos con conversión a venta (migrando de FiltCar) |
| 6 | 2026-09-14 09:41 | `1a8da18` | v1.50 | Módulos Ventas y Deudas (migrando de FiltCar) |
| 5 | 2026-09-14 09:33 | `85277d7` | v1.50 | Módulo Compras (migrando de FiltCar) |
| 4 | 2026-09-14 09:30 | `1b2e9be` | v1.50 | Módulos Artículos y Proveedores (migrando de FiltCar) |
