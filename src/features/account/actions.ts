'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/features/auth/queries';
import { appUrl } from '@/lib/config';
import { profileSchema, changePasswordSchema, emailSchema } from './schemas';
import type { ActionState } from '@/components/forms';

export async function saveAccountProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const { db } = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Revise el nombre y la longitud de los datos de contacto.' };
  const { full_name, ...contact } = parsed.data;
  const { error } = await db.rpc('save_my_account', { account_name: full_name, contact });
  if (error) return { error: 'No se pudieron guardar los datos de su cuenta.' };
  revalidatePath('/', 'layout');
  return { success: 'Datos de cuenta actualizados.' };
}

export async function changeOwnPassword(_: ActionState, form: FormData): Promise<ActionState> {
  const { db, user } = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error:
        'Use de 10 a 128 caracteres, confirme la nueva contraseña y elija una distinta de la actual.',
    };
  if (!user.email) return { error: 'La cuenta no tiene un correo de acceso.' };
  // Reauthenticate the current account using the public client; never accept a submitted user ID or email.
  const verified = await db.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (verified.error || verified.data.user?.id !== user.id)
    return { error: 'La contraseña actual no es correcta o no pudo verificarse.' };
  const { error } = await db.auth.updateUser({
    password: parsed.data.password,
    current_password: parsed.data.current_password,
  });
  if (error)
    return {
      error:
        'No se pudo cambiar la contraseña. Revise la política de contraseña o contacte al administrador.',
    };
  return {
    success: 'Contraseña actualizada. Use la nueva contraseña en su próximo inicio de sesión.',
  };
}

export async function changeOwnEmail(_: ActionState, form: FormData): Promise<ActionState> {
  const { db, user } = await requireUser();
  const parsed = emailSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'Ingrese un correo válido y su contraseña actual.' };
  if (!user.email) return { error: 'La cuenta no tiene un correo de acceso.' };
  if (parsed.data.email === user.email.toLowerCase())
    return { error: 'Ingrese un correo diferente del actual.' };
  const verified = await db.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });
  if (verified.error || verified.data.user?.id !== user.id)
    return { error: 'La contraseña actual no es correcta o no pudo verificarse.' };
  const { data, error } = await db.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${appUrl()}/auth/callback?next=/account` },
  );
  if (error)
    return { error: 'No se pudo solicitar el cambio. Revise el correo y vuelva a intentarlo.' };
  revalidatePath('/', 'layout');
  return {
    success:
      data.user?.email?.toLowerCase() === parsed.data.email
        ? 'Correo actualizado. Use el nuevo correo en su próximo inicio de sesión.'
        : 'Cambio solicitado. Revise el correo actual y el nuevo y siga los enlaces de confirmación. Hasta completar el proceso, use su correo actual para entrar.',
  };
}
