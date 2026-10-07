import { z } from '@/lib/validation';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const fileTypes = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
} as const;
export function fileMime(name: string) {
  return fileTypes[name.split('.').pop()?.toLowerCase() as keyof typeof fileTypes];
}
const optionalId = z.union([z.uuid(), z.literal('')]).default('');
export const uploadSchema = z
  .object({
    organization_id: z.uuid(),
    control_id: optionalId,
    finding_id: optionalId,
    task_id: optionalId,
    previous_evidence_id: optionalId,
    description: z.string().trim().min(2).max(10000),
    original_filename: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .refine(
        (v) =>
          ![...v].some(
            (c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || c === '/' || c === '\\',
          ),
        'Nombre de archivo inválido',
      ),
    mime_type: z.string(),
    file_size: z.number().int().min(1).max(MAX_FILE_SIZE),
  })
  .refine(
    (v) => fileMime(v.original_filename) === v.mime_type,
    'Use PDF, PNG, JPG, DOCX, XLSX o TXT con su tipo correcto.',
  );
export const uploadFieldsSchema = z.object({ description: z.string().trim().min(2).max(10000) });
export type UploadContext = {
  organization_id: string;
  control_id?: string | null;
  finding_id?: string | null;
  task_id?: string | null;
  previous_evidence_id?: string | null;
};
export const reviewSchema = z
  .object({
    id: z.uuid(),
    review_status: z.enum(['ACCEPTED', 'REJECTED', 'CHANGES_REQUESTED']),
    reviewer_comment: z.string().trim().max(10000),
  })
  .refine((v) => v.review_status === 'ACCEPTED' || v.reviewer_comment.length > 0, {
    message: 'Agregue observaciones para rechazar o solicitar cambios.',
    path: ['reviewer_comment'],
  });
export const commentSchema = z.object({
  organization_id: z.uuid(),
  kind: z.enum(['finding', 'task', 'evidence']),
  item: z.uuid(),
  body: z.string().trim().min(1).max(10000),
});
export const commentFieldsSchema = commentSchema.pick({ body: true });
export const reviewLabels = {
  PENDING_REVIEW: 'Pendiente de revisión',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  CHANGES_REQUESTED: 'Cambios solicitados',
};
