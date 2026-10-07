import { requireUser } from '@/features/auth/queries';
export async function GET() {
  const { db } = await requireUser();
  const { count, error } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) return Response.json({ error: 'No disponible' }, { status: 503 });
  return Response.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
