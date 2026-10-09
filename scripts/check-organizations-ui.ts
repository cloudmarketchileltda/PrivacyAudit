import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
  for (const role of ['a', 'client']) {
    await login(`${role}@example.test`);
    assert.equal(
      await page
        .getByRole('navigation', { name: 'Navegación principal' })
        .getByRole('link', { name: 'Organizaciones', exact: true })
        .count(),
      0,
    );
    for (const path of [
      '/administration/organizations',
      '/administration/organizations/new',
      `/administration/organizations/${fixture.orgA}/edit`,
      '/organizations',
      `/organizations/${fixture.orgA}`,
    ]) {
      await page.goto(base + path);
      await page.getByRole('heading', { name: 'Registro no disponible', exact: true }).waitFor();
      assert.equal(
        await page.getByRole('button', { name: 'Guardar organización', exact: true }).count(),
        0,
        path,
      );
    }
    assert.equal(
      (
        await context.request.get(`${base}/api/administration/organizations/${fixture.orgA}/export`)
      ).status(),
      403,
    );
    await page.goto(`${base}/organizations/${fixture.orgA}/processing`);
    await page.getByRole('heading', { name: 'Tratamientos', exact: true }).waitFor();
  }
  await login('admin@example.test');
  await page.getByRole('link', { name: 'Administración', exact: true }).click();
  await page.getByRole('link', { name: /Organizaciones/ }).click();
  await page.getByRole('link', { name: 'Nueva organización', exact: true }).click();
  await page.getByLabel('Razón social', { exact: true }).fill('Empresa CRUD UI');
  await page.getByLabel('RUT', { exact: true }).fill('76345678-1');
  await page.getByRole('button', { name: 'Guardar organización', exact: true }).click();
  await page.waitForURL(/administration\/organizations\/[a-f0-9-]+$/);
  const created = page.url().split('/').at(-1)!;
  await page.goto(`${base}/administration/organizations`);
  let row = page.getByRole('row').filter({ hasText: 'Empresa CRUD UI' });
  await row.getByRole('link', { name: 'Modificar organización: Empresa CRUD UI' }).click();
  await page.getByLabel('Razón social', { exact: true }).fill('Empresa CRUD modificada');
  await page.getByRole('button', { name: 'Guardar organización', exact: true }).click();
  await page.waitForURL(/administration\/organizations\/[a-f0-9-]+$/);
  assert.equal(
    (
      await context.request.get(`${base}/api/administration/organizations/${created}/export`)
    ).status(),
    409,
  );
  await page.getByRole('button', { name: 'Archivar organización', exact: true }).click();
  await page.getByRole('button', { name: 'Reactivar organización', exact: true }).waitFor();
  await mkdir('artifacts/closure-ui', { recursive: true });
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar datos y archivos', exact: true }).click();
  const download = await downloaded;
  assert.equal(await download.failure(), null);
  await download.saveAs('artifacts/closure-ui/organization.zip');
  assert.equal(
    (await readFile('artifacts/closure-ui/organization.zip')).subarray(0, 2).toString(),
    'PK',
  );
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `artifacts/closure-ui/closure-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Reactivar organización', exact: true }).click();
  await page.getByRole('button', { name: 'Archivar organización', exact: true }).waitFor();
  await page.goto(`${base}/administration/organizations`);
  row = page.getByRole('row').filter({ hasText: 'Empresa CRUD modificada' });
  await row.getByRole('button', { name: 'Eliminar organización: Empresa CRUD modificada' }).click();
  const dialog = page.getByRole('dialog', { name: 'Eliminar organización', exact: true });
  await dialog.waitFor();
  assert.ok((await dialog.innerText()).includes('todos los datos relacionados'));
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  assert.equal(await row.count(), 1);
  for (const name of ['Empresa CRUD modificada', 'Empresa Demo SpA']) {
    row = page.getByRole('row').filter({ hasText: name });
    await row.getByRole('button', { name: `Eliminar organización: ${name}` }).click();
    await dialog
      .getByLabel('Escriba ELIMINAR ORGANIZACION', { exact: true })
      .fill('ELIMINAR ORGANIZACION');
    await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await row.waitFor({ state: 'detached' });
  }
  await fixture.db.exec('reset role');
  for (const org of [created, fixture.orgA]) {
    assert.equal(
      (await fixture.db.query('select id from organizations where id=$1', [org])).rows.length,
      0,
    );
    for (const table of [
      'assessments',
      'assessment_controls',
      'processing_activities',
      'findings',
      'tasks',
      'evidence',
      'comments',
      'notifications',
      'organization_members',
      'audit_logs',
    ]) {
      assert.equal(
        (
          await fixture.db.query(`select organization_id from ${table} where organization_id=$1`, [
            org,
          ])
        ).rows.length,
        0,
        table,
      );
    }
  }
  assert.equal(
    (await fixture.db.query('select id from organizations where id=$1', [fixture.orgB])).rows
      .length,
    1,
  );
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/administration/organizations`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    'Organizaciones UI: acceso exclusivo, CRUD, cancelación, modal, borrado relacionado y diseño responsivo verificados. Adaptador local; no prueba Auth/Storage remotos.',
  );
} catch (error) {
  await mkdir('artifacts/closure-ui', { recursive: true });
  await writeFile('artifacts/closure-ui/server.log', logs);
  for (const page of browser?.contexts().flatMap((context) => context.pages()) || []) {
    await writeFile('artifacts/closure-ui/failure.txt', await page.locator('body').innerText());
    await page.screenshot({ path: 'artifacts/closure-ui/failure.png', fullPage: true });
  }
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
