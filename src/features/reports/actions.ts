'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { generalConfig } from '@/config/general';
import { requireUser } from '@/features/auth/queries';
import type { ActionState } from '@/components/forms';
import { reportInputSchema } from './model';
export async function createReport(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = reportInputSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: `Revise el título y complete resumen, alcance y conclusiones (${generalConfig.reports.textMinLength} a ${generalConfig.reports.textMaxLength} caracteres cada uno).`,
    };
  const { db } = await requireUser();
  const { data: id, error } = await db.rpc('create_report', parsed.data);
  if (error || !id)
    return {
      error:
        'No se pudo publicar. Verifique sus permisos, la evaluación y que la organización esté activa. Reintente o contacte al administrador.',
    };
  revalidatePath('/reports');
  redirect(`/reports/${id}`);
}
