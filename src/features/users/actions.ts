'use server';
import { revalidatePath } from 'next/cache';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
const schema = z.object({
  full_name: z.string().trim().min(2).max(160),
  email: z.email().max(254),
  password: z.string().min(10).max(128),
  role: z.enum(['CLIENT', 'CONSULTANT']),
});
export async function createAccount(_: ActionState, form: FormData): Promise<ActionState> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede crear cuentas.' };
  const input = schema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { error: 'Revise nombre, correo, rol y contraseña (10 a 128 caracteres).' };
  const { error } = await db.functions.invoke('admin-create-user', { body: input.data });
  if (error)
    return {
      error:
        'No se pudo crear la cuenta. Revise si el correo ya existe, la contraseña y la disponibilidad del servicio.',
    };
  revalidatePath('/users');
  revalidatePath('/administration/memberships');
  return {
    success:
      'Cuenta creada y habilitada. Comparta las credenciales de forma segura; el usuario puede cambiar su contraseña mediante Recuperar acceso. Asigne después su organización.',
  };
}

const mutationSchema = z.discriminatedUnion('operation', [
  z.object({
    operation: z.literal('UPDATE'),
    target: z.uuid(),
    full_name: z.string().trim().min(2).max(160),
    email: z.email().max(254),
  }),
  z.object({
    operation: z.literal('DELETE'),
    target: z.uuid(),
    confirmation: z.literal('ELIMINAR CUENTA'),
  }),
]);
export async function manageAccount(_: ActionState, form: FormData): Promise<ActionState> {
  const { db, user, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'Acción exclusiva del administrador.' };
  const input = mutationSchema.safeParse(Object.fromEntries(form));
  if (!input.success)
    return { error: 'Revise el nombre, correo o la confirmación ELIMINAR CUENTA.' };
  if (input.data.operation === 'DELETE' && input.data.target === user.id)
    return { error: 'No puede eliminar su propia cuenta.' };
  const { error } = await db.functions.invoke('admin-manage-user', { body: input.data });
  if (error)
    return {
      error:
        input.data.operation === 'DELETE'
          ? 'No se pudo eliminar. Las cuentas administrativas y las cuentas con registros históricos asociados están protegidas.'
          : 'No se pudo actualizar. Revise si el correo ya existe y la disponibilidad del servicio.',
    };
  revalidatePath('/users');
  revalidatePath('/administration/memberships');
  revalidatePath('/administration/audit');
  revalidatePath('/', 'layout');
  return {
    success: input.data.operation === 'DELETE' ? 'Cuenta eliminada.' : 'Cuenta actualizada.',
  };
}
