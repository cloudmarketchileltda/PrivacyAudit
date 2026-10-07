# PrivacyAudit

Aplicación SaaS de gestión y diagnóstico de protección de datos, orientada a consultores y organizaciones chilenas. La implementación de esta entrega cubre las fases 1 a 4 del documento maestro `PrivacyAudit.docx`. Los resultados de evaluación requieren interpretación jurídica y profesional.

## Alcance

- Fase 1: proyecto Next.js, email y contraseña, confirmación y recuperación, sesiones SSR, perfiles y roles, CRUD de organizaciones, perfil de tratamiento, membresías, invitaciones con enlaces y caducidad, aislamiento mediante RLS y administración básica de usuarios.
- Fase 2: catálogo global de 52 controles orientativos, edición por SUPER_ADMIN, evaluaciones históricas, copias de controles activos, respuestas con estados y comentarios separados de consultor y cliente, motivo obligatorio de no aplicabilidad, métricas de avance y dashboard de evaluación. Búsqueda, filtros y paginación en tablas de estas fases.
- Fase 3: registro de actividades de tratamiento por organización, con responsables, finalidad, categorías de titulares y datos, origen, base de licitud propuesta y explicación, sistemas, destinatarios, proveedores, transferencias, conservación, medidas de seguridad y observaciones. Creación, edición, archivo/reactivación y eliminación confirmada por consultores autorizados; consulta por clientes; búsqueda, filtros, orden y paginación.
- Fase 4: hallazgos desde controles históricos, tareas correctivas asignadas, envío a revisión por cliente, devolución con observaciones y aprobación por consultor, cierre justificado y plan de acción con filtros y progreso. Incluye historial protegido de cambios.
- Las fases 5–8 quedan pendientes. No hay evidencias, Storage ni PDF. El perfil de tratamiento de fase 1 y el registro de actividades de fase 3 son módulos distintos.

Para la continuación acordada el 5 de octubre de 2026, la IA queda aplazada hasta completar y validar el MVP. Las notificaciones operativas externas (WhatsApp, email, SMS y otros canales) quedan fuera por ahora; se mantienen previstas las notificaciones internas de fase 6 y se conservan los correos de autenticación existentes. La hoja de ruta y las condiciones de avance están en `docs/architecture.md`; las fases 5–8 todavía no están implementadas.

## Requisitos y ejecución

Node.js 24 (probado con 24.19.0), npm, Supabase CLI y un proyecto Supabase dedicado. Se conserva un único `package-lock.json` con versiones concretas.

```sh
npm ci
cp .env.example .env.local
# Completar URL, clave pública y APP_URL
npm run dev
```

Abra http://localhost:3000. Sin credenciales aparece una pantalla de configuración; no se simula una conexión ni se guardan datos de negocio localmente.

Variables:

| Variable                             | Uso                                               |
| ------------------------------------ | ------------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL             | URL del proyecto Supabase                         |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Clave pública publishable; RLS protege los datos  |
| APP_URL                              | URL canónica para retornos de Auth e invitaciones |

No se requiere service role key en la aplicación.

## Configuración de Supabase

El 5 de octubre de 2026 se conectó el proyecto dedicado `pbihajfbbcbbdvoqpggy` (`https://pbihajfbbcbbdvoqpggy.supabase.co`). Las migraciones de fases 1 y 2, el ajuste de rendimiento y los 52 controles ya están aplicados. `.env.local` está configurado y excluido de Git. No vuelva a sobrescribirlo con `.env.example`.

También está aplicada la migración `20261005201508_phase3_processing_activities.sql` en ese mismo proyecto. El código de fase 3 se publicó en GitHub, rama `main`, el 6 de octubre de 2026 (commit `e1f4221`). Tras el redespliegue informado por el usuario el 6 de octubre, `/login` y `/api/health` respondieron HTTP 200 y `/processing` redirigió a `/login` con HTTP 307. La prueba del módulo con sesiones reales de consultor y cliente sigue pendiente. No vuelva a aplicar esa migración manualmente.

Email y contraseña y confirmación de correo están habilitados en Supabase. Site URL es `https://privacyaudit.cloudmarket.cl`, con retorno `https://privacyaudit.cloudmarket.cl/auth/callback**`. Se conservan los retornos `http://localhost:3000/auth/callback**` y `http://127.0.0.1:3000/auth/callback**`, y se configuró el mínimo remoto de diez caracteres. Falta verificar el correo y las sesiones con una cuenta real.

Para reproducir la configuración en **otro proyecto**:

1. Identifique el proyecto dedicado a PrivacyAudit.
2. Vincule el proyecto y revise el plan de migraciones antes de aplicarlas:

```sh
supabase login
supabase link --project-ref SU_PROYECTO
supabase db push --dry-run
supabase db push
```

3. Cargue `supabase/seed.sql` mediante SQL Editor del proyecto identificado o `psql "$DATABASE_URL" -f supabase/seed.sql`. La conexión de base de datos es administrativa y solo se utiliza para despliegue, nunca en la app. El seed no contiene usuarios ni contraseñas y no sobrescribe controles existentes.
4. En Auth habilite Email + Password y confirmación de email. Site URL: `http://localhost:3000` en desarrollo; URL HTTPS real en producción. Permita `http://localhost:3000/auth/callback**` y la ruta equivalente del dominio final. Configure SMTP para entrega fiable fuera de desarrollo.
5. Para confirmar enlaces en dispositivos distintos configure el template de confirmación con token hash: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding`. En invitaciones propias, el usuario vuelve a abrir el enlace original después de confirmar. Para recuperación utilice `type=recovery&next=/reset-password`. También se soporta callback PKCE `code` mediante el enlace predeterminado de Supabase en el navegador que inició la operación.
6. Cree su primera cuenta y confirme el email. Abra `/onboarding` para activar cuenta de consultor. Las cuentas vinculadas a clientes no pueden activar ese rol por sí mismas.
7. Para crear el administrador inicial, use SQL administrativo con el UUID confirmado:

```sql
update public.profiles set role = 'SUPER_ADMIN' where id = 'UUID_REAL_DEL_USUARIO';
```

Este procedimiento no debe ejecutarse con una clave pública. Los usuarios no pueden editar roles por REST ni mediante user_metadata.

### Supabase local opcional

Requiere Docker. `supabase start` y `supabase db reset` aplican el esquema y seed a la instancia local. `db reset` elimina los datos locales: usar solamente en un entorno de desarrollo desechable. No se ejecutó aquí porque Docker no está disponible.

## Uso de las fases 1 y 2

1. Consultor crea una organización con RUT válido y perfil de tratamiento.
2. Crea un enlace de invitación en el resumen de la organización y lo comparte con el cliente. La aplicación no envía email de invitación. El enlace exige email confirmado coincidente, vence en siete días y solo se acepta una vez. El consultor puede revocarlo o retirar membresías.
3. Consultor crea evaluación; se copian los controles activos en una transacción.
4. Abre cada control y registra estado, comentario y motivo cuando no aplica.
5. Cambia estado de evaluación a En progreso, En revisión o Completada. Completar exige que no haya controles pendientes. Puede reabrir para corregir respuestas.
6. Cliente consulta solo las evaluaciones de las organizaciones a las que pertenece. Puede comentar un control mediante una operación limitada a su comentario; no puede alterar estados de evaluación ni asignarse permisos.
7. SUPER_ADMIN gestiona roles, asigna consultores existentes y mantiene el catálogo global.

## Esquema y seguridad

Migraciones reproducibles en `supabase/migrations`. Fase 1 crea `profiles`, `organizations`, `organization_members`, `organization_invitations`; fase 2 crea `controls`, `assessments`, `assessment_controls`. FK, índices, enums y timestamps están versionados.

Fase 3 añade `processing_activities` con categorías múltiples, RLS por operación, FK e índices. Una organización con tratamientos no se elimina: se archiva para conservar sus registros. Los clientes pueden consultarlos, pero no modificarlos. Dentro de una organización activa, abra Resumen → Tratamientos → Nuevo tratamiento; también hay una lista global en Tratamientos. La base de licitud registrada no se valida jurídicamente de forma automática.

- RLS habilitado en todas las tablas públicas, con grants explícitos y permisos por operación.
- La aplicación verifica `getUser` en servidor; proxy renueva cookies mediante `getClaims`. No se confía en `getSession` ni user_metadata para autorización.
- Rol global inmutable por los clientes; acceso a organización exige membresía. Funciones privadas verifican auth.uid antes de operaciones privilegiadas.
- Las columnas de identidad y snapshots no pueden modificarse vía API. Las respuestas registran evaluador y fecha mediante trigger.
- Invitaciones almacenan hash SHA256, no tokens en texto. El hash no es legible mediante API pública. Se validan email, caducidad y organización activa al aceptar.
- Las operaciones de creación de organización, evaluación e invitación aceptada son transaccionales.
- El catálogo no contiene referencias normativas inventadas; todo parte pendiente de revisión jurídica y puede editarse por administrador.
- El dashboard cuenta controles revisados, sin calcular un porcentaje de cumplimiento legal.

## Pruebas y build

```sh
npm run lint
npm run typecheck
npm test
npm run test:db
npm run build
npm start
```

Las pruebas usan PostgreSQL embebido PGlite para ejecutar las migraciones SQL reales, roles `anon` y `authenticated` y una función `auth.uid()` de prueba. Comprueban aislamiento entre consultores y clientes, denegaciones de escritura, escalación de roles, invitaciones, creación de evaluaciones, tratamientos y el flujo de hallazgos y tareas de fase 4. No sustituyen una prueba de Supabase Auth, PostgREST, correo o conectividad del proyecto remoto. Consulte `docs/verification.md` para resultados y pendientes reales.

## Estructura

```text
src/app/                    Rutas, layouts, acciones de navegación y healthcheck
src/components/ui/          Primitivas shadcn/ui con Tailwind
src/features/auth/          Sesiones y operaciones de cuenta
src/features/organizations/  Formularios, validación y acciones
src/features/controls/       Catálogo y administración
src/features/assessments/    Evaluaciones, respuestas y métricas
src/features/processing/     Registro de actividades de tratamiento
src/lib/supabase/            Clientes de navegador y servidor
supabase/                   Configuración, migraciones y seed
scripts/                    Herramientas de verificación
tests/                     Pruebas de dominio y PostgreSQL
docs/                      Arquitectura, referencias y despliegue
```

El contenedor escucha en el puerto **80**. En Dokploy seleccione Dockerfile y configure el dominio hacia el puerto interno 80. Desarrollo local con `npm run dev` conserva el puerto 3000.

Arquitectura: `docs/architecture.md`. Despliegue Docker y Dokploy: `docs/deployment.md`. El documento maestro permanece sin modificaciones.

## Uso de fase 4

1. En el detalle de un control, el consultor selecciona Crear hallazgo desde este control. También puede crear un hallazgo desde el resumen de una organización y seleccionar evaluación; el control es opcional.
2. Registra descripción, recomendación, severidad, área, responsable y fecha objetivo. Solo se admiten responsables miembros de la misma organización.
3. En el detalle del hallazgo crea una o más tareas y las asigna a miembros del cliente. El cliente solo ve sus tareas y puede iniciarlas o enviarlas a revisión.
4. El consultor edita una tarea en revisión para aprobarla o devolverla con observaciones. El progreso cuenta tareas aprobadas; enviar a revisión no equivale a aprobación.
5. Cierra el hallazgo con justificación cuando todas sus tareas estén aprobadas, o acepta el riesgo con una justificación explícita. Reabrir permite nuevas acciones. Hallazgos y tareas se conservan, sin borrado permanente.
6. Consulte Hallazgos, Tareas y Plan de acción desde la navegación principal o por organización. El plan permite buscar, ordenar y filtrar abiertos, vencidos, alta prioridad, responsable, estado y área.

La migración de fase 4 añade `findings`, `tasks` y `audit_logs`, FK compuestas, enums, índices, RLS y RPC limitadas de envío y progreso. `findings.control_id` apunta a `assessment_controls` para conservar el control histórico. La trazabilidad actual cubre hallazgos y tareas; no representa la auditoría completa de fase 8. Los formularios usan React Hook Form y Zod; las acciones vuelven a validar y autorizar en servidor. La migración `20261007020423_phase4_findings_tasks.sql` ya está aplicada en el proyecto dedicado; no vuelva a aplicarla manualmente. El código de fase 4 requiere redesplegar `main` en Dokploy. Consulte `docs/verification.md` para resultados y pendientes con sesiones reales.
