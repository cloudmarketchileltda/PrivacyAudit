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
    ? await db.from('controls').update(parsed.data).eq('id', id)
    : await db.from('controls').insert(parsed.data);
  if (result.error) return { error: 'No se pudo guardar. Revise que el código sea único.' };
  revalidatePath('/controls');
  redirect('/controls');
}
