'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from '@/lib/validation';
import { appUrl } from '@/lib/config';
import { requireManager, requireUser } from '@/features/auth/queries';
import { organizationSchema } from './schemas';
import type { ActionState } from '@/components/forms';
export async function saveOrganization(_: ActionState, data: FormData): Promise<ActionState> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'Acción exclusiva del administrador.' };
  const raw = Object.fromEntries(data);
  const booleans = [
    'treats_clients',
    'treats_employees',
    'treats_suppliers',
    'uses_cameras',
    'marketing',
    'external_providers',
    'has_website',
    'web_forms',
  ];
  const parsed = organizationSchema.safeParse({
    ...raw,
    ...Object.fromEntries(booleans.map((k) => [k, data.get(k) === 'on'])),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('. '),
    };
  let id = data.get('id')?.toString();
  if (id) {
    if (!z.uuid().safeParse(id).success) return { error: 'Organización inválida.' };
    const { error } = await db
      .from('organizations')
      .update(parsed.data)
      .eq('id', id)
      .select('id')
      .single();
    if (error)
      return {
        error:
          'No se pudo guardar. Revise el RUT, sus permisos y si la organización está en proceso de eliminación.',
      };
  } else {
    const { data: created, error } = await db.rpc('create_organization', { payload: parsed.data });
    if (error) return { error: 'No se pudo crear. Revise que el RUT sea único.' };
    id = created;
    // The RPC persists all organization fields in the same transaction.
  }
  revalidatePath('/administration/organizations');
  revalidatePath('/dashboard');
  redirect(`/administration/organizations/${id}`);
}
export async function deleteOrganization(_: ActionState, data: FormData): Promise<ActionState> {
  const id = z.uuid().safeParse(data.get('id'));
  if (!id.success) return { error: 'Organización inválida.' };
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'Acción exclusiva del administrador.' };
  if (data.get('confirmation') !== 'ELIMINAR ORGANIZACION')
    return { error: 'Confirme el borrado en el modal.' };
  const { error } = await db.functions.invoke('admin-delete-organization', {
    body: { org: id.data, confirmation: 'ELIMINAR ORGANIZACION' },
  });
  if (error)
    return {
      error:
        'No se completó la eliminación. La organización puede estar bloqueada para completar el borrado. Reintente desde Administración.',
    };
  revalidatePath('/', 'layout');
  return { success: 'Organización y todos sus datos eliminados.' };
}
export async function inviteClient(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z.object({ org: z.uuid(), email: z.email() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Ingrese un email válido.' };
  const { db } = await requireManager(parsed.data.org);
  const { data: token, error } = await db.rpc('invite_client', {
    org: parsed.data.org,
    target_email: parsed.data.email,
  });
  if (error) return { error: 'No se pudo crear la invitación. La organización debe estar activa.' };
  revalidatePath(`/administration/organizations/${parsed.data.org}`);
  return { link: `${appUrl()}/invite?token=${token}`, success: 'Invitación creada.' };
}
export async function removeMember(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z.object({ org: z.uuid(), target: z.uuid() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Datos inválidos.' };
  const { db } = await requireManager(parsed.data.org);
  const { error } = await db.rpc('manage_member', { ...parsed.data, member_role: null });
  if (error) return { error: 'No se puede retirar esta membresía.' };
  revalidatePath(`/administration/organizations/${parsed.data.org}`);
  return { success: 'Membresía retirada.' };
}
export async function revokeInvite(_: ActionState, data: FormData): Promise<ActionState> {
  const { db } = await requireUser();
  const parsed = z.uuid().safeParse(data.get('id'));
  if (!parsed.success) return { error: 'Datos inválidos.' };
  const { error } = await db.rpc('revoke_invitation', { invitation_id: parsed.data });
  if (error) return { error: 'No autorizado.' };
  revalidatePath('/administration/organizations', 'layout');
  return { success: 'Invitación revocada.' };
}
export async function saveProfile(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z.string().trim().min(2).max(160).safeParse(data.get('full_name'));
  if (!parsed.success) return { error: 'Nombre inválido.' };
  const { db, user } = await requireUser();
  const { error } = await db.from('profiles').update({ full_name: parsed.data }).eq('id', user.id);
  if (error) return { error: 'No se pudo actualizar.' };
  revalidatePath('/', 'layout');
  return { success: 'Perfil actualizado.' };
}
export async function setRole(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z
    .object({ target: z.uuid(), new_role: z.enum(['CLIENT', 'CONSULTANT', 'SUPER_ADMIN']) })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Datos inválidos.' };
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'No autorizado.' };
  const { error } = await db.rpc('set_user_role', parsed.data);
  if (error)
    return {
      error:
        'No se pudo cambiar el rol. Retire membresías incompatibles y no modifique su propia cuenta.',
    };
  revalidatePath('/users');
  revalidatePath('/administration/memberships');
  return { success: 'Rol actualizado.' };
}
export async function assignConsultant(_: ActionState, data: FormData): Promise<ActionState> {
  const parsed = z.object({ org: z.uuid(), target: z.uuid() }).safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: 'Datos inválidos.' };
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'No autorizado.' };
  const { error } = await db.rpc('manage_member', { ...parsed.data, member_role: 'CONSULTANT' });
  if (error) return { error: 'El usuario debe tener rol CONSULTANT.' };
  revalidatePath(`/administration/organizations/${parsed.data.org}`);
  return { success: 'Consultor asignado.' };
}
