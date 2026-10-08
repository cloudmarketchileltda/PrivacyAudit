import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
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
server.stdout.on('data', (chunk) => (logs += chunk));
server.stderr.on('data', (chunk) => (logs += chunk));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
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
  async function login(email: string) {
    await context.clearCookies();
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }

  await fixture.db.exec('reset role');
  const applied = (
    await fixture.db.query<{ id: string; code: string }>(
      'select c.id,c.code from controls c join assessment_controls r on r.control_id=c.id where r.organization_id=$1 order by c.code limit 1',
      [fixture.orgA],
    )
  ).rows[0];
  for (const role of ['a', 'client']) {
    await login(`${role}@example.test`);
    assert.equal(
      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('link', { name: 'Catálogo de controles', exact: true })
        .count(),
      0,
    );
    for (const path of [
      '/controls',
      '/controls/new',
      `/controls/${applied.id}`,
      '/administration/controls',
      '/administration/controls/new',
      `/administration/controls/${applied.id}`,
    ]) {
      await page.goto(base + path);
      await page.getByRole('heading', { name: 'Registro no disponible', exact: true }).waitFor();
    }
    await page.goto(`${base}/assessments/${fixture.assessment}`);
    await page.getByRole('heading', { name: 'Diagnóstico inicial', exact: true }).waitFor();
  }
  await login('admin@example.test');
  await page.getByRole('link', { name: 'Administración', exact: true }).click();
  await page.getByRole('link', { name: /Catálogo de controles/ }).click();
  await page.getByRole('link', { name: 'Nuevo control', exact: true }).click();
  await page.getByLabel('Código', { exact: true }).fill('UI-CAT');
  await page.getByLabel('Título', { exact: true }).fill('Control de prueba UI');
  await page.getByLabel('Categoría', { exact: true }).fill('Gobierno');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.waitForURL('**/administration/controls');
  await page.goto(`${base}/administration/controls?q=UI-CAT`);
  let row = page.getByRole('row').filter({ hasText: 'UI-CAT' });
  await row.getByRole('link', { name: 'Modificar control: UI-CAT' }).click();
  await page.getByLabel('Título', { exact: true }).fill('Control modificado UI');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.waitForURL('**/administration/controls');
  await page.goto(`${base}/administration/controls?q=UI-CAT`);
  row = page.getByRole('row').filter({ hasText: 'Control modificado UI' });
  await row.getByRole('button', { name: 'Eliminar control: UI-CAT' }).click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar control', exact: true });
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await row.count(), 1);
  await row.getByRole('button', { name: 'Eliminar control: UI-CAT' }).click();
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await row.waitFor({ state: 'detached' });
  await page.goto(`${base}/administration/controls?q=${applied.code}`);
  row = page.getByRole('row').filter({ hasText: applied.code });
  await row.getByRole('button', { name: `Eliminar control: ${applied.code}` }).click();
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await dialog.getByRole('alert').filter({ hasText: 'está aplicado' }).waitFor();
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto(`${base}/administration/organizations`);
  const orgRow = page.getByRole('row').filter({ hasText: 'Empresa Demo SpA' });
  await orgRow.getByRole('button', { name: 'Eliminar organización: Empresa Demo SpA' }).click();
  const orgDialog = page.getByRole('dialog', { name: 'Eliminar organización', exact: true });
  await orgDialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await orgDialog.waitFor({ state: 'hidden' });
  await orgRow.waitFor({ state: 'detached' });
  await page.goto(`${base}/administration/controls?q=${applied.code}`);
  row = page.getByRole('row').filter({ hasText: applied.code });
  await row.getByRole('button', { name: `Eliminar control: ${applied.code}` }).click();
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await row.waitFor({ state: 'detached' });
  await fixture.db.exec('reset role');
  assert.equal(
    (await fixture.db.query('select id from organizations where id=$1', [fixture.orgB])).rows
      .length,
    1,
  );
  assert.equal(
    (
      await fixture.db.query('select id from assessment_controls where organization_id=$1', [
        fixture.orgA,
      ])
    ).rows.length,
    0,
  );
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/administration/controls`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'Catálogo UI: administración exclusiva, alta/edición, cancelación, borrado libre, bloqueo aplicado y prioridad de eliminación de organización verificados. Adaptador local.',
  );
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
