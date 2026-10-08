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
  return {
    success:
      'Cuenta creada y habilitada. Comparta las credenciales de forma segura; el usuario puede cambiar su contraseña mediante Recuperar acceso. Asigne después su organización.',
  };
}
