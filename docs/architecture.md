# Arquitectura y alcance

## Plan técnico

1. Fase 1: Next.js App Router, Supabase Auth SSR, perfiles, organizaciones, membresías, invitaciones mediante enlaces, RPC transaccionales y RLS.
2. Verificar permisos, aislamiento y build de fase 1 antes de continuar.
3. Fase 2: catálogo global, evaluaciones y snapshots de controles activos, respuestas y dashboard con avance objetivo.
4. Verificar transacciones, estados, aislamiento y build de fases 1 y 2.
5. Fase 3 autorizada el 5 de octubre de 2026: registro de actividades de tratamiento por organización, consulta de clientes y CRUD de consultores autorizados; verificar RLS, formularios y build. Fase 3 implementada, publicada y redesplegada; recorrido con JWT reales pendiente.

6. Fase 4 autorizada el 6 de octubre de 2026: hallazgos asociados a evaluación y control histórico, tareas asignadas, revisión por consultor, plan de acción y trazabilidad. Verificar RLS, formularios y build. Detenerse antes de fase 5.

## Decisiones

- Supabase externo. No hay backend Express, secretos privilegiados en la aplicación ni fallback con datos simulados.
- Cada petición verifica usuario con getUser; proxy renueva cookies con getClaims. RLS aplica incluso mediante llamadas directas a API.
- Rol global en profiles, inmutable por los clientes. Las membresías determinan acceso por organización y rol efectivo; un consultor necesita membresía CONSULTANT para editar esa empresa.
- Registro público de consultores permitido solo para cuentas nuevas sin membresías ni invitaciones de cliente; usuarios invitados mantienen CLIENT. SUPER_ADMIN se provisiona mediante SQL administrativo, nunca metadata del usuario.
- Invitaciones con token aleatorio de 64 caracteres hexadecimales, hash SHA256 y expiración de siete días. Solo se aceptan con email confirmado coincidente. Se comparte un enlace explícito; no se envía correo de invitación automáticamente.
- Funciones SECURITY DEFINER solamente en esquema private, con search_path fijo, comprobaciones de identidad y autorización. Wrappers públicos SECURITY INVOKER exponen únicamente operaciones concretas.
- Crear organización y membresía, crear evaluación y respuestas, aceptar invitación: operaciones atómicas en base de datos.
- Cada assessment_control conserva una copia de contenido del catálogo. Desactivar o editar un control global no cambia una evaluación existente. IDs y organización de evaluaciones y respuestas no pueden reasignarse.
- NOT_APPLICABLE exige motivo. COMPLETED exige cero controles pendientes y al menos un control. Se puede reabrir a IN_PROGRESS por consultor para corregir; al reabrir se elimina completed_at.
- RLS y pruebas de fases 1–2 se hacen ahora, aunque el maestro también las agrupa en fase 8. Son parte esencial de fase 1.
- Archivar organizaciones conserva historial. Borrado permanente permitido solo sin evaluaciones; FK RESTRICT protege historial existente.
- Controles son ejemplos operativos pendientes de revisión jurídica; sin inferencias jurídicas automáticas ni score legal.

## Límite

Esta entrega termina en fase 4: incorpora tratamientos, hallazgos, tareas, plan de acción y trazabilidad de estos nuevos flujos. No se implementan evidencias, Storage, informes, IA ni notificaciones. Los comentarios de consultor pertenecen únicamente a la respuesta de control. El cliente puede agregar su comentario al control mediante una RPC limitada a ese campo; no puede editar estados ni comentarios del consultor. No se desarrolla la entidad de comentarios de fase 5.

Los tratamientos usan FK a organización y autor; la organización no puede borrarse mientras conserve tratamientos. Nombre, finalidad y al menos una categoría de titulares y datos son obligatorios. Base de licitud propuesta seleccionable con explicación editable, sin validación jurídica automática. Responsable interno, sistemas, destinatarios y proveedores son texto en esta fase, como permite el maestro; no representan nuevas entidades relacionadas.

Estados de tratamiento: DRAFT, ACTIVE y ARCHIVED. El consultor puede archivar y reactivar un tratamiento. Los tratamientos de organizaciones archivadas son de solo lectura para todos. Los clientes solo consultan registros de sus organizaciones; consultores con membresía de gestión y SUPER_ADMIN pueden crear, editar y eliminar en organizaciones activas. La app pide confirmación escrita para eliminación permanente y ofrece archivo para conservar el registro. La identidad, organización, autor y fecha de creación se protegen también en SQL; autor y timestamps de creación se obtienen en base de datos. Supabase RLS protege SELECT, INSERT, UPDATE y DELETE incluso mediante API directa.

## Acuerdos para la continuación

El 5 de octubre de 2026 el usuario acordó continuar el MVP incrementalmente según las fases 3–8 del documento maestro y posteriormente autorizó iniciar fase 3. El 6 de octubre de 2026 el usuario autorizó continuar con fase 4 pese al pendiente de validación con sesiones reales, que se conserva explícitamente. Las fases 5–8 siguen pendientes.

- Orden previsto: tratamientos; hallazgos, tareas y plan de acción; evidencias y revisión; dashboard y notificaciones internas; informe PDF; cierre con auditoría, seguridad, demo y revisión UX.
- La IA queda aplazada hasta después de completar y validar el MVP. No implementar ahora asistentes de redacción, recomendaciones generadas ni integraciones con modelos.
- Las notificaciones operativas externas quedan fuera por ahora: WhatsApp, email de tareas o evidencias, SMS y otros canales externos. Las notificaciones dentro de la aplicación siguen previstas para fase 6. Se conservan los correos de autenticación para confirmación y recuperación de contraseña.
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
- `audit_logs` se introduce para la trazabilidad autorizada de hallazgos y tareas: eventos generados por triggers, actor real y cambios de estado, prioridad, responsable, observaciones y justificación. Los usuarios no escriben ni alteran el log. Solo gestores autorizados lo consultan. El resto de eventos de auditoría del maestro y su revisión final siguen en fase 8. Comentarios independientes y evidencias siguen en fase 5.
