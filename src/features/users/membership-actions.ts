'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { membershipSchema } from './membership-schema';
export async function saveMemberships(raw: unknown): Promise<ActionState> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede asignar organizaciones.' };
  const input = membershipSchema.safeParse(raw);
  if (!input.success) return { error: input.error.issues[0]?.message || 'Datos inválidos.' };
  const { error } = await db.rpc('set_user_organizations', input.data);
  if (error) {
    if (error.code === '40001')
      return { error: 'El rol o las membresías cambiaron. Actualice la página antes de guardar.' };
    return { error: 'No se pudo guardar. Revise el rol, la organización y si está activa.' };
  }
  revalidatePath('/administration/memberships');
  revalidatePath('/users');
  revalidatePath('/organizations', 'layout');
  revalidatePath('/dashboard');
  return { success: 'Asignaciones guardadas.' };
}
