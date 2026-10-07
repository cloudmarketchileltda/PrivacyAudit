import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { auditFilters, chileDayStart, followingDay } from './model';
export function auditQuery(
  db: SupabaseClient<Database>,
  params: Record<string, string | undefined>,
) {
  const f = auditFilters(params);
  let q = db.from('audit_logs').select('*', { count: 'exact' });
  if (f.organization) q = q.eq('organization_ref', f.organization);
  if (f.actor) q = q.eq('actor_ref', f.actor);
  if (f.action) q = q.eq('action', f.action);
  if (f.entity) q = q.eq('entity_type', f.entity);
  if (f.from) q = q.gte('created_at', chileDayStart(f.from));
  if (f.to) {
    q = q.lt('created_at', chileDayStart(followingDay(f.to)));
  }
  return q;
}
