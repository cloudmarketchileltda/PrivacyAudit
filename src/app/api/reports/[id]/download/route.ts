import { requireUser } from '@/features/auth/queries';
import { renderReportPdf } from '@/features/reports/pdf';
import { z } from '@/lib/validation';
export const runtime = 'nodejs';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success)
    return new Response('Informe no disponible.', { status: 404 });
  const { db } = await requireUser();
  const { data: report, error } = await db
    .from('reports')
    .select('id,title,snapshot')
    .eq('id', id)
    .maybeSingle();
  if (error || !report) return new Response('Informe no disponible.', { status: 404 });
  try {
    const pdf = await renderReportPdf(report);
    const { error: auditError } = await db.rpc('record_report_download', { report: id });
    if (auditError) return new Response('No se pudo registrar la descarga.', { status: 503 });
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="PrivacyAudit-${id}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('No se pudo preparar el PDF. Reintente o contacte al administrador.', {
      status: 503,
    });
  }
}
