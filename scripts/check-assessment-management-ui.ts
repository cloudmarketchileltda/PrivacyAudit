import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { identity, ids } from '../tests/db-helper';
import { mkdir } from 'node:fs/promises';
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

  await login('client@example.test');
  await page.goto(`${base}/assessments`);
  await page.getByRole('heading', { name: 'Evaluaciones', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: /^Eliminar evaluación:/ }).count(), 0);
  assert.equal(await page.getByRole('link', { name: /^Modificar evaluación:/ }).count(), 0);
  await page.goto(`${base}/assessments/${fixture.assessment}`);
  await page.getByRole('heading', { name: 'Diagnóstico inicial', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: /^Eliminar evaluación:/ }).count(), 0);
  assert.equal(
    await page
      .getByText('Editar nombre, alcance y estado de la evaluación', { exact: true })
      .count(),
    0,
  );
  await login('b@example.test');
  await page.goto(`${base}/assessments/${fixture.assessment}`);
  await page.getByRole('heading', { name: 'Registro no disponible', exact: true }).waitFor();
  await login('a@example.test');
  await page.goto(`${base}/assessments`);
  await page
    .getByRole('link', { name: 'Modificar evaluación: Diagnóstico inicial', exact: true })
    .click();
  await page.getByLabel('Nombre', { exact: true }).fill('Evaluación modificada UI');
  await page.locator('textarea[name=description]').fill('Alcance editado desde el listado');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Evaluación actualizada.' }).waitFor();
  await page.getByRole('heading', { name: 'Evaluación modificada UI', exact: true }).waitFor();
  await page.goto(`${base}/assessments`);
  const row = page.getByRole('row').filter({ hasText: 'Evaluación modificada UI' });
  await row
    .getByRole('button', { name: 'Eliminar evaluación: Evaluación modificada UI', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar evaluación', exact: true });
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await row.count(), 1);
  await mkdir('artifacts/assessment-management-ui', { recursive: true });
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await row
      .getByRole('button', { name: 'Eliminar evaluación: Evaluación modificada UI', exact: true })
      .click();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `artifacts/assessment-management-ui/confirm-${width}.png` });
    await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  }
  // A previously prepared deletion remains visible and can be resumed from the detail screen.
  await identity(fixture.db, ids.a);
  await fixture.db.query("select prepare_assessment_deletion($1,'ELIMINAR EVALUACION')", [
    fixture.assessment,
  ]);
  await page.goto(`${base}/assessments/${fixture.assessment}`);
  await page.getByRole('status').filter({ hasText: 'Evaluación en eliminación.' }).waitFor();
  assert.equal(await page.getByLabel('Nombre', { exact: true }).count(), 0);
  await page
    .getByRole('button', { name: 'Eliminar evaluación: Evaluación modificada UI', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/assessments');
  await page.getByRole('heading', { name: 'Evaluaciones', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('link', { name: 'Evaluación modificada UI', exact: true }).count(),
    0,
  );
  await login('admin@example.test');
  await identity(fixture.db, ids.admin);
  const assessment = (
    await fixture.db.query<{ id: string }>(
      "select create_assessment($1,'Evaluación admin UI') id",
      [fixture.orgA],
    )
  ).rows[0].id;
  await page.goto(`${base}/assessments`);
  await page
    .getByRole('button', { name: 'Eliminar evaluación: Evaluación admin UI', exact: true })
    .click();
  await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page
    .getByRole('row')
    .filter({ hasText: 'Evaluación admin UI' })
    .waitFor({ state: 'detached' });
  await fixture.db.exec('reset role');
  assert.equal(
    (
      await fixture.db.query('select id from assessments where id=any($1::uuid[])', [
        [fixture.assessment, assessment],
      ])
    ).rows.length,
    0,
  );
  assert.equal((await fixture.db.query('select id from organizations')).rows.length, 2);
  assert.equal((await fixture.db.query('select id from controls')).rows.length, 52);
  assert.deepEqual(errors, []);
  console.log(
    'Evaluaciones UI: permisos, edición desde listado, cancelación, confirmación responsiva, reintento, borrado por consultor/admin y retorno al listado aprobados. Adaptador local.',
  );
} catch (error) {
  console.error(logs.slice(-6000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
