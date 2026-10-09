'use server';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/config';
import { requireUser } from './queries';
import type { ActionState } from '@/components/forms';
export async function login(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email: z.email(), password: z.string().min(1) })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Ingrese email y contraseña.' };
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword(parsed.data);
  if (error)
    return { error: 'No fue posible iniciar sesión. Revise sus datos o confirme su email.' };
  redirect(safeNext(data.get('next')?.toString()));
}
export async function logout() {
  const db = await createClient();
  await db.auth.signOut();
  redirect('/login');
}
export async function acceptInvite(_: ActionState, data: FormData): Promise<ActionState> {
  const token = z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .safeParse(data.get('token'));
  if (!token.success) return { error: 'Enlace inválido.' };
  const { db } = await requireUser();
  const { data: org, error } = await db.rpc('accept_invitation', { token: token.data });
  if (error)
    return {
      error:
        'No se pudo aceptar la invitación. Revise el correo y la vigencia; la cuenta debe ser cliente y no estar asignada a otra organización.',
    };
  redirect(`/organizations/${org}`);
}
