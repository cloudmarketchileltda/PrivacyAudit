import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { ZipFile } from 'yazl';
import { z } from '@/lib/validation';
import { generalConfig } from '@/config/general';

const snapshotSchema = z.object({
  version: z.literal(1),
  captured_at: z.string(),
  data: z
    .object({
      organization: z.object({ id: z.uuid(), status: z.literal('ARCHIVED') }).passthrough(),
      files: z.array(z.object({ name: z.string(), metadata: z.unknown() })),
      evidence: z.array(
        z
          .object({
            id: z.uuid(),
            file_path: z.string(),
            file_size: z.number(),
            uploaded_at: z.string().nullable(),
          })
          .passthrough(),
      ),
      reports: z.array(
        z.object({ id: z.uuid(), title: z.string(), snapshot: z.unknown() }).passthrough(),
      ),
    })
    .catchall(z.unknown()),
});
export const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

// Builds a private temporary ZIP before sending any success response. Never returns a partial ZIP.
export async function buildOrganizationPackage(
  input: unknown,
  download: (path: string) => Promise<Uint8Array>,
  renderReport: (report: { id: string; title: string; snapshot: unknown }) => Promise<Uint8Array>,
) {
  const snapshot = snapshotSchema.parse(input);
  const org = snapshot.data.organization.id;
  const paths = new Set(snapshot.data.files.map((file) => file.name));
  for (const evidence of snapshot.data.evidence) {
    if (evidence.uploaded_at && !paths.has(evidence.file_path))
      throw new Error('Falta un archivo confirmado. No se puede generar una exportación completa.');
  }
  const directory = await mkdtemp(join(tmpdir(), 'privacyaudit-export-'));
  const path = join(directory, 'organization.zip');
  const zip = new ZipFile();
  const output = zip.outputStream as Readable;
  zip.on('error', (error) => output.destroy(error));
  // Keep a rejection handler attached while asynchronous downloads run.
  const completed = pipeline(output, createWriteStream(path, { mode: 0o600 }));
  void completed.catch(() => {});
  const entries: { path: string; bytes: number; sha256: string; source?: string }[] = [];
  let bytes = 0;
  function add(name: string, data: Uint8Array, source?: string) {
    bytes += data.byteLength;
    if (bytes > generalConfig.retention.export.maxBytes)
      throw new Error('El paquete excede el límite configurado. Solicite una exportación asistida; no elimine la organización sin conservar sus datos.');
    const buffer = Buffer.from(data);
    entries.push({
      path: name,
      bytes: buffer.length,
      sha256: sha256(buffer),
      ...(source ? { source } : {}),
    });
    zip.addBuffer(buffer, name);
  }
  try {
    const data = Buffer.from(JSON.stringify(snapshot, null, 2));
    if (data.length > generalConfig.retention.export.maxSnapshotBytes)
      throw new Error('El volumen de registros requiere una exportación asistida.');
    add('datos.json', data);
    for (const [index, file] of snapshot.data.files.entries()) {
      if (!file.name.startsWith(`${org}/`)) throw new Error('Archivo fuera de la organización.');
      const content = await download(file.name);
      const evidence = snapshot.data.evidence.find((e) => e.file_path === file.name);
      if (evidence?.uploaded_at && content.byteLength !== evidence.file_size)
        throw new Error('El tamaño del archivo no coincide con la entrega confirmada.');
      // Generated names avoid path traversal and collisions from original filenames.
      add(`archivos/${String(index + 1).padStart(6, '0')}.bin`, content, file.name);
    }
    for (const report of snapshot.data.reports)
      add(`informes/${report.id}.pdf`, await renderReport(report));
    add(
      'LEEME.txt',
      Buffer.from(
        'PrivacyAudit — exportación de organización archivada\n' +
          'datos.json contiene el corte transaccional de registros e historial, incluidos snapshots de informes.\n' +
          'archivos/ incluye todos los objetos del prefijo de la organización, incluso cargas incompletas.\n' +
          'indice.json relaciona archivos, tamaños y SHA-256; source enlaza con file_path y original_filename en datos.json.\n' +
          'Los PDF son representaciones de los snapshots, no necesariamente idénticos a descargas anteriores.\n' +
          'No incluye cuentas Auth, contraseñas, contactos privados de cuenta, tokens ni catálogo global.\n' +
          'Este paquete contiene datos privados. Compruebe su integridad y guárdelo de forma segura.\n' +
          'La preparación o descarga no demuestra que el destinatario haya conservado el paquete.\n' +
          generalConfig.retention.backups +
          '\n',
      ),
    );
    const manifest = Buffer.from(
      JSON.stringify(
        {
          version: 1,
          organization_id: org,
          captured_at: snapshot.captured_at,
          policy_version: generalConfig.retention.policyVersion,
          complete: true,
          entries,
          counts: Object.fromEntries(
            Object.entries(snapshot.data)
              .filter(([, v]) => Array.isArray(v))
              .map(([k, v]) => [k, (v as unknown[]).length]),
          ),
        },
        null,
        2,
      ),
    );
    if (bytes + manifest.length > generalConfig.retention.export.maxBytes)
      throw new Error('El paquete y su índice exceden el límite configurado.');
    zip.addBuffer(manifest, 'indice.json');
    zip.end();
    await completed;
    return {
      path,
      size: (await stat(path)).size,
      manifestSha256: sha256(manifest),
      cleanup: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    output.destroy(error instanceof Error ? error : new Error('Exportación fallida'));
    await completed.catch(() => {});
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}
