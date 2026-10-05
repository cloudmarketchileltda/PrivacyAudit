'use server';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { createClient } from '@/lib/supabase/server';
import { appUrl, safeNext } from '@/lib/config';
import { requireUser } from './queries';
import type { ActionState } from '@/components/forms';
const credentials = z.object({ email: z.email(), password: z.string().min(10).max(128) });
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
export async function signup(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = credentials
    .extend({ full_name: z.string().trim().min(2).max(160) })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success)
    return { error: 'Revise nombre, email y contraseña (mínimo 10 caracteres).' };
  const db = await createClient();
  const destination = data.get('token')?.toString();
  const next =
    destination && /^[a-f0-9]{64}$/.test(destination)
      ? `/invite?token=${destination}`
      : '/onboarding';
  const { error } = await db.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error)
    return { error: 'No se pudo registrar la cuenta. Revise los datos o inténtelo más tarde.' };
  return { success: 'Revise su correo para confirmar la cuenta. Después podrá iniciar sesión.' };
}
export async function recover(_: ActionState, data: FormData): Promise<ActionState> {
  const email = z.email().safeParse(data.get('email'));
  if (!email.success) return { error: 'Ingrese un email válido.' };
  const db = await createClient();
  await db.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl()}/auth/callback?next=/reset-password`,
  });
  return {
    success: 'Si existe una cuenta con ese email, recibirá instrucciones para recuperar el acceso.',
  };
}
export async function resetPassword(_: ActionState, data: FormData): Promise<ActionState> {
  const password = z.string().min(10).max(128).safeParse(data.get('password'));
  if (!password.success) return { error: 'Use una contraseña de al menos 10 caracteres.' };
  const { db } = await requireUser();
  const { error } = await db.auth.updateUser({ password: password.data });
  if (error) return { error: 'No se pudo cambiar la contraseña. Solicite un nuevo enlace.' };
  return { success: 'Contraseña actualizada. Puede volver al dashboard.' };
}
export async function logout() {
  const db = await createClient();
  await db.auth.signOut();
  redirect('/login');
}
export async function enrollConsultant(): Promise<ActionState> {
  const { db } = await requireUser();
  const { error } = await db.rpc('register_consultant');
  if (error)
    return { error: 'Esta cuenta está vinculada a un cliente o no ha confirmado su email.' };
  redirect('/dashboard');
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
    return { error: 'Invitación vencida, utilizada, revocada o correspondiente a otro email.' };
  redirect(`/organizations/${org}`);
}
