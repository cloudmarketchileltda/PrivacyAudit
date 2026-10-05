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
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/login', '/signup', '/recover']) {
      await page.goto(base + path);
      await page.locator('main h1').waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
        false,
      );
      results.push({ width, path, overflow: false });
    }
  }
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill('a@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.getByRole('heading', { name: 'Dashboard de evaluación' }).waitFor();
  assert.ok(await page.getByText('Empresa Demo SpA', { exact: true }).isVisible());
  assert.equal(await page.getByText('Segunda Empresa SpA', { exact: true }).count(), 0);
  const paths = [
    '/dashboard',
    '/organizations',
    '/organizations/new',
    `/organizations/${fixture.orgA}`,
    `/organizations/${fixture.orgA}/edit`,
    '/assessments',
    '/assessments/new',
    `/assessments/${fixture.assessment}`,
    `/assessments/${fixture.assessment}/controls/${fixture.responseId}`,
    '/controls',
    '/account',
  ];

  for (const width of [360, 390, 560, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of paths) {
      await page.goto(base + path);
      await page.locator('main h1').waitFor();
      assert.equal(
        await page.getByRole('heading', { name: 'No fue posible cargar la información' }).count(),
        0,
        `load ${path}`,
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      assert.equal(overflow, false, `overflow ${width} ${path}`);
      results.push({ width, path, overflow });
      if (
        [360, 768, 1440].includes(width) &&
        ['/dashboard', '/organizations/new', `/assessments/${fixture.assessment}`].includes(path)
      )
        await page.screenshot({
          path: `artifacts/ui/${width}-${path.replaceAll('/', '_')}.png`,
          fullPage: true,
        });
    }
  }
  // Real Next.js Server Actions through browser, with SQL RLS from the fixture database.
  await page.goto(`${base}/organizations/new`);
  await page.getByLabel('Razón social', { exact: true }).fill('Empresa UI SpA');
  await page.getByLabel('RUT', { exact: true }).fill('76345678-1');
  await page.getByLabel('Industria', { exact: true }).fill('Tecnología');
  await page.getByRole('button', { name: 'Guardar organización', exact: true }).click();
  await page.waitForURL(/\/organizations\/[a-f0-9-]+$/);
  const newOrg = page.url().split('/').at(-1)!;
  await page.getByRole('heading', { name: 'Empresa UI SpA', exact: true }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes('Tecnología'));
  await page.goto(`${base}/assessments/new?organization=${newOrg}`);
  await page
    .getByLabel('Nombre de la evaluación', { exact: true })
    .fill('Evaluación desde navegador');
  await page.getByRole('button', { name: 'Crear evaluación', exact: true }).click();
  await page.waitForURL(/\/assessments\/[a-f0-9-]+$/);
  await page.getByRole('heading', { name: 'Evaluación desde navegador' }).waitFor();
  const newAssessment = page.url();
  await page.getByRole('link', { name: 'Responsable interno de privacidad', exact: true }).click();
  await page.getByRole('combobox', { name: /Estado del control/ }).selectOption('NOT_APPLICABLE');
  await page
    .getByLabel('Motivo de no aplicabilidad', { exact: false })
    .fill('No aplica al alcance de esta evaluación');
  await page.getByRole('button', { name: 'Guardar evaluación del control' }).click();
  await page.getByRole('status').filter({ hasText: 'Control actualizado' }).waitFor();
  await page.goto(newAssessment);
  await page.getByText('1 de 52 controles evaluados', { exact: true }).waitFor();
  await page.goto(`${base}/organizations/${fixture.orgB}`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  // Client can read but has no editor, and cannot see consultant B's organization.
  await page.getByRole('link', { name: 'Volver al dashboard' }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email', { exact: true }).fill('client@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${base}/assessments/${fixture.assessment}/controls/${fixture.responseId}`);
  await page.getByRole('heading', { name: 'Evaluación del control' }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Guardar evaluación del control' }).count(),
    0,
  );
  assert.ok(await page.getByText('Comentario del consultor', { exact: true }).isVisible());
  await page
    .getByLabel('Observaciones', { exact: true })
    .fill('Antecedentes adicionales aportados por el cliente');
  await page.getByRole('button', { name: 'Guardar comentario', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Comentario del cliente guardado' }).waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/users', '/controls/new']) {
      await page.goto(base + path);
      await page.locator('main h1').waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
        false,
      );
      results.push({ width, path, overflow: false });
    }
  }
  await page.goto(`${base}/controls/new`);
  await page.getByLabel('Código', { exact: true }).fill('UI-001');
  await page.getByLabel('Título', { exact: true }).fill('Control creado desde navegador');
  await page.getByLabel('Categoría', { exact: true }).fill('Gobierno y responsabilidad');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await page.waitForURL('**/controls');
  await page.getByLabel('Buscar', { exact: true }).fill('UI-001');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await page.getByRole('link', { name: 'Control creado desde navegador', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/ui/results.json',
    JSON.stringify(
      {
        backend: 'Isolated PostgreSQL UI fixture; not live Supabase Auth/PostgREST',
        screens: results.length,
        checks: results,
        flows: [
          'consultant login',
          'organization create with profile',
          'assessment create with 52 controls',
          'control not applicable',
          'tenant URL denial',
          'logout',
          'client read only',
          'client comment without evaluation change',
          'admin control create',
        ],
        errors,
      },
      null,
      2,
    ),
  );
  console.log(`UI: ${results.length} screen/viewport checks and critical browser flows passed.`);
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
