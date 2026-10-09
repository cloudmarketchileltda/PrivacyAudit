# PrivacyAudit

### Datos de cuenta y contraseña

En **Mi cuenta**, todos los roles pueden editar nombre completo, dirección, teléfono, ciudad y país. Los contactos son opcionales, privados para el titular y SUPER_ADMIN y se guardan junto con el nombre en una transacción. La creación y edición administrativa también incluyen los cuatro campos de contacto. Borrar una organización conserva las cuentas y estos datos; borrar legítimamente una cuenta elimina su contacto por cascada.

Para cambiar la contraseña: **Mi cuenta → Cambiar contraseña**, ingrese la contraseña actual, una nueva de 10 a 128 caracteres y su confirmación, y pulse **Guardar nueva contraseña**. Si olvidó la actual, contacte al administrador. SUPER_ADMIN abre **Administración → Administración de cuentas**, pulsa el icono verde **Restablecer contraseña**, ingresa y confirma la nueva contraseña y la comparte por un medio seguro. No se envía correo ni enlace. Después, el usuario puede cambiarla en Mi cuenta; el cambio posterior no es obligatorio en esta entrega. La contraseña actual nunca se muestra ni se guarda en las tablas de perfil/contacto o el log. **Cambiar correo electrónico** pide el nuevo correo y la contraseña actual; siga las confirmaciones de Supabase en el correo actual y el nuevo cuando se requieran. Hasta completar el proceso, mantenga el correo actual para iniciar sesión.

Migración `20261008184033_account_contact_and_self_service.sql` aplicada en PrivacyAudit (`pbihajfbbcbbdvoqpggy`); `admin-create-user` versión 5 y `admin-manage-user` versión 3 ACTIVE (actualizada con restablecimiento el 9 de octubre). Pendiente redesplegar Next.js en Dokploy. Las RPC anteriores siguen disponibles para compatibilidad. Verificación de navegador: `npm run test:ui:account-profile`; backend aislado, sin demostrar entrega de correos real. `npm test` y `npm run test:db` verifican privacidad, altas/ediciones reservadas, rollback y eliminación de contactos. Verificación SQL remota con rollback: `scripts/verify-account-contact-remote.sql`; ninguna cuenta real modificada. Límites compartidos en `src/config/general.ts` y constraints SQL; cambios de límites requieren mantener ambos sincronizados.

### Footer y páginas legales

El logo del menú vuelve al home (`/`, con el dashboard como destino del sistema configurado). El footer compartido aparece en todas las páginas y contiene Facebook, Instagram, LinkedIn, YouTube, tres páginas públicas con textos iniciales —`/politicas-de-privacidad`, `/terminos-y-condiciones`, `/aviso-legal`— y un enlace al [texto oficial de la Ley 21.719 en BCN](https://www.bcn.cl/leychile/navegar?idNorma=1209272). Los destinos se editan en `src/config/general.ts`, sección `site`; las redes usan URLs genéricas aprobadas por el usuario hasta recibir los perfiles reales. Los textos se mantienen en `src/app/(legal)` y quedan pendientes de completar con los datos del operador. Este cambio de frontend requiere redesplegar Next.js para verse en producción.

Aplicación SaaS de gestión y diagnóstico de protección de datos, orientada a consultores y organizaciones chilenas. La implementación de esta entrega cubre las fases 1 a 7 del documento maestro `PrivacyAudit.docx`. Los resultados de evaluación requieren interpretación jurídica y profesional.

## Alcance

- Fase 1: proyecto Next.js, email y contraseña, cuentas creadas por administrador y recuperación, sesiones SSR, perfiles y roles, CRUD de organizaciones, perfil de tratamiento, membresías, invitaciones con enlaces y caducidad, aislamiento mediante RLS y administración básica de usuarios.
- Fase 2: catálogo global de 52 controles orientativos, edición por SUPER_ADMIN, evaluaciones históricas, copias de controles activos, respuestas con estados y comentarios separados de consultor y cliente, motivo obligatorio de no aplicabilidad, métricas de avance y dashboard de evaluación. Búsqueda, filtros y paginación en tablas de estas fases.
- Fase 3: registro de actividades de tratamiento por organización, con responsables, finalidad, categorías de titulares y datos, origen, base de licitud propuesta y explicación, sistemas, destinatarios, proveedores, transferencias, conservación, medidas de seguridad y observaciones. Creación, edición, archivo/reactivación y eliminación confirmada por consultores autorizados; consulta por clientes; búsqueda, filtros, orden y paginación.
- Fase 4: hallazgos desde controles históricos, tareas correctivas asignadas, envío a revisión por cliente, devolución con observaciones y aprobación por consultor, cierre justificado y plan de acción con filtros y progreso. Incluye historial protegido de cambios.
- Fase 5: evidencias por organización, control histórico, hallazgo o tarea; archivos privados en Supabase Storage; entregas corregidas sin sobrescribir originales; revisión por consultor, comentarios cronológicos y trazabilidad. Búsqueda, filtros, orden y paginación de evidencias.
- Fase 6: dashboard operativo con métricas objetivas y filtros, notificaciones internas por destinatario y auditoría ampliada en Administración, con exportación CSV y borrado exclusivo del administrador.
- Fase 7: informes PDF publicados por evaluación, copias inmutables, historial, acceso por organización y auditoría de publicación/descarga.
- La fase 8 queda pendiente. El perfil de tratamiento de fase 1 y el registro de actividades de fase 3 son módulos distintos.

Para la continuación acordada el 5 de octubre de 2026, la IA queda aplazada hasta completar y validar el MVP. Las notificaciones operativas externas (WhatsApp, email, SMS y otros canales) quedan fuera por ahora; se incorporan las notificaciones internas de fase 6 y se conservan los correos de autenticación existentes. La hoja de ruta y las condiciones de avance están en `docs/architecture.md`; la fase 7 está implementada localmente y la fase 8 permanece pendiente.

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
5. Para confirmar enlaces en dispositivos distintos configure el template de confirmación con token hash: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/onboarding`. Las invitaciones de organización requieren una cuenta creada por el administrador. La aplicación ya no utiliza enlaces de recuperación; `/recover` explica cómo contactar al administrador y `/reset-password` redirige allí. También se soporta callback PKCE `code` mediante el enlace predeterminado de Supabase en el navegador que inició la operación.
6. El registro público está cerrado. Complete el perfil del administrador inicial creado en el paso 1 con el SQL del paso 7. Después, las cuentas de cliente y consultor se crean exclusivamente desde Administración → Administración de cuentas.
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
2. El administrador crea primero la cuenta CLIENT en Administración → Administración de cuentas y la asocia directamente desde Administración → Usuarios y membresías → Clientes. Un cliente puede pertenecer a una sola organización. Se conserva la invitación por enlace como flujo opcional para cuentas existentes: exige email confirmado coincidente, vence en siete días, se acepta una vez y rechaza clientes asignados a otra organización. No se envía email de invitación.
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
src/features/reports/        Publicación de snapshots e informes PDF
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

Como SUPER_ADMIN, abra **Administración → Administración de cuentas → Crear cuenta de usuario**. Ingrese nombre completo, correo, contraseña inicial de 10 a 128 caracteres y rol **Cliente** o **Consultor**. La cuenta queda habilitada por el administrador, con email marcado como confirmado administrativamente; esto no demuestra que el usuario haya verificado su buzón. No se envía correo de alta. Comparta las credenciales de forma segura; el usuario puede cambiarla en Mi cuenta o solicitar un restablecimiento al administrador. El formulario no permite crear administradores. La edición de roles existente conserva sus restricciones: solo SUPER_ADMIN, sin editar la propia cuenta y sin membresías incompatibles.

Crear una cuenta o cambiar su rol no asigna organizaciones. El administrador realiza la asignación desde Administración → Usuarios y membresías: una organización por cliente y varias por consultor. Un consultor queda vinculado automáticamente a las organizaciones que crea. Para cambiar entre roles CLIENT y CONSULTANT retire primero las membresías incompatibles.

La Server Action y la Edge Function `admin-create-user` verifican al usuario y su rol actual en `profiles`. La función valida el JWT con `getUser`, sin confiar en metadata del usuario. La clave privilegiada permanece exclusivamente en el entorno gestionado de Supabase Functions; no se agrega a Next.js, `.env.local`, Docker ni variables públicas. Se utiliza la API administrativa oficial de Auth, sin fabricar usuarios ni contraseñas mediante SQL. Un trigger de Auth rechaza altas sin metadata administrativa protegida y sin administrador válido, también por la API pública; los roles SQL de mantenimiento `postgres` y `supabase_admin` conservan el bootstrap/importación. El perfil y el evento `ADMIN_ACCOUNT_CREATED`, con actor y rol, se generan en la transacción de alta. No se registran contraseñas.

La migración `20261007234041_admin_managed_accounts.sql`, aplicada en PrivacyAudit, bloquea también la RPC anterior de autoactivación. `supabase/config.toml` deshabilita signup general y por email para entornos locales nuevos. En otros proyectos aplique la migración y despliegue la función, además de deshabilitar **Allow new users to sign up** en Auth. La configuración remota y el estado de despliegue de esta entrega se documentan en `docs/verification.md`.

Despliegue de la función en el proyecto identificado:

```sh
supabase functions deploy admin-create-user --project-ref SU_PROYECTO
```

`verify_jwt=false` en esta función permite usar las claves publishable modernas: la función realiza explícitamente autenticación mediante Auth y autorización antes de crear la cuenta. No acepta solicitudes anónimas ni de clientes/consultores. No hay CORS público porque Next.js invoca la función desde servidor.

Verificación específica: `npm run test:ui:accounts`. `npm test` y `npm run test:db` incluyen las denegaciones de registro/autoactivación y la creación administrativa con rol y trazabilidad.

## Grillas administrativas de usuarios y membresías

Cambio solicitado el 7 de octubre de 2026. Abra **Administración → Usuarios y membresías**. La sección tiene dos grillas separadas con nombre, correo, organizaciones actuales y controles de asignación; búsqueda por nombre/correo y paginación independiente de 20 usuarios por grilla. El botón Crear usuarios y administrar roles lleva al módulo existente de cuentas.

- **Clientes:** seleccione una organización y pulse **Guardar asignación**. La asignación es inmediata, sin enlace ni aceptación del usuario. Cambiarla retira su acceso anterior y lo incorpora a la nueva organización en una sola transacción. **Sin organización** retira la membresía; la cuenta y su historial se conservan.
- **Consultores:** abra **Seleccionar organizaciones**, marque una o varias y pulse **Guardar organizaciones**. Las organizaciones desmarcadas dejan de estar asignadas; se conservan las seleccionadas. Desmarcar todas retira todas sus membresías. Ya no es necesario copiar el UUID en el resumen de una organización: allí existe un enlace a estas grillas.

Solo SUPER_ADMIN consulta estas grillas y guarda sus asignaciones. Un índice único parcial impide que cualquier cuenta tenga más de una membresía CLIENT, también mediante las RPC anteriores e invitaciones. Las membresías deben coincidir con el rol global, salvo las membresías históricas de SUPER_ADMIN. Cambiar de cliente a consultor o viceversa exige retirar antes las membresías incompatibles.

No se permiten nuevas asignaciones a organizaciones archivadas. Las membresías ya existentes en ellas se pueden conservar o retirar. Al transferir o retirar una membresía, los registros, tareas, evidencias y autores históricos permanecen; se pierde el acceso a los registros de la organización retirada. No se reasignan sus tareas automáticamente.

El guardado verifica en SQL el rol y las membresías que se mostraron al abrir la página. Si otro administrador los cambió, rechaza el guardado y solicita actualizar, sin sobrescribir el cambio. Solo se añaden/retiran relaciones que cambiaron; los triggers existentes conservan la auditoría con el administrador real. La lista de organizaciones se agrega en SQL, sin el límite de 1.000 filas de la API.

Prueba específica: `npm run test:ui:memberships`. Las pruebas SQL y de dominio están incluidas en `npm test` y `npm run test:db`. La migración `20261008004619_admin_membership_grids.sql` ya está aplicada en PrivacyAudit; no vuelva a aplicarla manualmente. El estado del despliegue y los resultados se documentan en `docs/verification.md`. El documento maestro permanece sin modificaciones.

### Corrección de creación de cuentas administrativas

El 7 de octubre de 2026 se corrigió el rechazo de cuentas CLIENT/CONSULTANT: Supabase Auth inserta la cuenta antes de aplicar `app_metadata`. La función `admin-create-user` ahora reserva un UUID, correo, nombre, rol y administrador mediante una RPC autenticada. La reserva privada vence en cinco minutos; el trigger la consume durante el alta y crea el perfil y la auditoría con el rol correcto. No se confía en metadata editable del usuario para autorizar el alta. El registro público sigue cerrado. Ante un fallo de Auth se cancela la reserva; las reservas vencidas se depuran al reservar otra cuenta.

Aplicar `20261008012856_fix_admin_account_provisioning.sql` y desplegar la versión actual de `admin-create-user`. Este ajuste se ejecuta en Supabase; no exige redesplegar Next.js en Dokploy.

### Edición y eliminación de cuentas (8 de octubre de 2026)

**Administración → Administración de cuentas** muestra nombre, correo, cambio de rol, edición y eliminación. Los botones de grilla tienen iconos y etiquetas accesibles. La edición permite cambiar nombre y correo; la eliminación exige escribir `ELIMINAR CUENTA`. Solo SUPER_ADMIN puede operar. Las cuentas administrativas y las cuentas con registros históricos asociados están protegidas contra eliminación; se conserva la auditoría.

Las tablas de cuentas y log tienen diez filas visibles como máximo y scroll interno con encabezado fijo. Conservan paginación de 20 resultados y filtros. Las acciones comparten variantes de `Button`: azul (`default`/`role`), verde para modificar/guardar (`edit`) y rojo para eliminar (`destructive`).

La migración `20261008120939_admin_account_management.sql` ya está aplicada en PrivacyAudit y `admin-manage-user` versión 1 está activa. Falta redesplegar Next.js y verificar edición/borrado con sesiones reales. La clave Auth Admin permanece exclusivamente en Supabase Functions. Consulte `docs/deployment.md`.

## Reglas y configuración general

Antes de implementar o modificar una operación, ejecutar SQL, aplicar migraciones o desplegar, consulte **[Reglas del sistema y del negocio](docs/system-and-business-rules.md)**. `AGENTS.md` exige esta revisión. El documento reúne permisos, eliminación de cuentas con historial asociado, membresías, estados de trabajo, evidencias y auditoría, e indica dónde se aplican y prueban las reglas. La autorización se sigue comprobando en servidor, RLS, RPC, triggers y FK; la aplicación no interpreta Markdown durante una solicitud.

La configuración compartida está en **[src/config/general.ts](src/config/general.ts)**:

- `actionStyles`: azul para acción general/rol, verde para modificar/guardar y rojo para eliminar. `Button` consume esas variantes; las clases Tailwind deben escribirse completas.
- `buttons`: variantes y tamaños, valores predeterminados y variante de formularios.
- `grids.visibleRows`: diez filas visibles de cuentas y auditoría; `headerHeightRem`, `accounts.rowHeightRem` y `audit.rowHeightRem` definen alturas y anchos. El layout convierte estos valores en variables CSS.
- `grids.pageSize`: 20 registros por página, usados por las consultas, cortes y paginación. Las RPC de cuentas, membresías y dashboard también aplican 20 en SQL; cambiar este contrato exige una migración coordinada.
- `grids.maxPageNumber` y `search.maxLength`: límites compartidos del frontend, con equivalentes en RPC SQL que también deben revisarse al cambiarlos.

Las modificaciones de presentación requieren build y redespliegue de Next.js. Este archivo es público y puede importarse en el navegador; nunca debe contener secretos. `src/lib/config.ts` mantiene las utilidades del entorno y las URL. El documento maestro y la arquitectura conservan el alcance y las decisiones de implementación.

## Organizaciones desde Administración

Desde el 8 de octubre de 2026 solo SUPER_ADMIN administra organizaciones: Administración → Organizaciones ofrece alta, consulta, edición y eliminación, con diez filas visibles, scroll y páginas de 20. Consultores/clientes continúan trabajando en sus evaluaciones y registros asociados; las organizaciones y membresías las provisiona el administrador.

Eliminar muestra un modal con Cancelar/Eliminar y advierte que se borran todos los datos relacionados, incluidos evidencias/archivos y auditoría de la organización. `admin-delete-organization` prepara y bloquea la organización, elimina blobs mediante Storage API y ejecuta la limpieza SQL transaccional. Si falla Storage o expira la ejecución, reintentar Eliminar desde Administración; puede haber archivos ya eliminados y el estado sigue bloqueado hasta completar. No se eliminan cuentas ni el catálogo global. Una constancia global no guarda identidad ni datos de la organización eliminada.

Verificación: `npm run test:ui:organizations` usa un backend aislado con migraciones reales y adaptador de Storage; verifica acceso por rol, CRUD, modal/cancelación, borrado relacionado, aislamiento y móvil. `tests/organizations.test.ts` verifica también versiones de evidencias, bloqueo de escrituras, negativa a finalizar con archivos y reintento. Las suites SQL limitan concurrencia a dos para acotar memoria de PGlite/WASM. Esto no equivale a una eliminación con JWT y archivos reales en Supabase.

Estado Supabase: migración `20261008134058_admin_organization_crud.sql` aplicada en `pbihajfbbcbbdvoqpggy`; `admin-delete-organization` v1 ACTIVE. Verificación SQL remota con rollback y rechazo 401 sin sesión aprobados. No se eliminaron organizaciones reales durante la verificación. Redesplegar Next.js en Dokploy después de actualizar el código de GitHub; queda pendiente verificar el recorrido con JWT y archivos reales.

Validación de esta entrega: 25 pruebas unitarias/SQL, lint, typecheck, build, CRUD administrativo de navegador y 216 comprobaciones de pantallas/flujos existentes aprobados.

## Catálogo en Administración y regla prioritaria

Administración → Catálogo de controles es exclusivo de SUPER_ADMIN, con alta, modificación y eliminación; iconos verde/rojo, scroll y paginación comunes. El catálogo global también queda restringido por RLS. Los controles aplicados siguen disponibles dentro de las evaluaciones mediante sus snapshots.

No se elimina un control aplicado en ninguna organización, aunque esté inactivo. Se permite modificar/desactivar sin alterar el historial. La FK protege también llamadas directas y concurrencia; el modal muestra el motivo de bloqueo.

**La eliminación completa de una organización prevalece sobre todas las otras reglas de conservación y eliminación de sus datos relacionados.** Se eliminan también aplicaciones/snapshots de controles, registros de organizaciones archivadas y evidencias confirmadas. Definiciones globales y cuentas compartidas permanecen; se retiran todos sus vínculos y datos de esa organización. Si el control ya no tiene aplicaciones en ninguna organización, el administrador puede eliminarlo. Esta precedencia queda documentada en las reglas y AGENTS.md y cubierta por pruebas SQL y navegador (`npm run test:ui:controls`).

Migración `20261008142527_admin_control_catalog.sql` aplicada en PrivacyAudit `pbihajfbbcbbdvoqpggy`. Pruebas SQL locales y remotas con rollback, pruebas de navegador, lint, typecheck y build aprobados. La prueba completa de organizaciones cubre además archivo, riesgo aceptado, versiones de evidencias confirmadas y prioridad del borrado. Pendiente redesplegar Next.js en Dokploy y recorrer con sesiones y archivos reales.

## Uso de fase 7

1. Abra una evaluación de una organización activa y seleccione **Publicar informe PDF**. Solo el consultor con membresía de gestión o SUPER_ADMIN puede publicar.
2. Complete título, resumen ejecutivo, alcance y conclusiones. Los tres textos profesionales admiten de 10 a 5.000 caracteres; no se generan conclusiones jurídicas automáticamente. Una evaluación no completada puede producir un diagnóstico parcial: el informe identifica su estado y pendientes.
3. Publicar comparte inmediatamente el informe completo con todos los miembros actuales de la organización. Incluye el plan con todas las tareas y responsables de esa evaluación, aunque el cliente vea solo sus tareas en el módulo operativo. La advertencia del formulario explica este alcance. No incluye contactos privados de cuentas, correos de Auth ni blobs de evidencias.
4. En **Informes**, abra una versión y seleccione **Descargar PDF**. Hay portada y diez secciones: resumen, alcance, metodología, avance, resultados por categoría, hallazgos por severidad, plan de acción, tratamientos, evidencias revisadas y conclusiones; incluye el disclaimer del maestro y paginación A4.
5. Cada publicación conserva una copia histórica transaccional; ediciones posteriores de la organización/evaluación no alteran sus datos. No se permite editar ni borrar informes individualmente. Para corregir publique otro. La eliminación administrativa completa de una organización sí borra todos sus informes y auditoría asociada, conforme a ORG-04.

Los controles/hallazgos/tareas son de la evaluación seleccionada; tratamientos de toda la organización (incluidos borradores y archivados, identificados); evidencias revisadas vinculadas a esa evaluación y documentos generales de la organización. Incluye versiones anteriores y decisiones de aceptación/rechazo/cambios con fecha y revisor. Excluye cargas incompletas y entregas pendientes; no adjunta los archivos originales. Avance de evaluación y progreso de tareas son métricas de registro/aprobación, sin score legal.

La tabla `reports` conserva FK reales a organización, evaluación y autor; la RPC autorizada obtiene el snapshot íntegro en una sentencia SQL, sin truncamiento de 1.000 filas. RLS limita lectura por membresía actual. El PDF se prepara en servidor con PDFKit y fuentes Noto Sans OFL incorporadas; no requiere Chromium, Python ni servicios externos en producción. No guarda otro blob: cada descarga vuelve a representar la copia guardada con el renderer versión 1. La ruta autentica, vuelve a comprobar autorización al registrar la descarga y responde sin caché. `REPORT_GENERATED` registra publicación; `REPORT_DOWNLOAD` registra preparación, sin afirmar que el destinatario abrió o recibió el documento.

Migración: `20261009021625_phase7_reports.sql`, **aplicada en PrivacyAudit `pbihajfbbcbbdvoqpggy`** el 8 de octubre de 2026. El archivo local se alineó con la versión asignada por Supabase. No volver a aplicarla manualmente. Código de fase 7 publicado en GitHub `main` (commit `76adb79`); la sincronización del historial y esta documentación se publica después de la aplicación remota. No se desplegó en Dokploy desde esta sesión; falta comprobar el recorrido autenticado publicado. Se mantiene el maestro original. Comprobación local: `npm run test:ui:reports` (adaptador aislado, sin acreditar Auth/PostgREST reales); `npm test` y `npm run test:db` incluyen permisos, snapshots, borrado y generación PDF. Resultados en `docs/verification.md`.

### Restablecimiento administrativo sin correo — 9 de octubre de 2026

Se conserva Supabase Auth. La nueva acción se reserva y audita de forma transaccional con ADMIN_ACCOUNT_PASSWORD_RESET, sin guardar contraseña ni hash en tablas de negocio o logs. Los campos se limpian después del éxito. El administrador no restablece su propia contraseña desde la grilla; usa Mi cuenta. Recuperar el acceso del único SUPER_ADMIN requiere intervención de infraestructura. Se retiran las sesiones de la cuenta afectada; los JWT de acceso ya emitidos pueden seguir válidos hasta expirar.

Migración: `20261009034053_admin_password_reset.sql`. Backend: `admin-manage-user`, con la clave privilegiada solo en Supabase Functions. Pruebas: `tests/password-reset.test.ts`, incluidas negativas de rol/confirmación y rollback por cambio de rol, y `npm run test:ui:accounts`. Los adaptadores de prueba no demuestran un recorrido remoto real de Auth. Desplegar migración y Function antes del frontend; las APIs previas siguen compatibles.

Estado remoto: migración `20261009034053_admin_password_reset.sql` aplicada en PrivacyAudit (`pbihajfbbcbbdvoqpggy`), con archivo local alineado al historial asignado por Supabase. `admin-manage-user` v3 y `admin-create-user` v5 ACTIVE; verificación SQL con rollback aprobada mediante `scripts/verify-password-reset-remote.sql` y endpoint sin sesión devuelve 401. La conexión SQL alojada no permite SET ROLE supabase_auth_admin: la comprobación remota usa el rol de mantenimiento para los UPDATE de Auth; las pruebas locales sí reproducen ese rol. Ninguna contraseña de cuenta real se modificó. Pendiente redesplegar Next.js en Dokploy y recorrer con sesiones Auth reales.

## Responsables de hallazgos — 9 de octubre de 2026

El alta y el cambio de responsable de un hallazgo permiten únicamente Sin asignar o una cuenta CLIENT con membresía CLIENT actual en la misma organización. La lista filtra membresía y rol de perfil; la Server Action y un trigger de PostgreSQL verifican la misma regla. Consultores, administradores y clientes de otras organizaciones no se admiten, incluso por API directa. Las asignaciones históricas no se migran ni reasignan automáticamente; una edición sin cambiar responsable las conserva y muestra la opción histórica deshabilitada. Las tareas mantienen su regla anterior de asignación a miembros.

Migración: `20261009040745_finding_client_assignees.sql`. El frontend requiere redespliegue en Dokploy. Pruebas: `tests/workflow.test.ts` y selector del recorrido de navegador `scripts/check-ui.ts`.

Estado: migración `20261009040745_finding_client_assignees.sql` aplicada en PrivacyAudit `pbihajfbbcbbdvoqpggy`; verificación SQL remota con rollback aprobada. Prueba focalizada: `npm run test:ui:finding-assignees`, incluye creación/edición, organización sin clientes y conservación de una asignación histórica después de retirar la membresía. Pendiente redesplegar Next.js en Dokploy.
