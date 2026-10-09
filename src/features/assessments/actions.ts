'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser, requireManager } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { assessmentSchema, responseSchema } from './schemas';
import { assessmentDeletionConfirmation } from '../../../supabase/functions/_shared/assessment-deletion';
export async function createAssessment(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = assessmentSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return { error: 'Seleccione una empresa e indique un nombre (2 a 200 caracteres).' };
  const { db } = await requireManager(parsed.data.organization_id);
  const { data: id, error } = await db.rpc('create_assessment', {
    org: parsed.data.organization_id,
    title: parsed.data.name,
    details: parsed.data.description,
  });
  if (error)
    return {
      error:
        'No se pudo crear. La organización debe estar activa y el catálogo debe contener controles activos.',
    };
  revalidatePath('/dashboard');
  revalidatePath('/assessments');
  redirect(`/assessments/${id}`);
}
export async function saveResponse(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = responseSchema.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('. ') };
  const { db } = await requireUser();
  const { data: response, error: readError } = await db
    .from('assessment_controls')
    .select('organization_id,assessment_id')
    .eq('id', parsed.data.id)
    .single();
  if (readError || !response) return { error: 'Control no disponible.' };
  await requireManager(response.organization_id);
  const { id, ...values } = parsed.data;
  const { error } = await db
    .from('assessment_controls')
    .update(values)
    .eq('id', id)
    .select('id')
    .single();
  if (error)
    return {
      error: 'No se pudo guardar. Si la evaluación está completada, reábrala antes de editar.',
    };
  revalidatePath(`/assessments/${response.assessment_id}`);
  revalidatePath('/dashboard');
  return { success: 'Control actualizado.' };
}
export async function updateAssessment(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      id: z.uuid(),
      status: z.enum(['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']),
      name: z.string().trim().min(2).max(200),
      description: z.string().trim().max(5000),
    })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Revise los datos de la evaluación.' };
  const { db } = await requireUser();
  const { data: assessment } = await db
    .from('assessments')
    .select('organization_id')
    .eq('id', parsed.data.id)
    .single();
  if (!assessment) return { error: 'Evaluación no disponible.' };
  await requireManager(assessment.organization_id);
  const { id, ...values } = parsed.data;
  const { error } = await db.from('assessments').update(values).eq('id', id).select('id').single();
  if (error)
    return {
      error:
        'No se pudo guardar. Revise los controles pendientes, el estado de la organización y si la evaluación está en eliminación.',
    };
  revalidatePath(`/assessments/${id}`);
  revalidatePath('/assessments');
  revalidatePath('/dashboard');
  return { success: 'Evaluación actualizada.' };
}

export async function saveClientComment(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z
    .object({ response_id: z.uuid(), comment_text: z.string().trim().max(10000) })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Comentario inválido.' };
  const { db } = await requireUser();
  const { data: response } = await db
    .from('assessment_controls')
    .select('assessment_id')
    .eq('id', parsed.data.response_id)
    .single();
  if (!response) return { error: 'Control no disponible.' };
  const { error } = await db.rpc('update_client_comment', parsed.data);
  if (error) return { error: 'No tiene permiso para comentar este control.' };
  revalidatePath(`/assessments/${response.assessment_id}`);
  return { success: 'Comentario del cliente guardado.' };
}

export async function deleteAssessment(_: ActionState, data: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(data.get('id'));
  if (!id.success || data.get('confirmation') !== assessmentDeletionConfirmation)
    return { error: 'Confirme la eliminación de una evaluación válida.' };
  const { db } = await requireUser();
  const { data: assessment } = await db
    .from('assessments')
    .select('organization_id')
    .eq('id', id.data)
    .single();
  if (!assessment) return { error: 'Evaluación no disponible.' };
  const { data: manager, error: permissionError } = await db.rpc('can_manage_organization', {
    org: assessment.organization_id,
  });
  if (permissionError || !manager)
    return { error: 'No tiene permisos para eliminar esta evaluación.' };
  const { data: result, error } = await db.functions.invoke('assessment-delete', {
    body: { assessment: id.data, confirmation: assessmentDeletionConfirmation },
  });
  revalidatePath('/', 'layout');
  if (error || result?.success !== true)
    return {
      error:
        'No se completó la eliminación. La evaluación puede estar bloqueada para terminar el borrado. Revise sus permisos y reintente Eliminar.',
    };
  if (data.get('redirect_after_delete') === '1')
    redirect(`/assessments?organization=${assessment.organization_id}`);
  return { success: 'Evaluación y todos sus datos relacionados eliminados.' };
}
