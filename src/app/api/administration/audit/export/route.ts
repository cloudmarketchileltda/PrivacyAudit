import { requireUser } from '@/features/auth/queries';
import { auditQuery } from '@/features/audit/queries';
import { auditColumns, auditFilters, csvRow } from '@/features/audit/model';
export async function GET(request: Request) {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return new Response('No autorizado', { status: 403 });
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const cutoff = new Date().toISOString();
  let last: string | undefined;
  let total = 0;
  const chunks = ['\uFEFF' + auditColumns.join(',') + '\r\n'];
  // UUID keyset pagination avoids PostgREST's 1,000-row cap and offset drift.
  for (;;) {
    let query = auditQuery(db, params).lte('created_at', cutoff).order('id').limit(500);
    if (last) query = query.gt('id', last);
    const { data, error } = await query;
    if (error) return new Response('No se pudo exportar el log', { status: 503 });
    for (const row of data || []) chunks.push(csvRow(row));
    total += data?.length || 0;
    if (!data?.length || data.length < 500) break;
    last = data.at(-1)!.id;
  }
  const { error } = await db.rpc('record_audit_export', {
    filters: JSON.parse(JSON.stringify({ ...auditFilters(params), cutoff })),
    record_count: total,
  });
  if (error) return new Response('No se pudo registrar la exportación', { status: 503 });
  return new Response(chunks.join(''), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="privacyaudit-log-${cutoff.slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
