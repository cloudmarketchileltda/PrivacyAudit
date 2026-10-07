'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/queries';
import { z } from '@/lib/validation';
export async function markRead(data: FormData) {
  const id = z.union([z.uuid(), z.literal('')]).parse(data.get('id') || '');
  const { db } = await requireUser();
  const { error } = await db.rpc('read_notifications', id ? { notification: id } : {});
  if (error) throw new Error('No se pudieron marcar las notificaciones.');
  revalidatePath('/', 'layout');
}
