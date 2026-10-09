# Convenciones

Antes de implementar/modificar una operación, ejecutar SQL, migrar o desplegar, consultar obligatoriamente `docs/system-and-business-rules.md` y `src/config/general.ts`. Mantener las reglas, su implementación y la configuración sincronizadas; no duplicar valores compartidos en componentes nuevos.

Revisar `docs/references/index.md`, `docs/architecture.md` y el documento maestro al continuar. Alcance autorizado actual: fases 1 a 7. El usuario autorizó iniciar la fase 3 el 5 de octubre de 2026 y continuar con fase 4 el 6 de octubre de 2026. El usuario autorizó iniciar fase 5 el 7 de octubre de 2026. El usuario autorizó completar fase 6 con notificaciones internas y ampliar la auditoría administrativa, exportación y borrado exclusivo del administrador el 7 de octubre de 2026. El usuario autorizó implementar fase 7 (informe PDF) el 8 de octubre de 2026. No iniciar fase 8 sin petición del usuario.

Acuerdo de continuación del 5 de octubre de 2026: IA aplazada hasta completar y validar el MVP; no implementar integraciones ni funciones de IA ahora. Notificaciones operativas externas fuera por ahora (WhatsApp, email, SMS y otros canales); conservar correos de autenticación y implementar solo notificaciones internas en fase 6. Hoja de ruta en `docs/architecture.md`.

Cambio de cuentas autorizado el 7 de octubre de 2026: registro público cerrado; solo SUPER_ADMIN crea cuentas CLIENT/CONSULTANT desde Administración y asigna sus roles. Sin autoactivación de consultores. La credencial administrativa de Auth se mantiene exclusivamente en Supabase Functions, nunca en Next.js.

Cambio de membresías autorizado el 7 de octubre de 2026: grillas administrativas separadas; CLIENT con una sola organización como máximo y CONSULTANT con varias. Asignación directa por SUPER_ADMIN, transaccional y auditada. Mantener esta cardinalidad también en invitaciones y RPC heredadas.

Cambio de organizaciones autorizado el 8 de octubre de 2026: CRUD exclusivo de SUPER_ADMIN desde Administración. El borrado confirmado elimina todos los datos de la organización y sus archivos; conservar cuentas de usuario y catálogo global. La eliminación completa de TODOS los datos relacionados con la organización prevalece sobre TODAS las otras reglas de conservación, inmutabilidad, archivo y restricciones de eliminación. Mantener esta prioridad en tablas/FK/triggers actuales y futuros. Borrar blobs con Storage API, nunca solo metadata SQL.

Cambio de catálogo autorizado el 8 de octubre de 2026: módulo exclusivo de SUPER_ADMIN desde Administración, con creación/edición/borrado. No eliminar una definición aplicada en ninguna organización, incluso inactiva. Borrar una organización elimina siempre sus aplicaciones/snapshots y relaciones de controles; esa prioridad no destruye definiciones globales compartidas ni datos de otras organizaciones.

Convención de acciones desde el 8 de octubre de 2026: usar las variantes compartidas de `Button`; azul (`default`/`role`) para acciones generales y cambio de rol, verde (`edit`) para modificar/guardar, rojo (`destructive`) para eliminar. Botones de acciones en grillas con icono, `aria-label` y `title`. Navegación/cancelación/filtros pueden usar `outline` o `ghost`.

Stack: Next.js App Router, TypeScript estricto, Tailwind 4, componentes shadcn/ui, React Hook Form, Zod y Supabase SSR. Server Components por defecto. Validar entradas en servidor y aplicar RLS. Ninguna clave service role en la aplicación. Relaciones con FK y snapshots de controles para preservar historia.

Comandos: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev`. `npm run test:db` ejecuta las migraciones reales en PostgreSQL embebido PGlite, con roles Auth de prueba; no demuestra conectividad remota ni entrega de correo de Supabase.

Todo cambio SQL debe estar en migración generada por `supabase migration new`. No alterar proyectos remotos sin identificar el destino. Mantener README y resultados de verificación honestos.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Cambio de evaluaciones autorizado el 9 de octubre de 2026: SUPER_ADMIN y CONSULTANT con membresía CONSULTANT actual en la organización pueden modificar y eliminar evaluaciones en organizaciones activas. El borrado confirmado elimina TODOS los datos vinculados a esa evaluación (controles aplicados, hallazgos, tareas, evidencias y versiones/archivos, comentarios, notificaciones, informes e historial relacionado), con prioridad sobre sus reglas de conservación e inmutabilidad. Conservar otras evaluaciones y datos generales de la organización, cuentas y catálogo global. Borrar blobs mediante Storage API y permitir reintentar el borrado pendiente. ORG-04 conserva prioridad absoluta.
