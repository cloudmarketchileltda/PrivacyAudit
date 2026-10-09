import 'server-only';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
export async function organizationScope(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const session = await requireUser();
  const [{ data: organization, error }, { data: manager, error: permissionError }] =
    await Promise.all([
      session.db.from('organizations').select('id,legal_name,status').eq('id', id).maybeSingle(),
      session.db.rpc('can_manage_organization', { org: id }),
    ]);
  if (error || permissionError) throw new Error('No se pudo verificar la organización.');
  if (!organization) notFound();
  return {
    ...session,
    organization,
    manager: Boolean(manager),
    canEdit: Boolean(manager) && organization.status === 'ACTIVE',
  };
}
export async function findingScope(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const session = await requireUser();
  const { data: finding, error } = await session.db
    .from('findings')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('No se pudo cargar el hallazgo.');
  if (!finding) notFound();
  return { ...(await organizationScope(finding.organization_id)), finding };
}
export async function taskScope(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const session = await requireUser();
  const { data: task, error } = await session.db
    .from('tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('No se pudo cargar la tarea.');
  if (!task) notFound();
  const scope = await findingScope(task.finding_id);
  return {
    ...scope,
    task,
    canEdit: scope.canEdit && !['CLOSED', 'ACCEPTED_RISK'].includes(scope.finding.status),
  };
}
export async function assignees(org?: string, clientsOnly = false) {
  const { db } = await requireUser();
  let query = db.from('organization_members').select('user_id');
  if (org) query = query.eq('organization_id', org);
  if (clientsOnly) query = query.eq('role', 'CLIENT');
  const { data: members, error } = await query;
  if (error) throw new Error('No se pudieron cargar los responsables.');
  if (!members.length) return [];
  let profiles = db
    .from('profiles')
    .select('id,full_name')
    .in(
      'id',
      members.map((m) => m.user_id),
    )
    .order('full_name');
  if (clientsOnly) profiles = profiles.eq('role', 'CLIENT');
  const { data, error: profileError } = await profiles;
  if (profileError) throw new Error('No se pudieron cargar los responsables.');
  return data;
}
