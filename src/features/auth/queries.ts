import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/config';
import type { Profile } from '@/types/domain';
export const requireUser = cache(async () => {
  if (!isConfigured()) redirect('/setup');
  const db = await createClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect('/login');
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id,full_name,role')
    .eq('id', user.id)
    .single();
  if (profileError || !profile)
    throw new Error('No se pudo cargar el perfil. Revise las migraciones.');
  return { db, user, profile: profile as Profile };
});
export async function requireManager(org: string) {
  const session = await requireUser();
  const { data, error } = await session.db.rpc('can_manage_organization', { org });
  if (error || !data) throw new Error('No tiene permisos para modificar esta organización.');
  return session;
}
