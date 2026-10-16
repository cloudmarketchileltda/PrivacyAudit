import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireUser } from '@/features/auth/queries';
import { generalConfig } from '@/config/general';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  await requireUser();
  try {
    const pdf = await readFile(
      path.join(process.cwd(), 'src/features/legal-library/documents/ley-21719.pdf'),
    );
    const disposition =
      new URL(request.url).searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="${generalConfig.legalLibrary.document.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Length': String(pdf.byteLength),
      },
    });
  } catch {
    return new Response('PDF no disponible. Consulte la fuente oficial o reintente más tarde.', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  }
}
