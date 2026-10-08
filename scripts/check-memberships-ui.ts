import { ids } from '../tests/db-helper';
import { chromium, expect } from '@playwright/test';
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
  async function login(email: string) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  await login('admin@example.test');
  await page.goto(`${base}/administration`);
  await page.getByRole('link', { name: /Usuarios y membresías/ }).click();
  const clientGrid = page.getByRole('region', { name: 'Clientes', exact: true });
  const consultantGrid = page.getByRole('region', { name: 'Consultores', exact: true });
  const client = clientGrid
    .getByRole('row')
    .filter({ has: page.getByText('client@example.test', { exact: true }) });
  await client.getByLabel('Organización del cliente').selectOption(fixture.orgB);
  await client.getByRole('button', { name: 'Guardar asignación' }).click();
  await expect(
    client.getByRole('link', { name: 'Segunda Empresa SpA', exact: true }),
  ).toBeVisible();
  await expect(client.getByRole('link', { name: 'Empresa Demo SpA', exact: true })).toHaveCount(0);
  await client.getByLabel('Organización del cliente').selectOption('');
  await client.getByRole('button', { name: 'Guardar asignación' }).click();
  await expect(client.getByText('Sin organización asignada')).toBeVisible();
  await client.getByLabel('Organización del cliente').selectOption(fixture.orgA);
  await client.getByRole('button', { name: 'Guardar asignación' }).click();
  await expect(client.getByRole('link', { name: 'Empresa Demo SpA', exact: true })).toBeVisible();
  const consultant = consultantGrid
    .getByRole('row')
    .filter({ has: page.getByText('a@example.test', { exact: true }) });
  await consultant.locator('summary').click();
  await consultant.getByRole('checkbox', { name: /Segunda Empresa SpA/ }).check();
  await consultant.getByRole('button', { name: 'Guardar organizaciones' }).click();
  await expect(
    consultant.getByRole('link', { name: 'Segunda Empresa SpA', exact: true }),
  ).toBeVisible();
  await expect(
    consultant.getByRole('link', { name: 'Empresa Demo SpA', exact: true }),
  ).toBeVisible();
  // Two tabs must not overwrite an assignment saved since the stale page loaded.
  const stale = await context.newPage();
  await stale.goto(`${base}/administration/memberships`);
  const staleRow = stale
    .getByRole('region', { name: 'Consultores', exact: true })
    .getByRole('row')
    .filter({ has: stale.getByText('a@example.test', { exact: true }) });
  await consultant.getByRole('checkbox', { name: /Empresa Demo SpA/ }).uncheck();
  await consultant.getByRole('button', { name: 'Guardar organizaciones' }).click();
  await expect(consultant.getByRole('link', { name: 'Empresa Demo SpA', exact: true })).toHaveCount(
    0,
  );
  await staleRow.getByRole('button', { name: 'Guardar organizaciones' }).click();
  await expect(staleRow.getByRole('alert')).toContainText('Actualice la página');
  await stale.close();
  await fixture.db.exec('reset role');
  await fixture.db.query("update organizations set status='ARCHIVED' where id=$1", [fixture.orgB]);
  await page.reload();
  assert.equal(await client.locator(`option[value="${fixture.orgB}"]`).isDisabled(), true);
  // Existing archived consultant memberships may be retained or removed.
  await consultant.locator('summary').click();
  assert.equal(
    await consultant.getByRole('checkbox', { name: /Segunda Empresa SpA/ }).isDisabled(),
    false,
  );
  await consultant.getByRole('button', { name: 'Guardar organizaciones' }).click();
  await expect(consultant.getByRole('status')).toContainText('Asignaciones guardadas');
  for (let n = 0; n < 21; n++) {
    for (const [role, group] of [
      ['CLIENT', 'cliente'],
      ['CONSULTANT', 'consultor'],
    ]) {
      const id = `30000000-0000-4000-8000-${String(n + (role === 'CLIENT' ? 0 : 100)).padStart(12, '0')}`;
      await fixture.db.query(
        'insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values($1,$2,$3,$4)',
        [
          id,
          `${group}-${n}@example.test`,
          JSON.stringify({ full_name: `Usuario ${group} ${String(n).padStart(2, '0')}` }),
          JSON.stringify({ provisioned_by: ids.admin, provisioned_role: role }),
        ],
      );
    }
  }
  await page.reload();
  await clientGrid.getByRole('link', { name: 'Siguiente', exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get('client_page') === '2');
  assert.equal(new URL(page.url()).searchParams.get('client_page'), '2');
  await consultantGrid.getByRole('link', { name: 'Siguiente', exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get('consultant_page') === '2');
  assert.equal(new URL(page.url()).searchParams.get('client_page'), '2');
  assert.equal(new URL(page.url()).searchParams.get('consultant_page'), '2');
  await page.getByLabel('Buscar clientes').fill('cliente-20@example.test');
  await page.getByLabel('Buscar consultores').fill('consultor-20@example.test');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.waitForURL((url) => url.searchParams.get('client_q') === 'cliente-20@example.test');
  await expect(clientGrid.getByRole('row')).toHaveCount(2);
  await expect(consultantGrid.getByRole('row')).toHaveCount(2);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
      false,
    );
    await page.screenshot({ path: `artifacts/ui/memberships-${width}.png`, fullPage: true });
    if (width === 360) {
      for (const table of await page.locator('.table-wrap').all()) {
        await table.evaluate((element) => {
          element.scrollLeft = element.scrollWidth;
        });
        assert.ok(await table.evaluate((element) => element.scrollLeft > 0));
      }
      await page.screenshot({ path: 'artifacts/ui/memberships-360-controls.png', fullPage: true });
    }
    results.push({ width, overflow: false });
  }
  await context.clearCookies();
  for (const email of ['client@example.test', 'a@example.test']) {
    await login(email);
    await page.goto(`${base}/administration/memberships`);
    assert.equal(
      await page.getByRole('heading', { name: 'Usuarios y membresías', exact: true }).count(),
      0,
    );
    await context.clearCookies();
  }
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/ui/memberships-results.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(
    'Membership grids: assignment, transfer, stale-save denial, archived organizations, pagination and access passed.',
  );
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
