import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { ids } from '../tests/db-helper';
import { startFixture } from './ui-fixture';
const fixture = await startFixture();
const base = 'http://127.0.0.1:3027';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3027'],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54331',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'fixture-public-key',
      APP_URL: base,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let logs = '';
server.stdout.on('data', (chunk) => (logs += chunk));
server.stderr.on('data', (chunk) => (logs += chunk));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
await mkdir('artifacts/legal-library-ui', { recursive: true });
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) break;
    } catch {
      /* Starting. */
    }
    if (i === 119) throw new Error(logs);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const unauthenticated = await context.request.get(`${base}/api/legal-library/pdf`, {
    maxRedirects: 0,
  });
  assert.equal(unauthenticated.status(), 307);
  assert.equal(new URL(unauthenticated.headers().location, base).pathname, '/login');
  await page.goto(`${base}/legal-library`);
  await page.waitForURL('**/login');
  const original = await readFile('src/features/legal-library/documents/ley-21719.pdf');
  for (const name of ['client', 'a', 'admin', 'other']) {
    await context.clearCookies();
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
    await page.getByRole('link', { name: 'Centro normativo', exact: true }).click();
    await page.getByRole('heading', { name: 'Centro normativo', exact: true }).waitFor();
    assert.equal(await page.locator('details[id^=faq-]').count(), 12);
    assert.ok(
      await page.getByRole('button', { name: 'Consultar con IA', exact: true }).isDisabled(),
    );
    assert.equal(
      await page.getByText('Administrar piloto IA', { exact: true }).count(),
      name === 'admin' ? 1 : 0,
    );
    const pdf = await context.request.get(`${base}/api/legal-library/pdf`);
    assert.equal(pdf.status(), 200);
    assert.equal(pdf.headers()['content-type'], 'application/pdf');
    assert.match(pdf.headers()['cache-control'], /no-store/);
    assert.ok((await pdf.body()).equals(original));
    const download = await context.request.get(`${base}/api/legal-library/pdf?download=1`);
    assert.match(download.headers()['content-disposition'], /^attachment;/);
  }
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/legal-library`);
    await page.locator('main h1').waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `artifacts/legal-library-ui/${width}.png`, fullPage: true });
  }
  await page.getByLabel('Buscar en preguntas y respuestas').fill('supresion');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '2 de 12' }).waitFor();
  await page.getByLabel('Tema', { exact: true }).selectOption('Seguridad y proveedores');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByText('No hay coincidencias.', { exact: false }).waitFor();
  await page.getByRole('link', { name: 'Limpiar', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '12 de 12' }).waitFor();
  await page.getByText('¿Siempre se necesita consentimiento?', { exact: true }).click();
  assert.ok(
    await page.getByText('El consentimiento es una base de licitud', { exact: false }).isVisible(),
  );
  assert.equal(
    await page
      .getByRole('link', { name: 'Ver fundamento en el PDF · página 11', exact: true })
      .getAttribute('href'),
    '/api/legal-library/pdf#page=11',
  );
  // Enable only within the isolated fixture, with synthetic embeddings; never real OpenAI.
  await fixture.db.exec('reset role');
  const vector = [1, ...Array(255).fill(0)];
  await fixture.db.query(
    "update legal_ai.chunks set embedding=$1::double precision[],embedding_model='text-embedding-3-small'",
    [`{${vector.join(',')}}`],
  );
  await fixture.db.exec('update legal_ai.settings set enabled=true,all_users=true');
  await page.goto(`${base}/legal-library`);
  await page
    .getByLabel('Su pregunta sobre la ley de privacidad')
    .fill('¿Qué dice la ley sobre el consentimiento de datos personales?');
  await page.getByRole('button', { name: 'Consultar con IA', exact: true }).click();
  await page
    .getByText('Respuesta simulada para verificar el flujo normativo y sus fuentes.', {
      exact: true,
    })
    .waitFor();
  await page.getByRole('status').filter({ hasText: '1 de 20' }).waitFor();
  assert.equal(await page.locator('#consultar-ia blockquote').count(), 1);
  assert.match(
    (await page.locator('#consultar-ia a').last().getAttribute('href')) ?? '',
    /^\/api\/legal-library\/pdf#page=\d+$/,
  );
  await page.screenshot({ path: 'artifacts/legal-library-ui/ai-answer.png', fullPage: true });
  await fixture.db.exec('reset role');
  await fixture.db.query(
    "insert into legal_ai.calls(actor,kind,reserved_micros,state,charged_micros) select $1,'query',100,'done',100 from generate_series(1,19)",
    [ids.other],
  );
  await page.reload();
  await page.getByRole('status').filter({ hasText: '20 de 20' }).waitFor();
  assert.ok(await page.getByRole('button', { name: 'Consultar con IA', exact: true }).isDisabled());
  assert.deepEqual(errors, []);
  console.log(
    'Centro normativo UI: acceso autenticado, tres roles y cuenta sin organización; PDF íntegro/descarga; búsqueda sin tildes, filtros, vacío, referencias y 360/768/1440 aprobados. Fixture local, sin Supabase remoto.',
  );
} catch (error) {
  await writeFile('artifacts/legal-library-ui/server.log', logs);
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
