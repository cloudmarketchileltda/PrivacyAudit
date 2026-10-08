'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { controlSchema } from './schemas';
export async function saveControl(_: ActionState, data: FormData): Promise<ActionState> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede editar el catálogo.' };
  const parsed = controlSchema.safeParse({
    ...Object.fromEntries(data),
    active: data.get('active') === 'on',
    requires_evidence: data.get('requires_evidence') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('. ') };
  const id = data.get('id')?.toString();
  if (id && !z.uuid().safeParse(id).success) return { error: 'Control inválido.' };
  const result = id
    ? await db.from('controls').update(parsed.data).eq('id', id).select('id').single()
    : await db.from('controls').insert(parsed.data).select('id').single();
  if (result.error) return { error: 'No se pudo guardar. Revise que el código sea único.' };
  revalidatePath('/administration/controls');
  redirect('/administration/controls');
}

export async function deleteControl(_: ActionState, data: FormData): Promise<ActionState> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'Acción exclusiva del administrador.' };
  const id = z.uuid().safeParse(data.get('id'));
  if (!id.success || data.get('confirmation') !== 'ELIMINAR CONTROL')
    return { error: 'Control o confirmación inválida.' };
  // The FK checks usage across all organizations and serializes with concurrent application.
  const { error } = await db.from('controls').delete().eq('id', id.data).select('id').single();
  if (error)
    return {
      error: ['23503', '23001'].includes(error.code)
        ? 'No se puede eliminar este control: está aplicado en una o más organizaciones. Puede modificarlo o desactivarlo para nuevas evaluaciones.'
        : 'No se pudo eliminar el control. Revise sus permisos y si todavía existe.',
    };
  revalidatePath('/administration/controls');
  revalidatePath('/administration/audit');
  return { success: 'Control eliminado.' };
}
