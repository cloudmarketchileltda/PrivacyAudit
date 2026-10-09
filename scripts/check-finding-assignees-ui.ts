import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { startFixture } from './ui-fixture';
import { identity, ids } from '../tests/db-helper';

const fixture = await startFixture();
const base = 'http://127.0.0.1:3034';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3034'],
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
      if ((await fetch(base + '/api/health')).ok) break;
    } catch {
      /* starting */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(base + '/login');
  await page.getByLabel('Email', { exact: true }).fill('a@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  const options = async () => {
    const select = page.getByLabel('Responsable', { exact: true });
    await select.waitFor();
    return select
      .locator('option:not([disabled])')
      .evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  };
  await page.goto(`${base}/organizations/${fixture.orgA}/findings/new`);
  assert.deepEqual(await options(), ['', ids.client]);
  await page.getByLabel('Evaluación', { exact: true }).selectOption(fixture.assessment);
  await page.getByLabel('Título del hallazgo', { exact: true }).fill('Hallazgo con cliente');
  await page.getByLabel('Descripción', { exact: true }).fill('Descripción de prueba');
  await page.getByLabel('Responsable', { exact: true }).selectOption(ids.client);
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.waitForURL(/\/findings\/[a-f0-9-]+$/);
  const finding = page.url().split('/').at(-1)!;
  await page.goto(`${base}/findings/${finding}/edit`);
  assert.deepEqual(await options(), ['', ids.client]);
  await identity(fixture.db, ids.admin);
  await fixture.db.query('select public.manage_member($1,$2,null)', [fixture.orgA, ids.client]);
  await page.goto(`${base}/organizations/${fixture.orgA}/findings/new`);
  assert.deepEqual(await options(), ['']);
  await page.goto(`${base}/findings/${finding}/edit`);
  assert.deepEqual(await options(), ['']);
  assert.equal(await page.getByLabel('Responsable', { exact: true }).inputValue(), ids.client);
  await page
    .getByLabel('Título del hallazgo', { exact: true })
    .fill('Hallazgo editado sin reasignar');
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.waitForURL(`**/findings/${finding}`);
  await fixture.db.exec('reset role');
  assert.equal(
    (
      await fixture.db.query<{ assigned_to: string }>(
        'select assigned_to from findings where id=$1',
        [finding],
      )
    ).rows[0].assigned_to,
    ids.client,
  );
  await page.goto(`${base}/findings/${finding}/edit`);
  await page.getByLabel('Responsable', { exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.waitForURL(`**/findings/${finding}`);
  await fixture.db.exec('reset role');
  assert.equal(
    (
      await fixture.db.query<{ assigned_to: string | null }>(
        'select assigned_to from findings where id=$1',
        [finding],
      )
    ).rows[0].assigned_to,
    null,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Finding assignees: clients only, empty organization, historical preservation and explicit unassignment passed.',
  );
} catch (error) {
  console.error(logs.slice(-6000));
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
