# PrivacyAudit

Aplicación SaaS de gestión y diagnóstico de protección de datos, orientada a consultores y organizaciones chilenas. La implementación de esta entrega cubre las fases 1 a 6 del documento maestro `PrivacyAudit.docx`. Los resultados de evaluación requieren interpretación jurídica y profesional.

## Alcance

- Fase 1: proyecto Next.js, email y contraseña, cuentas creadas por administrador y recuperación, sesiones SSR, perfiles y roles, CRUD de organizaciones, perfil de tratamiento, membresías, invitaciones con enlaces y caducidad, aislamiento mediante RLS y administración básica de usuarios.
- Fase 2: catálogo global de 52 controles orientativos, edición por SUPER_ADMIN, evaluaciones históricas, copias de controles activos, respuestas con estados y comentarios separados de consultor y cliente, motivo obligatorio de no aplicabilidad, métricas de avance y dashboard de evaluación. Búsqueda, filtros y paginación en tablas de estas fases.
- Fase 3: registro de actividades de tratamiento por organización, con responsables, finalidad, categorías de titulares y datos, origen, base de licitud propuesta y explicación, sistemas, destinatarios, proveedores, transferencias, conservación, medidas de seguridad y observaciones. Creación, edición, archivo/reactivación y eliminación confirmada por consultores autorizados; consulta por clientes; búsqueda, filtros, orden y paginación.
- Fase 4: hallazgos desde controles históricos, tareas correctivas asignadas, envío a revisión por cliente, devolución con observaciones y aprobación por consultor, cierre justificado y plan de acción con filtros y progreso. Incluye historial protegido de cambios.
- Fase 5: evidencias por organización, control histórico, hallazgo o tarea; archivos privados en Supabase Storage; entregas corregidas sin sobrescribir originales; revisión por consultor, comentarios cronológicos y trazabilidad. Búsqueda, filtros, orden y paginación de evidencias.
- Fase 6: dashboard operativo con métricas objetivas y filtros, notificaciones internas por destinatario y auditoría ampliada en Administración, con exportación CSV y borrado exclusivo del administrador.
- Las fases 7–8 quedan pendientes. No hay informe PDF. El perfil de tratamiento de fase 1 y el registro de actividades de fase 3 son módulos distintos.

Para la continuación acordada el 5 de octubre de 2026, la IA queda aplazada hasta completar y validar el MVP. Las notificaciones operativas externas (WhatsApp, email, SMS y otros canales) quedan fuera por ahora; se incorporan las notificaciones internas de fase 6 y se conservan los correos de autenticación existentes. La hoja de ruta y las condiciones de avance están en `docs/architecture.md`; las fases 7–8 todavía no están implementadas.

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

1. Identifique el proyecto dedicado a PrivacyAudit. En un proyecto nuevo, deshabilite el registro público en Auth y cree la cuenta del administrador inicial mediante la administración de Supabase Auth **antes de aplicar las migraciones**. Habilite su email administrativamente y conserve el UUID. El bloqueo de altas exige que el administrador exista antes de crear cuentas desde la aplicación.
2. Vincule el proyecto y revise el plan de migraciones antes de aplicarlas:

```sh
supabase login
supabase link --project-ref SU_PROYECTO
supabase db push --dry-run
supabase db push
```

3. Cargue `supabase/seed.sql` mediante SQL Editor del proyecto identificado o `psql "$DATABASE_URL" -f supabase/seed.sql`. La conexión de base de datos es administrativa y solo se utiliza para despliegue, nunca en la app. El seed no contiene usuarios ni contraseñas y no sobrescribe controles existentes.
4. En Auth habilite Email + Password y confirmación de email. Site URL: `http://localhost:3000` en desarrollo; URL HTTPS real en producción. Permita `http://localhost:3000/auth/callback**` y la ruta equivalente del dominio final. Configure SMTP para entrega fiable fuera de desarrollo.
5. Para confirmar enlaces en dispositivos distintos configure el template de confirmación con token hash: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding`. Las invitaciones de organización requieren una cuenta creada por el administrador. Para recuperación utilice `type=recovery&next=/reset-password`. También se soporta callback PKCE `code` mediante el enlace predeterminado de Supabase en el navegador que inició la operación.
6. El registro público está cerrado. Complete el perfil del administrador inicial creado en el paso 1 con el SQL del paso 7. Después, las cuentas de cliente y consultor se crean exclusivamente desde Administración → Usuarios y permisos.
7. Para crear el administrador inicial, use SQL administrativo con el UUID confirmado:

```sql
insert into public.profiles (id, full_name, role, consultant_enrollment_allowed)
values ('UUID_REAL_DEL_USUARIO', 'Administrador', 'SUPER_ADMIN', false)
on conflict (id) do update set role = 'SUPER_ADMIN', consultant_enrollment_allowed = false;
```

Este procedimiento no debe ejecutarse con una clave pública. Los usuarios no pueden editar roles por REST ni mediante user_metadata.

### Supabase local opcional

Requiere Docker. `supabase start` y `supabase db reset` aplican el esquema y seed a la instancia local. `db reset` elimina los datos locales: usar solamente en un entorno de desarrollo desechable. No se ejecutó aquí porque Docker no está disponible.

## Uso de las fases 1 y 2

1. Consultor crea una organización con RUT válido y perfil de tratamiento.
2. El administrador crea primero la cuenta CLIENT en Administración → Usuarios y permisos. El consultor crea un enlace de invitación en el resumen de la organización y lo comparte con el cliente. La aplicación no envía email de invitación. El enlace exige email confirmado coincidente, vence en siete días y solo se acepta una vez. El consultor puede revocarlo o retirar membresías.
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
src/features/workflow/       Hallazgos, tareas y plan de acción
src/features/evidence/       Carga, revisión, entregas y comentarios
src/features/notifications/  Notificaciones internas y lectura por destinatario
src/features/audit/          Filtros, CSV y conservación administrativa
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

La migración de fase 4 añade `findings`, `tasks` y `audit_logs`, FK compuestas, enums, índices, RLS y RPC limitadas de envío y progreso. `findings.control_id` apunta a `assessment_controls` para conservar el control histórico. La trazabilidad introducida en fase 4 cubría hallazgos y tareas; fase 6 amplía la captura y agrega el módulo de administración. Los formularios usan React Hook Form y Zod; las acciones vuelven a validar y autorizar en servidor. La migración `20261007020423_phase4_findings_tasks.sql` ya está aplicada en el proyecto dedicado; no vuelva a aplicarla manualmente. El código de fase 4 requiere redesplegar `main` en Dokploy. Consulte `docs/verification.md` para resultados y pendientes con sesiones reales.

## Uso de fase 5

1. Abra Evidencias → Nueva evidencia y elija una organización activa, o seleccione Adjuntar evidencia en un control histórico, hallazgo o tarea. El cliente solo puede adjuntar a tareas que tiene asignadas; conserva acceso a documentos generales de sus organizaciones y a hallazgos visibles.
2. Escriba una descripción y seleccione PDF, PNG, JPG, DOCX, XLSX o TXT de hasta 10 MB. La app valida nombre, extensión, MIME y tamaño; el bucket limita MIME y tamaño. Esta validación no constituye análisis antivirus ni revisión del contenido.
3. La app reserva la entrega, carga directamente a Storage con la sesión del usuario y confirma que existe un objeto con MIME y tamaño compatibles. Solo entonces queda pendiente de revisión. No se usa una service role key.
4. Si se interrumpe la conexión, abra la entrega incompleta: confirme si el archivo llegó, o descarte esa carga y vuelva a subirlo. No se pueden revisar entregas incompletas. Solo el autor puede descartarlas; las organizaciones archivadas y relaciones cerradas requieren reactivación o reapertura para modificar archivos.
5. El consultor autorizado descarga y revisa la evidencia: Aceptar, Rechazar o Solicitar cambios. Rechazar y solicitar cambios exigen observaciones. Autor, revisor y fechas se asignan en PostgreSQL y no pueden falsificarse desde el formulario.
6. Tras un rechazo o solicitud de cambios, el cliente puede Subir nueva entrega. Se conservan el original y su revisión, con enlaces a la entrega anterior y siguiente. Una entrega revisada no se vuelve a editar; cada corrección comienza pendiente de revisión.
7. Consultor y cliente agregan comentarios en hallazgos, tareas y evidencias autorizados. Se muestran los últimos 100 comentarios en orden cronológico, con autor y fecha; no hay edición ni borrado de comentarios.
8. Aceptar evidencia no aprueba automáticamente una tarea ni cierra un hallazgo. La aprobación y el cierre siguen siendo decisiones del consultor. Si hay evidencias adjuntas, las últimas entregas confirmadas deben estar aceptadas antes de aprobar la tarea o cerrar el hallazgo. Riesgo aceptado conserva su justificación y sus reglas anteriores.

El bucket `evidence` es privado y organiza cada archivo como `organization_id/evidence_id/file`. El nombre original se conserva como metadata de la evidencia. RLS protege registros, comentarios y objetos, incluidas llamadas directas a Storage; no hay política de sobrescritura. Las descargas de la app verifican sesión y permisos en cada solicitud, fuerzan descarga como adjunto y no usan caché pública ni enlaces públicos. Retirar una membresía elimina acceso a archivos y registros, conservando el historial.

La migración de fase 5 crea `evidence`, `comments`, el enum de revisión, FK compuestas, índices, permisos por operación, funciones limitadas, bucket y políticas de Storage. Extiende `audit_logs` con carga confirmada, revisión y comentarios. Los clientes pueden consultar los eventos de sus evidencias autorizadas; fase 6 amplía la auditoría por solicitud del usuario; su revisión final sigue prevista para fase 8.

Prueba específica de navegador: `npm run test:ui:evidence`. La suite completa `npm run test:ui` incluye el mismo recorrido. El adaptador local ejecuta SQL real y maneja archivos temporales en memoria para probar la app; no sustituye una prueba con Supabase Auth y Storage reales. `npm run test:db` incluye las pruebas de fase 5. Consulte `docs/verification.md` para resultados y pendientes de despliegue.

Las migraciones `20261007105950_phase5_evidence_comments.sql` y `20261007110056_phase5_evidence_indexes.sql` ya están aplicadas en el proyecto dedicado `pbihajfbbcbbdvoqpggy`; no vuelva a aplicarlas manualmente. Se comprobó el bucket privado y el flujo SQL remoto con ROLLBACK, sin conservar usuarios, organizaciones ni objetos temporales. La comprobación de navegador utiliza el adaptador aislado. La entrega de código se publica en la rama `main` de GitHub. Queda pendiente redesplegar en Dokploy y probar carga/descarga con sesiones emitidas por Supabase Auth y archivos reales en Storage.

## Uso de fase 6

1. Abra Dashboard para consultar organizaciones activas, evaluaciones en progreso, hallazgos abiertos/cerrados, riesgos aceptados, alta prioridad, tareas vencidas y evidencias pendientes/aceptadas. La distribución de severidad incluye hallazgos abiertos. El porcentaje de controles mide avance de evaluación, sin asignar un score jurídico.
2. Busque una organización y filtre por estado o atención requerida (alta prioridad, vencimientos o evidencias pendientes). Los filtros afectan tanto las métricas como la tabla paginada. La tabla incorpora última evaluación, avance, hallazgos abiertos, alta prioridad, tareas vencidas y última actividad.
3. Abra la campana del encabezado para consultar sus notificaciones internas. Puede filtrar por organización, evento y leída/sin leer, abrir el registro asociado o marcar una/todas como leídas. El contador se actualiza en navegación y cada 60 segundos mientras la aplicación está visible.
4. Las asignaciones y reasignaciones de tareas, envíos a revisión, devoluciones/aprobaciones, cargas confirmadas y revisiones de evidencias y hallazgos enviados a revisión generan avisos automáticamente. Se avisa al responsable o a los consultores gestores con membresía de la organización, excluyendo al actor de su propio aviso. Los vencimientos avisan al responsable y gestores cada vez que vence una combinación tarea/fecha/responsable, sin duplicar el mismo evento.
5. Los vencimientos se comprueban en PostgreSQL cada 15 minutos mediante Supabase Cron, aunque nadie tenga la aplicación abierta. Se usa la fecha de Chile; se excluyen tareas aprobadas, hallazgos cerrados/con riesgo aceptado y organizaciones archivadas. **No hay notificaciones por WhatsApp, email operativo, SMS ni push externo.** Se mantienen únicamente los correos de autenticación existentes.
6. Como SUPER_ADMIN, abra **Administración → Log auditable**. Consulte fecha, actor, rol, organización, acción, entidad, UUID y detalle de cambios. Filtre por organización, actor, acción, entidad y fechas de Chile. Clientes y consultores no acceden a esta administración; conservan solo los historiales específicos previamente autorizados.
7. **Exportar CSV** descarga todos los eventos que coincidan con los filtros, incluyendo UUID, fechas ISO, referencias históricas de organización/actor, actor, rol y metadata. No se limita a la página visible ni a los 1.000 registros predeterminados de la API. El archivo usa UTF-8, comillas/saltos escapados y neutralización de fórmulas de hoja de cálculo. La propia preparación de la exportación queda registrada.
8. Para borrar, el administrador indica fecha y hora de corte, un motivo de al menos 10 caracteres y escribe **BORRAR LOG**. Elimina los eventos anteriores a esa fecha, en todas las organizaciones; los filtros de consulta no restringen esta operación. La acción queda registrada con administrador, fecha, motivo y cantidad eliminada. Las constancias AUDIT_PURGE se conservan. Ningún usuario, incluido el administrador, tiene permisos de INSERT/UPDATE/DELETE directo sobre el log: el borrado solo se permite mediante una función específica con autorización también en SQL.

La captura ampliada se ejecuta en la base de datos para las altas, modificaciones y eliminaciones permitidas de organizaciones, membresías/invitaciones, perfiles/roles, catálogo, evaluaciones/respuestas y tratamientos. Conserva la trazabilidad de hallazgos, tareas, cargas/revisiones de evidencias y comentarios; añade reservas de carga, notificaciones creadas/leídas y solicitudes de descarga por la aplicación. Cada evento incluye campos modificados o metadata del flujo, y snapshots de actor/rol y organización. No se guardan contraseñas, hashes de invitación ni el contenido completo de archivos/comentarios en el registro. Las referencias de organizaciones y actores se conservan aunque se elimine una organización o cuenta sin datos de negocio. Los eventos de cuenta/credencial de Auth identifican al usuario afectado en metadata; si Auth no aporta un actor verificable, se registra Sistema.

Los inicios de sesión confirmados, creación de cuentas y actualizaciones de la credencial se detectan en las tablas gestionadas por Auth; la eliminación de una sesión se registra como sesión terminada, que puede corresponder a logout o limpieza/revocación. El stream opcional `auth.audit_log_entries` incorpora otros eventos emitidos por Auth si está habilitado "Write audit logs to the database"; no se afirma haber cambiado ese ajuste ni capturar intentos fallidos cuando está deshabilitado. Se omiten renovaciones de token del stream para evitar ruido. No se reconstruyen acciones históricas que nunca se registraron.

RLS restringe cada aviso a su destinatario y comprueba acceso actual a organización, tarea y evidencia: retirar membresía o reasignar una tarea oculta sus avisos anteriores al usuario que perdió acceso. Las métricas se agregan en SQL con RLS, sin descargar todos los registros ni truncar totales. Los controles corresponden a la última evaluación de cada organización; evaluaciones en progreso incluyen todas las evaluaciones IN_PROGRESS/REVIEW del ámbito. Los clientes cuentan únicamente sus propias tareas. Los totales de evidencias consideran la última entrega confirmada de cada cadena.

Las migraciones `20261007205833_phase6_notifications_audit_dashboard.sql`, `20261007205840_phase6_overdue_schedule.sql` y `20261007211919_phase6_audit_identity_retention.sql` ya están aplicadas en el proyecto dedicado `pbihajfbbcbbdvoqpggy`; no vuelva a aplicarlas manualmente. El job `privacyaudit-overdue-notifications` está activo. PGlite omite la instalación de pg_cron y prueba el worker directamente. Prueba específica: `npm run test:ui:phase6`; la suite completa incluye el mismo recorrido. Consulte `docs/verification.md` para los resultados. La entrega continúa el flujo de publicación en GitHub, rama `main`. Queda pendiente redesplegar esta entrega en Dokploy y verificar las nuevas pantallas con sesiones reales. La fase 7 (informe PDF) y el cierre de fase 8 siguen pendientes.

## Cuentas administradas exclusivamente por el administrador

Cambio solicitado el 7 de octubre de 2026. El login ofrece inicio de sesión y recuperación de acceso. `/signup` redirige a `/login`; `/onboarding` ya no permite activar consultores. No existe registro público ni autoasignación de rol. Las invitaciones de organización vinculan cuentas existentes y no crean usuarios.

Como SUPER_ADMIN, abra **Administración → Usuarios y permisos → Crear cuenta de usuario**. Ingrese nombre completo, correo, contraseña inicial de 10 a 128 caracteres y rol **Cliente** o **Consultor**. La cuenta queda habilitada por el administrador, con email marcado como confirmado administrativamente; esto no demuestra que el usuario haya verificado su buzón. No se envía correo de alta. Comparta las credenciales de forma segura; el usuario puede solicitar su cambio mediante Recuperar acceso o Mi cuenta. El formulario no permite crear administradores. La edición de roles existente conserva sus restricciones: solo SUPER_ADMIN, sin editar la propia cuenta y sin membresías incompatibles.

Crear una cuenta o cambiar su rol no asigna organizaciones. Para clientes, el consultor o administrador genera un enlace en Organización → Usuarios y membresías; para consultores existentes, el administrador los asigna desde esa sección. Un consultor queda vinculado a las organizaciones que crea.

La Server Action y la Edge Function `admin-create-user` verifican al usuario y su rol actual en `profiles`. La función valida el JWT con `getUser`, sin confiar en metadata del usuario. La clave privilegiada permanece exclusivamente en el entorno gestionado de Supabase Functions; no se agrega a Next.js, `.env.local`, Docker ni variables públicas. Se utiliza la API administrativa oficial de Auth, sin fabricar usuarios ni contraseñas mediante SQL. Un trigger de Auth rechaza altas sin metadata administrativa protegida y sin administrador válido, también por la API pública; los roles SQL de mantenimiento `postgres` y `supabase_admin` conservan el bootstrap/importación. El perfil y el evento `ADMIN_ACCOUNT_CREATED`, con actor y rol, se generan en la transacción de alta. No se registran contraseñas.

La migración `20261007234041_admin_managed_accounts.sql`, aplicada en PrivacyAudit, bloquea también la RPC anterior de autoactivación. `supabase/config.toml` deshabilita signup general y por email para entornos locales nuevos. En otros proyectos aplique la migración y despliegue la función, además de deshabilitar **Allow new users to sign up** en Auth. La configuración remota y el estado de despliegue de esta entrega se documentan en `docs/verification.md`.

Despliegue de la función en el proyecto identificado:

```sh
supabase functions deploy admin-create-user --project-ref SU_PROYECTO
```

`verify_jwt=false` en esta función permite usar las claves publishable modernas: la función realiza explícitamente autenticación mediante Auth y autorización antes de crear la cuenta. No acepta solicitudes anónimas ni de clientes/consultores. No hay CORS público porque Next.js invoca la función desde servidor.

Verificación específica: `npm run test:ui:accounts`. `npm test` y `npm run test:db` incluyen las denegaciones de registro/autoactivación y la creación administrativa con rol y trazabilidad.
