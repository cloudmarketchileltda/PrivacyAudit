import 'server-only';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import { responseFromRow, type ResponseControl } from './model';
export async function allResponses(db: SupabaseClient<Database>, assessmentId?: string) {
  const rows: ResponseControl[] = [];
  // Supabase limits each response to 1000 rows by default. Page until exhaustion so aggregate counts remain exact.
  for (let from = 0; ; from += 500) {
    let query = db
      .from('assessment_controls')
      .select('*')
      .order('id')
      .range(from, from + 499);
    if (assessmentId) query = query.eq('assessment_id', assessmentId);
    const { data, error } = await query;
    if (error) throw error;
    rows.push(...data.map(responseFromRow));
    if (data.length < 500) break;
  }
  return rows;
}
export async function allAssessments(db: SupabaseClient<Database>) {
  const rows: import('./model').Assessment[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await db
      .from('assessments')
      .select('*')
      .order('id')
      .range(from, from + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) break;
  }
  return rows;
}
