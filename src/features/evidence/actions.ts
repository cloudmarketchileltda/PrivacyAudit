'use server';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { z } from '@/lib/validation';
import { uploadSchema, reviewSchema, commentSchema } from './schemas';
function refresh() {
  for (const path of ['/evidence', '/findings', '/tasks', '/assessments', '/organizations'])
    revalidatePath(path, 'layout');
}
export async function reserveEvidence(input: unknown) {
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' ') };
  const { db } = await requireUser();
  const id = randomUUID();
  const v = parsed.data;
  const { data, error } = await db
    .from('evidence')
    .insert({
      ...v,
      id,
      file_path: `${v.organization_id}/${id}/file`,
      control_id: v.control_id || null,
      finding_id: v.finding_id || null,
      task_id: v.task_id || null,
      previous_evidence_id: v.previous_evidence_id || null,
    })
    .select('id,file_path')
    .single();
  if (error || !data)
    return {
      error:
        'No se pudo iniciar la entrega. Verifique sus permisos, las relaciones y que no exista ya una nueva versión.',
    };
  refresh();
  return { id: data.id, path: data.file_path };
}
export async function finalizeEvidence(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.uuid().safeParse(form.get('id'));
  if (!parsed.success) return { error: 'Evidencia inválida.' };
  const { db } = await requireUser();
  const { error } = await db.rpc('finalize_evidence', { item: parsed.data });
  if (error)
    return {
      error:
        'No se pudo confirmar la entrega. Verifique que el archivo haya terminado de subir y que la tarea o el hallazgo sigan abiertos.',
    };
  refresh();
  return { success: 'Entrega confirmada. Pendiente de revisión por el consultor.' };
}
export async function cancelEvidence(_: ActionState, form: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(form.get('id'));
  if (!id.success) return { error: 'Evidencia inválida.' };
  const { db, user } = await requireUser();
  const { data: e, error: readError } = await db
    .from('evidence')
    .select('file_path,uploaded_at,uploaded_by')
    .eq('id', id.data)
    .maybeSingle();
  if (readError || !e || e.uploaded_at || e.uploaded_by !== user.id)
    return { error: 'Solo puede descartar una carga propia incompleta.' };
  const { error: removeError } = await db.storage.from('evidence').remove([e.file_path]);
  if (removeError) return { error: 'No se pudo descartar el archivo. Puede volver a intentarlo.' };
  const { data, error } = await db
    .from('evidence')
    .delete()
    .eq('id', id.data)
    .is('uploaded_at', null)
    .select('id');
  if (error || !data?.length)
    return { error: 'No se pudo descartar la entrega. Revise su estado antes de reintentar.' };
  refresh();
  return { success: 'Carga incompleta descartada. Puede iniciar una nueva entrega.' };
}
export async function reviewEvidence(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' ') };
  const { db } = await requireUser();
  const { id, ...values } = parsed.data;
  const { data, error } = await db
    .from('evidence')
    .update(values)
    .eq('id', id)
    .eq('review_status', 'PENDING_REVIEW')
    .not('uploaded_at', 'is', null)
    .select('id');
  if (error || !data?.length)
    return {
      error:
        'No se pudo revisar. Se requiere un consultor autorizado, una entrega pendiente y relaciones abiertas.',
    };
  refresh();
  return { success: 'Revisión registrada.' };
}
export async function addComment(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = commentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: 'Escriba un comentario válido, de hasta 10.000 caracteres.' };
  const { db } = await requireUser();
  const { organization_id, kind, item, body } = parsed.data;
  const { error } = await db.from('comments').insert({
    organization_id,
    body,
    finding_id: kind === 'finding' ? item : null,
    task_id: kind === 'task' ? item : null,
    evidence_id: kind === 'evidence' ? item : null,
  });
  if (error)
    return {
      error: 'No se pudo agregar el comentario. Revise permisos y estado de la organización.',
    };
  refresh();
  return { success: 'Comentario agregado al historial.' };
}
