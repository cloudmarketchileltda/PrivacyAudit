// Credential provisioning only. Apply the versioned migration before running.
// No secret is printed or put on the CLI command line.
import { readFile, writeFile, mkdtemp, rm, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const expected = 'pbihajfbbcbbdvoqpggy';
const connectionTemplate = process.argv[2];
if (!connectionTemplate)
  throw new Error(
    'Indique la URL de conexión sin contraseña del rol legal_ai_worker, tomada del proyecto PrivacyAudit.',
  );
const url = new URL(connectionTemplate);
if (
  !['postgres:', 'postgresql:'].includes(url.protocol) ||
  !['legal_ai_worker', `legal_ai_worker.${expected}`].includes(decodeURIComponent(url.username)) ||
  url.password ||
  (!url.hostname.endsWith('supabase.com') && url.hostname !== `db.${expected}.supabase.co`)
)
  throw new Error('Se requiere una conexión Supabase del rol restringido sin contraseña.');
const linked = (await readFile('supabase/.temp/project-ref', 'utf8')).trim();
if (linked !== expected)
  throw new Error('El proyecto enlazado no es PrivacyAudit; no se modificó ninguna credencial.');
const secretFile = 'supabase/.env.legal-ai.local';
const current = await readFile(secretFile, 'utf8');
const directory = await mkdtemp(path.join(tmpdir(), 'privacyaudit-ai-'));
await chmod(directory, 0o700);
try {
  const password = randomBytes(32).toString('hex');
  const sqlFile = path.join(directory, 'credential.sql');
  await writeFile(sqlFile, `alter role legal_ai_worker password '${password}';`, { mode: 0o600 });
  const result = spawnSync('supabase', ['db', 'query', '--linked', '--file', sqlFile], {
    stdio: 'pipe',
  });
  if (result.status !== 0)
    throw new Error(
      'No se pudo provisionar la credencial. Revise autenticación CLI y migración; no se muestran errores que podrían contener secretos.',
    );
  url.password = password;
  const next = current.replace(
    /^LEGAL_AI_DATABASE_URL=.*$/m,
    `LEGAL_AI_DATABASE_URL=${url.toString()}`,
  );
  await writeFile(secretFile, next, { mode: 0o600 });
  await chmod(secretFile, 0o600);
  console.log(
    'Credencial restringida guardada en supabase/.env.legal-ai.local. No se activó ni desplegó la IA.',
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
