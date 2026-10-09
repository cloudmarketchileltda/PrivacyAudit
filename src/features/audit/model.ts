import { z } from '@/lib/validation';
export const purgeSchema = z
  .object({
    before_time: z.iso.datetime({ offset: true }),
    reason: z.string().trim().min(10).max(1000),
    confirmation: z.literal('BORRAR LOG'),
  })
  .refine((v) => Date.parse(v.before_time) <= Date.now(), {
    path: ['before_time'],
    message: 'Seleccione una fecha pasada.',
  });
export function csvCell(value: unknown) {
  let text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export const auditColumns = [
  'id',
  'created_at',
  'organization_ref',
  'organization_name',
  'actor_id',
  'actor_ref',
  'actor_name',
  'actor_role',
  'action',
  'entity_type',
  'entity_id',
  'metadata',
] as const;
export function csvRow(row: Record<string, unknown>) {
  return auditColumns.map((k) => csvCell(row[k])).join(',') + '\r\n';
}
export function auditFilters(params: Record<string, string | undefined>) {
  return {
    organization: z.uuid().safeParse(params.organization).success
      ? params.organization!
      : undefined,
    actor: z.uuid().safeParse(params.actor).success ? params.actor! : undefined,
    action: /^[A-Z_]{2,80}$/.test(params.action || '') ? params.action : undefined,
    entity: /^[a-z_]{2,60}$/.test(params.entity || '') ? params.entity : undefined,
    from: z.iso.date().safeParse(params.from).success ? params.from : undefined,
    to: z.iso.date().safeParse(params.to).success ? params.to : undefined,
  };
}
// Midnight in Santiago, using the actual offset for the selected date (including winter DST).
export function chileDayStart(day: string) {
  const utc = new Date(day + 'T00:00:00Z');
  let instant = utc.getTime();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago',
    timeZoneName: 'longOffset',
  });
  for (let i = 0; i < 3; i++) {
    const offset = formatter
      .formatToParts(new Date(instant))
      .find((p) => p.type === 'timeZoneName')!.value;
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset);
    const minutes = match
      ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '-' ? -1 : 1)
      : 0;
    instant = utc.getTime() - minutes * 60000;
  }
  return new Date(instant).toISOString();
}
export function followingDay(day: string) {
  const date = new Date(day + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export const auditActionLabels: Record<string, string> = {
  ADMIN_ACCOUNT_CREATED: 'Cuenta creada por administrador',
  ADMIN_ACCOUNT_UPDATED: 'Cuenta modificada por administrador',
  ADMIN_ACCOUNT_DELETED: 'Cuenta eliminada por administrador',
  ACCOUNT_CONTACT_UPDATED: 'Datos de contacto actualizados',
  ADMIN_ORGANIZATION_DELETED: 'Organización y datos eliminados por administrador',
  REPORT_GENERATED: 'Informe publicado',
  REPORT_DOWNLOAD: 'Descarga de informe preparada',
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  UPLOAD: 'Carga de evidencia',
  REVIEW: 'Revisión de evidencia',
  COMMENT: 'Comentario',
  DOWNLOAD: 'Descarga de evidencia',
  AUDIT_EXPORT: 'Exportación del log',
  AUDIT_PURGE: 'Borrado del log',
  AUTH_ACCOUNT_CREATED: 'Cuenta creada',
  AUTH_SIGN_IN: 'Inicio de sesión confirmado',
  AUTH_PASSWORD_CHANGED: 'Credencial actualizada (histórico)',
  AUTH_CREDENTIAL_UPDATED: 'Credencial actualizada',
  AUTH_SESSION_ENDED: 'Sesión terminada',
  AUTH_LOGIN: 'Acceso (registro de Auth)',
  AUTH_LOGOUT: 'Cierre de sesión (Auth)',
  AUTH_USER_RECOVERY_REQUESTED: 'Recuperación solicitada',
  AUTH_USER_UPDATED_PASSWORD: 'Contraseña actualizada (Auth)',
  AUTH_USER_MODIFIED: 'Cuenta modificada (Auth)',
  AUTH_USER_SIGNEDUP: 'Registro de cuenta (Auth)',
  AUTH_USER_CONFIRMATION_REQUESTED: 'Confirmación solicitada',
  AUTH_TOKEN_REVOKED: 'Token revocado',
};
export const auditEntityLabels: Record<string, string> = {
  reports: 'Informes',
  authentication: 'Autenticación',
  administration: 'Administración',
  profiles: 'Usuarios y roles',
  account_details: 'Datos de contacto de cuentas',
  organizations: 'Organizaciones',
  organization_members: 'Membresías y permisos',
  organization_invitations: 'Invitaciones',
  controls: 'Catálogo de controles',
  assessments: 'Evaluaciones',
  assessment_controls: 'Respuestas de controles',
  processing_activities: 'Tratamientos',
  findings: 'Hallazgos',
  tasks: 'Tareas',
  evidence: 'Evidencias',
  evidence_reservations: 'Reservas de carga',
  comments: 'Comentarios',
  notifications: 'Notificaciones internas',
  audit_logs: 'Registro de auditoría',
};

export const auditRoleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Administrador',
  CONSULTANT: 'Consultor',
  CLIENT: 'Cliente',
  SYSTEM: 'Sistema',
};
