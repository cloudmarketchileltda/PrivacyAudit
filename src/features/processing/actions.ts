'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { processingSchema, processingInput } from './schemas';
async function authorized(org: string) {
  const session = await requireUser();
  const [{ data: manager, error }, { data: organization, error: orgError }] = await Promise.all([
    session.db.rpc('can_manage_organization', { org }),
    session.db.from('organizations').select('status').eq('id', org).maybeSingle(),
  ]);
  return {
    ...session,
    allowed: !error && !orgError && manager && organization?.status === 'ACTIVE',
  };
}
function refresh(org: string) {
  revalidatePath('/processing');
  revalidatePath(`/organizations/${org}`, 'layout');
}
export async function saveProcessing(_: ActionState, data: FormData): Promise<ActionState> {
  const org = z.uuid().safeParse(data.get('organization_id'));
  const id = z
    .uuid()
    .optional()
    .safeParse(data.get('id') || undefined);
  const parsed = processingSchema.safeParse(processingInput(data));
  if (!org.success || !id.success) return { error: 'Tratamiento u organización inválidos.' };
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join(' ') };
  const { db, allowed } = await authorized(org.data);
  if (!allowed) return { error: 'No tiene permisos de edición o la organización está archivada.' };
  const query = id.data
    ? db
        .from('processing_activities')
        .update(parsed.data)
        .eq('organization_id', org.data)
        .eq('id', id.data)
    : db.from('processing_activities').insert({ ...parsed.data, organization_id: org.data });
  const { data: saved, error } = await query.select('id').maybeSingle();
  if (error || !saved)
    return {
      error: 'No se pudo guardar el tratamiento. Revise sus permisos y vuelva a intentarlo.',
    };
  refresh(org.data);
  redirect(`/organizations/${org.data}/processing/${saved.id}`);
}
export async function deleteProcessing(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z
    .object({ organization_id: z.uuid(), id: z.uuid(), confirmation: z.literal('ELIMINAR') })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Escriba ELIMINAR para confirmar.' };
  const { db, allowed } = await authorized(parsed.data.organization_id);
  if (!allowed) return { error: 'No tiene permisos de edición o la organización está archivada.' };
  const { data: removed, error } = await db
    .from('processing_activities')
    .delete()
    .eq('organization_id', parsed.data.organization_id)
    .eq('id', parsed.data.id)
    .select('id')
    .maybeSingle();
  if (error || !removed) return { error: 'No se pudo eliminar el tratamiento.' };
  refresh(parsed.data.organization_id);
  redirect(`/organizations/${parsed.data.organization_id}/processing`);
}
