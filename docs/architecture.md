# Arquitectura y alcance

## Plan técnico

1. Fase 1: Next.js App Router, Supabase Auth SSR, perfiles, organizaciones, membresías, invitaciones mediante enlaces, RPC transaccionales y RLS.
2. Verificar permisos, aislamiento y build de fase 1 antes de continuar.
3. Fase 2: catálogo global, evaluaciones y snapshots de controles activos, respuestas y dashboard con avance objetivo.
4. Verificar transacciones, estados, aislamiento y build final. Detenerse antes de fase 3.

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

No se implementan tratamientos, hallazgos, tareas, archivos, informes, IA, notificaciones ni audit_logs en esta entrega. Los comentarios de consultor pertenecen únicamente a la respuesta de control. El cliente puede agregar su comentario al control mediante una RPC limitada a ese campo; no puede editar estados ni comentarios del consultor. No se desarrolla la entidad de comentarios de fase 5.
