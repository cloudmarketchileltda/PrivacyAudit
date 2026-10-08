import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { startFixture } from './ui-fixture';
const fixture = await startFixture();
const base = 'http://127.0.0.1:3015';
const server = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3015'],
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
server.stdout.on('data', (chunk) => {
  logs += chunk;
});
server.stderr.on('data', (chunk) => {
  logs += chunk;
});
await mkdir('artifacts/ui', { recursive: true });
async function waitReady() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
    } catch {
      /* Server is still starting. */
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server unavailable\n${logs}`);
}
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await waitReady();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors: string[] = [];
  const results: unknown[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/signup`);
  assert.equal(new URL(page.url()).pathname, '/login');
  assert.equal(await page.getByRole('link', { name: 'Crear cuenta', exact: true }).count(), 0);
  async function login(email: string) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  await login('a@example.test');
  await page.goto(`${base}/users`);
  assert.equal(await page.getByRole('heading', { name: 'Crear cuenta de usuario' }).count(), 0);
  await context.clearCookies();
  await login('admin@example.test');
  await page.goto(`${base}/administration`);
  await page.getByRole('link', { name: /Administración de cuentas/ }).click();
  await page.getByRole('heading', { name: 'Crear cuenta de usuario' }).waitFor();
  for (const [role, name] of [
    ['CONSULTANT', 'Consultor creado'],
    ['CLIENT', 'Cliente creado'],
  ]) {
    const form = page
      .locator('form')
      .filter({ has: page.getByRole('button', { name: 'Crear cuenta', exact: true }) });
    await form.getByLabel('Nombre completo').fill(name);
    await form.getByLabel('Correo electrónico').fill(`${role.toLowerCase()}-created@example.test`);
    await form.getByLabel('Contraseña inicial', { exact: false }).fill('TemporaryPassword123!');
    await form.locator('select[name="role"]').selectOption(role);
    await form.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await form.getByRole('status').waitFor();
    let row = page.getByRole('row').filter({ hasText: name });
    await row.waitFor();
    await row.getByRole('button', { name: `Cambiar rol: ${name}` }).click();
    let dialog = page.getByRole('dialog', { name: 'Cambiar rol', exact: true });
    assert.equal(await dialog.locator('select[name="new_role"]').inputValue(), role);
    await dialog
      .locator('select[name="new_role"]')
      .selectOption(role === 'CLIENT' ? 'CONSULTANT' : 'CLIENT');
    await dialog.getByRole('button', { name: 'Cambiar rol', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await row.getByRole('button', { name: `Modificar cuenta: ${name}` }).click();
    dialog = page.getByRole('dialog', { name: 'Modificar cuenta', exact: true });
    await dialog.getByLabel('Nombre completo').fill(`${name} editado`);
    await dialog.getByLabel('Correo electrónico').fill(`${role.toLowerCase()}-edited@example.test`);
    await dialog.getByRole('button', { name: 'Modificar cuenta', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    row = page.getByRole('row').filter({ hasText: `${name} editado` });
    await row.getByText(`${role.toLowerCase()}-edited@example.test`, { exact: true }).waitFor();
    await row.getByRole('button', { name: `Eliminar cuenta: ${name} editado` }).click();
    dialog = page.getByRole('dialog', { name: 'Eliminar cuenta', exact: true });
    await dialog.getByLabel('Escriba ELIMINAR CUENTA para confirmar').fill('ELIMINAR CUENTA');
    await dialog.getByRole('button', { name: 'Eliminar cuenta', exact: true }).click();
    await dialog.waitFor({ state: 'hidden' });
    await row.waitFor({ state: 'hidden' });
  }
  // Seed enough real migrated rows to verify the fixed viewport and scrolling.
  await fixture.db.exec('reset role');
  for (let i = 0; i < 18; i++)
    await fixture.db.query(
      'insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),$1,$2)',
      [`grid-${i}@example.test`, JSON.stringify({ full_name: `Usuario grilla ${i}` })],
    );
  await page.reload();
  const checkGrid = async () => {
    await page.locator('.scroll-grid').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const grid = document.querySelector('.scroll-grid');
      return (
        grid && getComputedStyle(grid).maxHeight !== 'none' && grid.scrollHeight > grid.clientHeight
      );
    });
    const metrics = await page.locator('.scroll-grid').evaluate((element) => {
      const rows = [...element.querySelectorAll('tbody tr')];
      const header = element.querySelector('thead')!.getBoundingClientRect().height;
      const row = rows[0].getBoundingClientRect().height;
      return {
        viewport: element.clientHeight,
        header,
        row,
        scrollHeight: element.scrollHeight,
        count: rows.length,
      };
    });
    assert.equal(metrics.count, 20);
    assert.ok(metrics.scrollHeight > metrics.viewport, JSON.stringify(metrics));
    assert.ok(
      Math.abs(metrics.viewport - metrics.header - metrics.row * 10) <= 4,
      JSON.stringify(metrics),
    );
    await page.locator('.scroll-grid').evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    assert.ok(await page.locator('.scroll-grid').evaluate((element) => element.scrollTop > 0));
  };
  await checkGrid();
  await page.goto(`${base}/administration/audit`);
  await page.getByRole('heading', { name: 'Log auditable', exact: true }).waitFor();
  await checkGrid();
  await page.screenshot({ path: 'artifacts/ui/admin-audit-scroll.png', fullPage: true });
  await page.goto(`${base}/users`);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
      false,
    );
    results.push({ width, overflow: false });
  }
  await page.screenshot({ path: 'artifacts/ui/admin-accounts.png', fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/ui/admin-accounts-results.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log('Administrative account CRUD, role changes and ten-row scrolling passed in browser.');
} catch (error) {
  await writeFile('artifacts/ui/server.log', logs);
  if (browser) {
    const pages = browser.contexts().flatMap((c) => c.pages());
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `artifacts/ui/failure-${i}.png`, fullPage: true });
      await writeFile(`artifacts/ui/failure-${i}.txt`, await pages[i].locator('body').innerText());
    }
  }
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
