# Arquitectura y alcance

## Plan técnico

1. Fase 1: Next.js App Router, Supabase Auth SSR, perfiles, organizaciones, membresías, invitaciones mediante enlaces, RPC transaccionales y RLS.
2. Verificar permisos, aislamiento y build de fase 1 antes de continuar.
3. Fase 2: catálogo global, evaluaciones y snapshots de controles activos, respuestas y dashboard con avance objetivo.
4. Verificar transacciones, estados, aislamiento y build de fases 1 y 2.
5. Fase 3 autorizada el 5 de octubre de 2026: registro de actividades de tratamiento por organización, consulta de clientes y CRUD de consultores autorizados; verificar RLS, formularios y build. Fase 3 implementada, publicada y redesplegada; recorrido con JWT reales pendiente.

6. Fase 4 autorizada el 6 de octubre de 2026: hallazgos asociados a evaluación y control histórico, tareas asignadas, revisión por consultor, plan de acción y trazabilidad. Verificar RLS, formularios y build. Fase 4 implementada.

7. Fase 5 autorizada el 7 de octubre de 2026: evidencias, Storage privado, comentarios y revisión; verificar RLS de archivos y registros, recorridos de navegador y build. Fase 5 implementada.

8. Fase 6 autorizada el 7 de octubre de 2026: dashboard operativo, métricas, filtros, notificaciones internas y auditoría administrativa ampliada solicitada por el usuario. Fase 6 implementada; fases 7 y 8 pendientes.

## Decisiones

- Supabase externo. No hay backend Express, secretos privilegiados en la aplicación ni fallback con datos simulados.
- Cada petición verifica usuario con getUser; proxy renueva cookies con getClaims. RLS aplica incluso mediante llamadas directas a API.
- Rol global en profiles, inmutable por los clientes. Las membresías determinan acceso por organización y rol efectivo; un consultor necesita membresía CONSULTANT para editar esa empresa.
- Desde el cambio del 7 de octubre de 2026, solo SUPER_ADMIN crea cuentas CLIENT/CONSULTANT desde Administración. Registro público y autoactivación deshabilitados. Una función de Supabase verifica sesión/rol y usa Auth Admin; un trigger bloquea altas no administrativas y genera perfil/rol y trazabilidad atómicamente. Next.js conserva únicamente claves públicas. El administrador inicial se provisiona mediante mantenimiento, nunca metadata editable del usuario.
- Invitaciones con token aleatorio de 64 caracteres hexadecimales, hash SHA256 y expiración de siete días. Solo se aceptan con email confirmado coincidente. Se comparte un enlace explícito; no se envía correo de invitación automáticamente.
- Funciones SECURITY DEFINER solamente en esquema private, con search_path fijo, comprobaciones de identidad y autorización. Wrappers públicos SECURITY INVOKER exponen únicamente operaciones concretas.
- Crear organización y membresía, crear evaluación y respuestas, aceptar invitación: operaciones atómicas en base de datos.
- Cada assessment_control conserva una copia de contenido del catálogo. Desactivar o editar un control global no cambia una evaluación existente. IDs y organización de evaluaciones y respuestas no pueden reasignarse.
- NOT_APPLICABLE exige motivo. COMPLETED exige cero controles pendientes y al menos un control. Se puede reabrir a IN_PROGRESS por consultor para corregir; al reabrir se elimina completed_at.
- RLS y pruebas de fases 1–2 se hacen ahora, aunque el maestro también las agrupa en fase 8. Son parte esencial de fase 1.
- Archivar organizaciones conserva historial. Borrado permanente permitido solo sin evaluaciones; FK RESTRICT protege historial existente.
- Controles son ejemplos operativos pendientes de revisión jurídica; sin inferencias jurídicas automáticas ni score legal.

## Límite

La entrega anterior terminaba en fase 4: incorpora tratamientos, hallazgos, tareas, plan de acción y trazabilidad de estos nuevos flujos. La entrega anterior no incluía evidencias ni Storage. La fase 5 los incorpora; fase 6 incorpora notificaciones internas y auditoría ampliada. Informes e IA siguen pendientes. En fases anteriores, los comentarios de consultor pertenecían a la respuesta de control; fase 5 añade conversaciones independientes en hallazgos, tareas y evidencias. El cliente puede agregar su comentario al control mediante una RPC limitada a ese campo; no puede editar estados ni comentarios del consultor. La entidad independiente de comentarios se incorpora en fase 5.

Los tratamientos usan FK a organización y autor; la organización no puede borrarse mientras conserve tratamientos. Nombre, finalidad y al menos una categoría de titulares y datos son obligatorios. Base de licitud propuesta seleccionable con explicación editable, sin validación jurídica automática. Responsable interno, sistemas, destinatarios y proveedores son texto en esta fase, como permite el maestro; no representan nuevas entidades relacionadas.

Estados de tratamiento: DRAFT, ACTIVE y ARCHIVED. El consultor puede archivar y reactivar un tratamiento. Los tratamientos de organizaciones archivadas son de solo lectura para todos. Los clientes solo consultan registros de sus organizaciones; consultores con membresía de gestión y SUPER_ADMIN pueden crear, editar y eliminar en organizaciones activas. La app pide confirmación escrita para eliminación permanente y ofrece archivo para conservar el registro. La identidad, organización, autor y fecha de creación se protegen también en SQL; autor y timestamps de creación se obtienen en base de datos. Supabase RLS protege SELECT, INSERT, UPDATE y DELETE incluso mediante API directa.

## Acuerdos para la continuación

El 5 de octubre de 2026 el usuario acordó continuar el MVP incrementalmente según las fases 3–8 del documento maestro y posteriormente autorizó iniciar fase 3. El 6 de octubre de 2026 el usuario autorizó continuar con fase 4 pese al pendiente de validación con sesiones reales, que se conserva explícitamente. El 7 de octubre de 2026 el usuario autorizó fase 5. El usuario autorizó completar fase 6 con auditoría administrativa ampliada; las fases 7–8 siguen pendientes.

- Orden previsto: tratamientos; hallazgos, tareas y plan de acción; evidencias y revisión; dashboard y notificaciones internas; informe PDF; cierre con auditoría, seguridad, demo y revisión UX.
- La IA queda aplazada hasta después de completar y validar el MVP. No implementar ahora asistentes de redacción, recomendaciones generadas ni integraciones con modelos.
- Las notificaciones operativas externas quedan fuera por ahora: WhatsApp, email de tareas o evidencias, SMS y otros canales externos. Las notificaciones dentro de la aplicación se implementan en fase 6. Se conservan los correos de autenticación para confirmación y recuperación de contraseña.
- Verificar permisos y aislamiento en cada fase, incluyendo Storage al incorporar evidencias. Incorporar trazabilidad de acciones relevantes junto con los flujos de hallazgos y evidencias; completar su revisión en fase 8.
- Se revisaron los pendientes de fases 1 y 2: login y healthcheck públicos responden HTTP 200, siete tablas existentes con RLS y una cuenta remota confirmada con sesión. Recuperación por correo, renovación e aislamiento con JWT reales permanecen pendientes. No considerar una prueba local ni la existencia de una sesión como verificación completa de esos flujos.

## Decisiones de fase 4

- Cada hallazgo pertenece a una evaluación y puede asociarse a un control histórico: `findings.control_id` referencia el UUID de `assessment_controls`, no el catálogo global mutable. Las FK compuestas garantizan que evaluación, control y organización coincidan. Esas relaciones son inmutables tras crear el hallazgo.
- Código visible H seguido de una secuencia generada por PostgreSQL. La secuencia es global y puede tener saltos, incluso por rollback; no es una numeración correlativa por empresa.
- Área editable en el hallazgo permite el filtro solicitado por el plan; no se crea una entidad de plan ni un Kanban.
- Solo se asignan miembros de la misma organización. Retirar la membresía elimina el acceso, pero conserva la referencia histórica; el consultor puede reasignar. Identidad, autor y fechas se controlan en SQL.
- Clientes leen los hallazgos de sus organizaciones y únicamente sus tareas asignadas. La RPC de progreso devuelve totales autorizados sin exponer las tareas de otros clientes. Consultores autorizados y administradores gestionan registros de organizaciones activas.
- Tareas comienzan TODO. El cliente asignado puede pasar a IN_PROGRESS o WAITING_REVIEW mediante una RPC limitada a estado; no puede modificar asignación, prioridad, título ni aprobar. El consultor puede aprobar una tarea en revisión (DONE) o devolverla con observaciones obligatorias. Reabrir tarea elimina completed_at.
- Cerrar un hallazgo exige justificación y todas sus tareas aprobadas. Aceptar riesgo requiere justificación explícita y puede conservar tareas pendientes. Ambos estados bloquean cambios de tareas hasta reabrir. El trigger de tareas bloquea el hallazgo para serializar escrituras con el cierre.
- Se conservan hallazgos y tareas: no se ofrece borrado permanente. Se corrigen por edición/reapertura o se cierran con justificación. FK RESTRICT protege referencias e historial.
- `audit_logs` se introduce para la trazabilidad autorizada de hallazgos y tareas: eventos generados por triggers, actor real y cambios de estado, prioridad, responsable, observaciones y justificación. Los usuarios no escriben ni alteran el log. La actividad de hallazgos y tareas la consultan gestores autorizados; fase 5 permite además a los clientes consultar la actividad de evidencias autorizadas. La fase 6 amplía los eventos y ofrece administración/exportación/borrado por petición del usuario; su revisión final sigue en fase 8. Comentarios independientes y evidencias se incorporan en fase 5.

## Decisiones de fase 5

- `evidence` referencia controles históricos, hallazgos y tareas mediante FK compuestas por organización. Las evidencias de una tarea heredan su hallazgo. Si también se indica control y hallazgo, se exige que el control pertenezca a su evaluación.
- Una entrega contiene un archivo inmutable y una revisión única. `previous_evidence_id`, con FK real y unicidad, enlaza una corrección de una entrega rechazada o con cambios solicitados. La corrección conserva organización y relaciones; los archivos anteriores no se sobrescriben ni se borran.
- Bucket privado `evidence`; rutas deterministas por organización y UUID de entrega, sin nombres aportados por el usuario en la ruta. Límite de 10 MB y tipos PDF, PNG, JPG, DOCX, XLSX y TXT. No se afirma inspección antivirus ni análisis documental.
- Reserva → carga autenticada directa a Storage → confirmación limitada mediante RPC. PostgreSQL verifica existencia, MIME y tamaño del objeto antes de marcarlo disponible para revisión. Las reservas incompletas se pueden confirmar o descartar por su autor; no hay borrado de entregas confirmadas.
- Las políticas de escritura de Storage bloquean la reserva para serializar carga o eliminación con confirmación. Un trigger de borrado impide eliminar una reserva que conserve objeto o que ya esté confirmada. No se otorgan políticas de UPDATE/upsert.
- Lectura de evidencias de tarea exige consultor gestor o cliente asignado; los documentos generales de la organización, de control y de hallazgo respetan membresía. Las mismas reglas se aplican a los archivos y a los comentarios asociados. Retirada de membresía y reasignación de tarea se verifican con datos actuales, no metadata del JWT.
- Solo consultor autorizado o SUPER_ADMIN revisan una entrega confirmada pendiente. Rechazar o solicitar cambios exige observaciones; actor y timestamps se determinan en SQL. Las organizaciones archivadas, tareas aprobadas y hallazgos cerrados o con riesgo aceptado bloquean nuevas entregas y revisiones hasta reabrir.
- Comentarios independientes, inmutables y con exactamente una FK a hallazgo, tarea o evidencia. Se conservan los comentarios anteriores de respuesta de control. La UI muestra los últimos 100 comentarios cronológicamente.
- La app descarga mediante una ruta autenticada, con RLS también en Storage, respuesta sin caché y Content-Disposition attachment. No crea URLs públicas ni firmadas reutilizables.
- Aceptar evidencia no cambia automáticamente control, tarea ni hallazgo. Aprobar tarea o cerrar hallazgo exige que las últimas entregas confirmadas asociadas estén aceptadas; las versiones anteriores sustituidas se conservan. Aceptar riesgo mantiene su excepción explícita y justificada.
- Se reutiliza `audit_logs` con eventos de carga confirmada, revisión y comentario. Los clientes leen únicamente actividad de evidencias autorizadas, además de sus comentarios; no obtienen acceso global al log. Fase 6 amplía la captura y agrega auditoría administrativa; la revisión final permanece en fase 8.

## Decisiones de fase 6

- `dashboard_summary` es una RPC SECURITY INVOKER: agrega datos con RLS y pagina organizaciones en SQL. Filtros de búsqueda/estado/atención afectan métricas y tabla. No hay límite implícito de 1.000 registros para totales. Los controles se agregan sobre la evaluación más reciente por organización; tareas de cliente conservan su alcance personal; últimas entregas confirmadas evitan contar versiones sustituidas. No se introduce score legal.
- `notifications` pertenece a un destinatario y tiene FK a organización y contexto (tarea/hallazgo/evidencia). Solo triggers privados generan eventos; usuarios únicamente consultan y marcan lectura mediante RPC limitada. La política exige destinatario actual y acceso actual al contexto; los avisos antiguos dejan de ser visibles tras pérdida de membresía/asignación.
- Los avisos incluyen asignación, revisión/devolución/aprobación de tarea, carga/revisión de evidencia y revisión de hallazgo. Se excluye al actor de sus propios avisos transaccionales. Los destinatarios gestores son miembros CONSULTANT con rol global compatible; SUPER_ADMIN no recibe automáticamente todos los avisos del sistema.
- Supabase Cron ejecuta el worker de vencimientos cada 15 minutos. Usa fecha America/Santiago, organiza destinatarios por membresía y deduplica tarea/fecha/responsable con índice único y lock transaccional. No depende de visitas al dashboard. No hay canal externo.
- Auditoría ampliada mediante triggers después de mutaciones y funciones acotadas para descargas/exportación. Mantiene compatibilidad con los historiales de fases 4 y 5. Referencias históricas de organización/actor y snapshot de nombre/rol, conservadas al eliminar entidades vacías. Campos modificados/valores operativos seleccionados, sin secretos ni documentos completos. Eventos previos ausentes no se reconstruyen.
- Auth tiene captura propia de cuentas creadas, cambios de last_sign_in_at y actualizaciones de credencial, y sesiones eliminadas; no copia hashes. El stream opcional de auditoría Auth complementa esos eventos cuando está habilitado. Una sesión eliminada se denomina sesión terminada, sin afirmar que siempre fue un logout humano. El login SQL de prueba no equivale a una sesión emitida por GoTrue.
- Auditoría administrativa exclusiva de SUPER_ADMIN, con filtros, fechas de Chile y CSV de todos los resultados paginado por UUID, corte temporal y protección de fórmulas. La preparación del archivo se registra; esto no demuestra que el usuario abrió el archivo. Las solicitudes de descarga de la app se registran tras recuperar el blob; no se afirma auditoría de accesos directos al servicio de Storage fuera de la app.
- El usuario autorizó adelantar parte de la auditoría de fase 8. Ningún usuario tiene escritura directa en `audit_logs`. Una RPC privada con comprobación SUPER_ADMIN borra eventos anteriores a una fecha, con motivo y confirmación explícita. Consulta/exportación filtrada y borrado global por fecha son operaciones distintas, descritas en UI y README. Las constancias del borrado se conservan y registran el número eliminado; eliminación y recibo son atómicos.
- Las tres migraciones están aplicadas en el proyecto dedicado. Se validaron SQL y permisos remotos con ROLLBACK; quedan pendientes despliegue y recorridos con Auth/Storage reales. La fase 7 y el cierre final de fase 8 no se iniciaron.

## Grillas administrativas de membresías

Desde el cambio del 7 de octubre de 2026, Administración → Usuarios y membresías ofrece dos grillas paginadas por rol: CLIENT con una organización como máximo y CONSULTANT con varias. Las RPC administrativas de lectura verifican SUPER_ADMIN antes de consultar correo desde Auth y membresías; no se amplían los grants de Auth ni las políticas de lectura de otros usuarios. La consulta de organizaciones se agrega en SQL sin truncamiento de la Data API.

`set_user_organizations` recibe el rol y la lista de membresías que mostró la página. La función privada comprueba al administrador, bloquea el perfil para serializar asignaciones, verifica el estado actual y aplica solo diferencias. El snapshot recibido detecta guardados obsoletos. Valida todas las organizaciones antes de retirar acceso; rechaza altas nuevas en archivadas y permite conservar/retirar las existentes. La transferencia de cliente es atómica y no altera sus registros históricos ni reasigna tareas.

Un índice único parcial sobre `organization_members(user_id) WHERE role='CLIENT'` garantiza una sola organización también en las RPC heredadas y en concurrencia. Un trigger comprueba compatibilidad de rol; los cambios administrativos de rol requieren retirar relaciones incompatibles en ambos sentidos. La aceptación de invitaciones bloquea el perfil y rechaza explícitamente otra organización, sin ocultar el conflicto con ON CONFLICT DO NOTHING. RLS sigue comprobando la membresía actual para registros, archivos y notificaciones. La migración rechaza datos preexistentes incompatibles sin elegir ni eliminar relaciones automáticamente.

## Corrección del aprovisionamiento administrativo

Auth Admin aplica `app_metadata` después del INSERT inicial de `auth.users`. Por ello el control anterior basado en esa metadata rechazaba también las altas legítimas. `reserve_account_provisioning` verifica SUPER_ADMIN y reserva en el esquema privado un UUID vinculado a correo, nombre, rol y actor durante cinco minutos. La Edge Function pasa ese UUID a Auth Admin createUser. El trigger BEFORE INSERT consume la reserva y completa los datos protegidos antes de crear el perfil y su auditoría. No admite altas con metadata imitada ni reservas para SUPER_ADMIN. Se comprueba nuevamente el rol del actor al consumir. Las cuentas existentes no cambian.

## Administración de cuentas y grillas acotadas (8 de octubre de 2026)

Administración → Administración de cuentas conserva creación y agrega una tabla con nombre, correo y tres acciones por icono: rol azul, edición verde, eliminación roja. Nombre y correo se editan en un diálogo separado del cambio de rol. Las tablas de cuentas y log tienen encabezado fijo, altura máxima de diez filas y desplazamiento interno; mantienen páginas de 20 registros para navegar todos los resultados. `Button` define las variantes comunes y AGENTS.md fija su uso futuro.

`admin_accounts` exige SUPER_ADMIN antes de leer los correos de Auth, incluye administradores y busca por nombre/correo con orden estable. `admin-manage-user` verifica JWT y rol actual y utiliza Auth Admin exclusivamente dentro de Supabase Functions. Una reserva privada de un minuto vincula actor, operación, cuenta y datos exactos. El trigger de Auth consume la reserva, sincroniza el nombre canónico y registra el cambio de correo en la misma transacción de Auth. Actualizar metadata por cuenta propia no modifica el nombre canónico administrado. Se comprueba consumo antes de comunicar éxito y se cancela la reserva restante.

La eliminación exige confirmación escrita `ELIMINAR CUENTA`; se protegen las cuentas SUPER_ADMIN. El trigger elimina sesiones antes de borrar Auth; la cascada retira perfil, membresías y avisos. Las FK de negocio existentes bloquean el borrado si hay autoría, asignaciones u otros registros históricos asociados. No se borran evidencias ni historial para forzar una eliminación. El evento administrativo conserva actor, UUID y nombre/correo del sujeto. La migración y función de esta entrega se prepararon localmente; su aplicación remota y el redespliegue siguen pendientes.
