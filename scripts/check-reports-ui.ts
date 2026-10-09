import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startFixture } from './ui-fixture';
const fixture = await startFixture();
const base = 'http://127.0.0.1:3019';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3019'],
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
server.stdout.on('data', (c) => (logs += c));
server.stderr.on('data', (c) => (logs += c));
await mkdir('artifacts/reports', { recursive: true });
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) break;
    } catch {
      /* Server is starting. */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  async function login(email: string) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  await login('a@example.test');
  await page.goto(`${base}/assessments/${fixture.assessment}`);
  await page.getByRole('link', { name: 'Publicar informe PDF', exact: true }).click();
  await page.getByLabel('Título del informe', { exact: true }).fill('Informe de prueba fase 7');
  await page
    .getByLabel('Resumen ejecutivo', { exact: true })
    .fill('Se revisaron los controles registrados y se identifican acciones pendientes.');
  await page
    .getByLabel('Alcance', { exact: true })
    .fill('Diagnóstico documental de la evaluación seleccionada y tratamientos registrados.');
  await page
    .getByLabel('Conclusiones', { exact: true })
    .fill('Priorizar las acciones correctivas y mantener el seguimiento profesional.');
  await page.getByRole('button', { name: 'Publicar informe', exact: true }).click();
  await page.waitForURL(/\/reports\/[0-9a-f-]+$/);
  const id = page.url().split('/').pop()!;
  await page.getByRole('heading', { name: 'Informe de prueba fase 7', exact: true }).waitFor();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar PDF', exact: true }).click();
  const download = await downloadPromise;
  await download.saveAs('artifacts/reports/phase7-browser.pdf');
  const response = await page.request.get(`${base}/api/reports/${id}/download`);
  assert.equal(response.status(), 200);
  assert.equal(response.headers()['content-type'], 'application/pdf');
  assert.match(response.headers()['cache-control'], /no-store/);
  assert.equal((await response.body()).subarray(0, 5).toString(), '%PDF-');
  await page.screenshot({ path: 'artifacts/reports/report-desktop.png', fullPage: true });
  await page.goto(`${base}/reports`);
  await page.getByRole('link', { name: 'Informe de prueba fase 7', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/reports/${id}`);
  await page.getByRole('heading', { name: 'Informe de prueba fase 7', exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: 'artifacts/reports/report-mobile.png', fullPage: true });
  // Session transitions use the real app logout UI against the isolated test Auth adapter.
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login('client@example.test');
  await page.goto(`${base}/reports/${id}`);
  await page.getByRole('heading', { name: 'Informe de prueba fase 7', exact: true }).waitFor();
  assert.equal((await page.request.get(`${base}/api/reports/${id}/download`)).status(), 200);
  await page.goto(`${base}/reports/new?assessment=${fixture.assessment}`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await login('b@example.test');
  assert.equal((await page.request.get(`${base}/api/reports/${id}/download`)).status(), 404);
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/reports/ui-results.json',
    JSON.stringify(
      {
        backend: 'Isolated PGlite/Auth adapter; not remote Supabase',
        checks: [
          'manager publication',
          'PDF download and no-store',
          'client read/download',
          'client cannot publish',
          'other organization 404',
          'mobile width',
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Phase 7 browser checks passed.');
} catch (error) {
  await writeFile('artifacts/reports/ui-server.log', logs);
  if (browser) {
    const p = browser.contexts().flatMap((c) => c.pages())[0];
    if (p) {
      await p.screenshot({ path: 'artifacts/reports/ui-failure.png', fullPage: true });
      await writeFile('artifacts/reports/ui-failure.txt', await p.locator('body').innerText());
    }
  }
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
