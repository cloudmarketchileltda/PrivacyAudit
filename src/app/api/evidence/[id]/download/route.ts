import { requireUser } from '@/features/auth/queries';
import { z } from '@/lib/validation';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response('Archivo no disponible.', { status: 404 });
  const { db } = await requireUser();
  const { data: e, error } = await db
    .from('evidence')
    .select('file_path,original_filename,mime_type,uploaded_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !e?.uploaded_at) return new Response('Archivo no disponible.', { status: 404 });
  const { data, error: downloadError } = await db.storage.from('evidence').download(e.file_path);
  if (downloadError || !data) return new Response('Archivo no disponible.', { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      'Content-Type': e.mime_type,
      'Content-Disposition': `attachment; filename="evidence"; filename*=UTF-8''${encodeURIComponent(e.original_filename)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
