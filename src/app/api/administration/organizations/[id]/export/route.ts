import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { requireUser } from '@/features/auth/queries';
import { buildOrganizationPackage } from '@/features/organizations/export-package';
import { renderReportPdf } from '@/features/reports/pdf';
import { z } from '@/lib/validation';
export const runtime = 'nodejs';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return new Response('No autorizado.', { status: 403 });
  if (!z.uuid().safeParse(id).success)
    return new Response('Organización inválida.', { status: 404 });
  const { data, error } = await db.rpc('organization_export_snapshot', { org: id });
  if (error)
    return new Response(
      'Archive la organización antes de exportar. No debe tener eliminaciones pendientes.',
      { status: 409 },
    );
  let bundle: Awaited<ReturnType<typeof buildOrganizationPackage>> | undefined;
  try {
    bundle = await buildOrganizationPackage(
      data,
      async (path) => {
        const { data: blob, error } = await db.storage.from('evidence').download(path);
        if (error || !blob) throw new Error('Archivo no disponible');
        return new Uint8Array(await blob.arrayBuffer());
      },
      renderReportPdf,
    );
    const { error: auditError } = await db.rpc('record_organization_export', {
      org: id,
      manifest_sha256: bundle.manifestSha256,
    });
    if (auditError) throw new Error('No se pudo registrar la preparación');
    const stream = createReadStream(bundle.path);
    const cleanup = bundle.cleanup;
    stream.once('close', () => {
      void cleanup();
    });
    return new Response(Readable.toWeb(stream) as ReadableStream<Uint8Array>, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(bundle.size),
        'Content-Disposition': `attachment; filename="privacyaudit-${id}.zip"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    await bundle?.cleanup();
    return new Response(
      'No se pudo completar la exportación. Puede faltar un archivo o exceder los límites de exportación. No elimine la organización sin verificar la copia que necesita conservar.',
      { status: 503 },
    );
  }
}
