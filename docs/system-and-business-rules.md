# Reglas del sistema y del negocio

Vigentes al 8 de octubre de 2026. Fuente de consulta obligatoria antes de implementar o modificar una operación, ejecutar SQL, preparar una migración o desplegar cambios de PrivacyAudit. También consultar `AGENTS.md`, `docs/architecture.md`, `docs/references/index.md` y el documento maestro `PrivacyAudit.docx`.

Este archivo reúne las reglas vigentes; las validaciones ejecutables están en las Server Actions, Supabase Functions, RPC, RLS, triggers y claves foráneas. La aplicación no interpreta Markdown para autorizar solicitudes. Antes de guardar o borrar, el servidor y la base de datos vuelven a comprobar identidad, permisos, relaciones y estado actual. Ocultar un botón no constituye autorización.

## Cómo trabajar con estas reglas

1. Identificar la operación, actor, organización y registros afectados. Consultar las reglas correspondientes antes de modificar o ejecutar esa operación.
2. Mantener las comprobaciones del servidor y de la base de datos; revisar las dependencias y el historial antes de una eliminación.
3. Aplicar los valores compartidos de `src/config/general.ts` para botones, paginación, búsquedas y grillas. No duplicarlos en componentes nuevos.
4. Si el usuario cambia una regla, actualizar este documento, su implementación y las pruebas relevantes en la misma entrega. Las instrucciones explícitas vigentes del usuario tienen prioridad; no introducir excepciones por cuenta propia. Si documentos y código difieren, registrar y resolver la diferencia, sin presentar como aplicada una regla que solo está escrita.
5. Todo cambio SQL requiere una migración generada mediante `supabase migration new`. Identificar el proyecto remoto antes de aplicarla y documentar qué quedó aplicado, publicado y verificado. GitHub, Supabase y Dokploy tienen pasos de despliegue independientes.

## Identidad, cuentas y acceso

| Regla                              | Condición obligatoria                                                                                                                                                                                                                                                                            | Aplicación actual                                                                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| SYS-01 — Sesión y permisos         | Verificar sesión en servidor y rol actual en `profiles`; no autorizar mediante metadata editable del usuario.                                                                                                                                                                                    | `src/features/auth/queries.ts`, RLS y funciones privadas en las migraciones.                                          |
| SYS-02 — Aislamiento               | Un cliente o consultor solo accede a organizaciones y registros que autorice su membresía actual. SUPER_ADMIN tiene el alcance administrativo previsto.                                                                                                                                          | RLS de registros y Storage; RPC con comprobaciones de identidad y organización.                                       |
| SYS-03 — Credenciales              | Las credenciales Auth Admin permanecen exclusivamente en Supabase Functions; nunca en Next.js, configuración pública ni navegador.                                                                                                                                                               | `supabase/functions/admin-create-user` y `admin-manage-user`.                                                         |
| CTA-01 — Alta                      | Solo SUPER_ADMIN crea cuentas CLIENT o CONSULTANT. Registro público y autoactivación de consultores cerrados.                                                                                                                                                                                    | Reserva administrativa, trigger de Auth y `admin-create-user`.                                                        |
| CTA-02 — Modificación              | Solo SUPER_ADMIN administra los datos de otras cuentas y asigna roles. Cada usuario puede editar su propio nombre en Mi cuenta. Nadie puede cambiar su propio rol. Un cambio de rol exige retirar antes las membresías incompatibles.                                                            | `src/features/users/actions.ts`, `set_user_role` y `admin-manage-user`.                                               |
| CTA-03 — Eliminación               | **No se puede borrar un usuario que tenga operaciones de negocio o registros históricos asociados**: autoría, asignaciones, evaluaciones, tratamientos, hallazgos, tareas, evidencias, comentarios u otras referencias protegidas. No borrar ni reasignar esos registros para forzar el borrado. | FK de negocio con RESTRICT/NO ACTION; rollback de la transacción de Auth. Prueba: `tests/account-management.test.ts`. |
| CTA-04 — Protección administrativa | No eliminar cuentas SUPER_ADMIN ni la propia cuenta. El borrado autorizado requiere escribir `ELIMINAR CUENTA`.                                                                                                                                                                                  | UI, Server Action, handler y reserva/trigger SQL.                                                                     |
| CTA-05 — Trazabilidad del borrado  | Eliminar una cuenta sin relaciones protegidas retira sesiones, perfil, membresías y avisos; conserva el log y sus referencias históricas.                                                                                                                                                        | `20261008120939_admin_account_management.sql` y migraciones de retención de identidad.                                |

Para CTA-03, los registros de acceso y auditoría por sí solos no bloquean el borrado de una cuenta sin operaciones de negocio vinculadas: se conservan mediante snapshots y `actor_ref`. Esa es la política actualmente implementada. El administrador no tiene una excepción para borrar cuentas con relaciones de negocio protegidas. Modificar esta política requiere una decisión explícita y cambios coordinados en la implementación.

## Organizaciones y membresías

| Regla                 | Condición obligatoria                                                                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORG-01 — Cardinalidad | CLIENT pertenece a una organización como máximo; CONSULTANT puede tener varias. Aplicar también en invitaciones y RPC heredadas.                                                                      |
| ORG-02 — Asignación   | La asignación administrativa corresponde a SUPER_ADMIN, es transaccional y auditada. Rechazar guardados obsoletos o relaciones incompatibles.                                                         |
| ORG-03 — Archivo      | Las organizaciones archivadas son de solo lectura para operaciones de negocio y no admiten nuevas membresías. Se pueden conservar o retirar las ya existentes.                                        |
| ORG-04 — Borrado      | Solo SUPER_ADMIN, después de confirmar el modal con Cancelar/Eliminar, elimina la organización y TODOS sus datos relacionados y archivos. Operación permanente; no borrar cuentas ni catálogo global. |
| ORG-05 — Invitaciones | Cuenta CLIENT existente, correo confirmado coincidente, token válido no revocado y vigencia de siete días. No crear una segunda membresía de cliente ni crear cuentas desde el enlace.                |

ORG-06 — Administración: creación, consulta del módulo, modificación y eliminación disponibles exclusivamente en Administración para SUPER_ADMIN; RLS/RPC y Server Actions aplican la restricción. Clientes y consultores mantienen sus flujos de evaluaciones, tratamientos, hallazgos, tareas y evidencias según membresía.

El borrado de organización autorizado el 8 de octubre es una excepción explícita a FLU-05, EVI-02 y EVI-04: elimina también historial, entregas confirmadas y comentarios. La preparación bloquea escrituras; los archivos se eliminan mediante Storage API antes de la limpieza transaccional SQL. Ante error, queda bloqueada y el administrador reintenta Eliminar; no comunicar éxito parcial. Los eventos asociados y snapshots del log se eliminan. Solo queda una constancia administrativa global sin identidad ni datos de la organización. Las cuentas se conservan, aunque pierden las membresías de esa organización.

Implementación: `admin_organization_crud`, `admin-delete-organization`, `src/app/(workspace)/administration/organizations`, migraciones de identidad, membresías y tratamientos; `src/features/organizations` y `src/features/users/membership-actions.ts`. Pruebas: `tests/phase1.test.ts`, `tests/memberships.test.ts`, `tests/database.test.ts` y `tests/organizations.test.ts`.

## Evaluaciones, tratamientos y trabajo correctivo

| Regla                 | Condición obligatoria                                                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EVA-01 — Historia     | Los controles de cada evaluación conservan snapshots. Editar el catálogo no altera evaluaciones existentes ni permite reasignar sus relaciones.                                                                                   |
| EVA-02 — No aplica    | NOT_APPLICABLE exige motivo. El cliente no puede modificar los estados o comentarios del consultor; su comentario usa una operación limitada.                                                                                     |
| EVA-03 — Finalización | COMPLETED exige al menos un control y cero controles pendientes. Reabrir a IN_PROGRESS elimina `completed_at`.                                                                                                                    |
| TRA-01 — Tratamientos | Solo gestores autorizados crean/editan/eliminan en organizaciones activas. El cliente consulta. Nombre, finalidad y categorías son obligatorios. El borrado es confirmado; autor, organización e identidad se protegen en SQL.    |
| FLU-01 — Relaciones   | Hallazgo, evaluación, control histórico, tarea y organización deben coincidir mediante FK reales; las relaciones históricas son inmutables.                                                                                       |
| FLU-02 — Asignación   | Asignar solo miembros de la misma organización. Retirar acceso conserva autoría y asignaciones históricas; no reasignar automáticamente tareas.                                                                                   |
| FLU-03 — Tareas       | El cliente solo actualiza su tarea asignada a IN_PROGRESS o WAITING_REVIEW mediante la operación limitada. Solo un gestor autorizado aprueba o devuelve, con observaciones cuando se devuelve.                                    |
| FLU-04 — Cierre       | Cerrar hallazgo exige justificación, tareas aprobadas y últimas evidencias asociadas aceptadas. Aprobar tarea también exige las últimas entregas aceptadas. Aceptar riesgo conserva su excepción explícita y exige justificación. |
| FLU-05 — Conservación | No ofrecer borrado permanente de hallazgos o tareas. Un hallazgo cerrado o con riesgo aceptado bloquea cambios de tareas hasta reabrir. Reabrir tarea retira `completed_at`.                                                      |

Implementación: `supabase/migrations` de fases 2–5 y `src/features/assessments`, `processing` y `workflow`. Pruebas: `tests/database.test.ts`, `tests/processing.test.ts`, `tests/workflow.test.ts` y `tests/evidence.test.ts`.

## Evidencias, comentarios, avisos y auditoría

| Regla                   | Condición obligatoria                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EVI-01 — Archivos       | Bucket privado y autorización actual para cada carga/descarga. Sin URLs públicas ni upsert. Límite de 10 MB; tipos PDF, PNG, JPG, DOCX, XLSX y TXT.                                                                             |
| EVI-02 — Entregas       | Reservar, cargar y confirmar comprobando existencia/tamaño/MIME. Archivo confirmado inmutable; las correcciones enlazan versiones anteriores y conservan historia. No borrar entregas confirmadas.                              |
| EVI-03 — Revisión       | Solo gestor autorizado revisa. Rechazo o cambios solicitados exigen observaciones. Organizaciones archivadas, tareas aprobadas y hallazgos cerrados bloquean nuevas entregas/revisiones hasta reabrir.                          |
| EVI-04 — Comentarios    | Comentarios independientes inmutables, con una relación real a hallazgo, tarea o evidencia y acceso actual al contexto.                                                                                                         |
| NOT-01 — Avisos         | Solo avisos internos; lectura y marcado solo del destinatario autorizado. No agregar WhatsApp, SMS ni email operativo. Conservar correos de autenticación.                                                                      |
| AUD-01 — Escritura      | Los usuarios no escriben ni alteran directamente el log. Registrar actor real y cambios relevantes sin contraseñas, secretos ni documentos completos.                                                                           |
| AUD-02 — Administración | Solo SUPER_ADMIN consulta/exporta globalmente y elimina eventos por la RPC acotada, con fecha pasada, motivo y `BORRAR LOG`. Conservar constancias del borrado; los filtros de consulta no limitan el borrado global por fecha. |

Implementación: migraciones de fases 5–6, `src/features/evidence`, `src/features/audit` y rutas autenticadas de exportación/descarga. Pruebas: `tests/evidence.test.ts` y `tests/phase6.test.ts`.

## Presentación, alcance y configuración

- UI-01: acciones generales/cambio de rol en azul; edición/guardado en verde; eliminación en rojo. Usar `Button` con variantes del archivo general. Acciones de grilla con icono, etiqueta accesible y título. Navegación, cancelación y filtros pueden ser neutros.
- UI-02: organizaciones administrativas, cuentas y auditoría muestran como máximo diez filas visibles, con scroll y encabezado fijo. Abrir los detalles del log no debe aumentar la altura ni la cantidad de filas visibles. La página contiene 20 resultados; el viewport y la paginación son valores distintos. Usar las configuraciones compartidas.
- SYS-04: el producto presenta avance de evaluación y métricas de gestión; no afirma certificación o cumplimiento jurídico garantizado. Las referencias normativas requieren revisión profesional, sin inferencias jurídicas automáticas.
- SYS-05: alcance autorizado hasta fase 6; no iniciar fase 7, IA ni integraciones externas sin petición del usuario. El MVP completo todavía incluye fases pendientes.

## Archivo de configuración general

`src/config/general.ts` es la fuente pública de variantes y tamaños de botones, filas visibles, alturas/anchos de las grillas, tamaño de página, máximo de página y longitud de búsqueda. `src/lib/config.ts` conserva la lectura del entorno y utilidades de URL; `.env` sigue destinado a valores de entorno, no a reglas del negocio.

Cambiar colores/tamaños/filas visibles requiere recompilar y redesplegar Next.js. Cambiar `pageSize`, el máximo de página o el límite de búsqueda requiere revisar las RPC SQL que aplican el mismo contrato; no basta con cambiar el frontend. Los límites de archivos y las reglas de acceso pertenecen al dominio y a Supabase, no se desactivan con una preferencia visual. Este archivo general puede importarse en el navegador: no agregar secretos.
