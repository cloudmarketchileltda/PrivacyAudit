'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
import { z } from '@/lib/validation';
import type { ActionState } from '@/components/forms';
import type { Database } from '@/types/database';
import { workflowSchema } from './schemas';
function refresh(org: string) {
  for (const path of ['/findings', '/tasks', '/action-plan', '/assessments'])
    revalidatePath(path, 'layout');
  revalidatePath(`/organizations/${org}`, 'layout');
}
export async function saveWorkflow(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = workflowSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' ') };
  const v = parsed.data;
  const { db } = await requireUser();
  const [{ data: manager, error: permissionError }, { data: org, error: orgError }] =
    await Promise.all([
      db.rpc('can_manage_organization', { org: v.organization_id }),
      db.from('organizations').select('status').eq('id', v.organization_id).maybeSingle(),
    ]);
  if (permissionError || orgError || !manager || org?.status !== 'ACTIVE')
    return { error: 'No tiene permisos de edición o la organización está archivada.' };
  const common = {
    title: v.title,
    description: v.description,
    assigned_to: v.assigned_to || null,
    due_date: v.due_date || null,
  };
  let saved: string | undefined;
  if (v.kind === 'finding') {
    const values = {
      ...common,
      recommendation: v.recommendation,
      area: v.area,
      severity: v.priority,
      status: v.status as Database['public']['Enums']['finding_status'],
      closure_note: v.closure_note,
    };
    const q = v.id
      ? db.from('findings').update(values).eq('id', v.id).eq('organization_id', v.organization_id)
      : db.from('findings').insert({
          ...values,
          organization_id: v.organization_id,
          assessment_id: v.assessment_id,
          control_id: v.control_id || null,
        });
    const { data, error } = await q.select('id').maybeSingle();
    if (error || !data)
      return {
        error:
          'No se pudo guardar el hallazgo. Verifique responsables, relaciones y aprobación de todas las tareas y aceptación de las últimas evidencias antes de cerrar.',
      };
    saved = data.id;
  } else {
    const values = {
      ...common,
      priority: v.priority,
      status: v.status as Database['public']['Enums']['task_status'],
      reviewer_comment: v.reviewer_comment,
    };
    const q = v.id
      ? db.from('tasks').update(values).eq('id', v.id).eq('organization_id', v.organization_id)
      : db
          .from('tasks')
          .insert({ ...values, organization_id: v.organization_id, finding_id: v.finding_id });
    const { data, error } = await q.select('id').maybeSingle();
    if (error || !data)
      return {
        error:
          'No se pudo guardar la tarea. El hallazgo debe estar abierto; aprobar exige revisión previa y evidencias aceptadas; devolver exige observaciones.',
      };
    saved = data.id;
  }
  refresh(v.organization_id);
  redirect(`/${v.kind === 'finding' ? 'findings' : 'tasks'}/${saved}`);
}
export async function submitTask(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({ task: z.uuid(), new_status: z.enum(['IN_PROGRESS', 'WAITING_REVIEW']) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Tarea o estado inválidos.' };
  const { db } = await requireUser();
  const { data: task, error: readError } = await db
    .from('tasks')
    .select('organization_id,finding_id')
    .eq('id', parsed.data.task)
    .maybeSingle();
  if (readError || !task) return { error: 'Tarea no disponible.' };
  const { error } = await db.rpc('submit_task', parsed.data);
  if (error)
    return {
      error:
        'Solo puede iniciar o enviar a revisión una tarea asignada a usted en una organización y un hallazgo abiertos.',
    };
  refresh(task.organization_id);
  return {
    success:
      parsed.data.new_status === 'WAITING_REVIEW' ? 'Tarea enviada a revisión.' : 'Tarea iniciada.',
  };
}
