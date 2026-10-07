import 'server-only';
import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { requireUser } from '@/features/auth/queries';
export async function processingOrganization(id: string) {
  if (!z.uuid().safeParse(id).success) notFound();
  const session = await requireUser();
  const { data: organization, error } = await session.db
    .from('organizations')
    .select('id,legal_name,status')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error('No se pudo cargar la organización.');
  if (!organization) notFound();
  const { data: manager, error: permissionError } = await session.db.rpc(
    'can_manage_organization',
    { org: id },
  );
  if (permissionError) throw new Error('No se pudieron verificar los permisos.');
  return {
    ...session,
    organization,
    canEdit: Boolean(manager) && organization.status === 'ACTIVE',
  };
}
export async function processingActivity(orgId: string, activityId: string) {
  if (!z.uuid().safeParse(activityId).success) notFound();
  const session = await processingOrganization(orgId);
  const { data: activity, error } = await session.db
    .from('processing_activities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', activityId)
    .maybeSingle();
  if (error) throw new Error('No se pudo cargar el tratamiento.');
  if (!activity) notFound();
  return { ...session, activity };
}
