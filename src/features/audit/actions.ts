'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/queries';
import { purgeSchema } from './model';
export async function purgeLog(input: unknown): Promise<{ error?: string; success?: string }> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede borrar el log.' };
  const parsed = purgeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { data, error } = await db.rpc('purge_audit_logs', parsed.data);
  if (error) return { error: 'No se pudo borrar el log. Verifique fecha, motivo y confirmación.' };
  revalidatePath('/administration/audit');
  return {
    success: `Se eliminaron ${data} eventos anteriores a la fecha indicada. Se conservó la constancia del borrado.`,
  };
}
