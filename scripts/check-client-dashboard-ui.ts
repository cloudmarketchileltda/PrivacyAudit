import { ids } from '../tests/db-helper';
import { mkdir, writeFile } from 'node:fs/promises';
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
  await mkdir('artifacts/client-dashboard-ui', { recursive: true });
  await fixture.db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [ids.a]);
    await tx.exec('set local role authenticated');
    await tx.query(
      "insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Título privado del consultor',$3,(now() at time zone 'America/Santiago')::date-1)",
      [fixture.orgA, fixture.findingId, ids.a],
    );
    await tx.query(
      "select create_report($1,'Informe ejecutivo de prueba','Resumen ejecutivo de prueba','Alcance profesional de prueba','Conclusiones profesionales de prueba')",
      [fixture.assessment],
    );
  });
  async function login(name: string) {
    await context.clearCookies();
    await page.goto(`${base}/login`);
    await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  await login('client');
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/dashboard?attention=overdue&q=Otra`);
    await page.getByRole('heading', { name: 'Empresa Demo SpA', exact: true }).waitFor();
    for (const name of [
      'Avance del diagnóstico',
      'Avance del plan de acción',
      'Mis tareas',
      'Último informe publicado',
    ])
      await page.getByRole('heading', { name, exact: true }).waitFor();
    assert.equal(await page.getByText('Segunda Empresa SpA', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Título privado del consultor', { exact: true }).count(), 0);
    assert.equal(
      await page.getByRole('link', { name: 'Nueva evaluación', exact: true }).count(),
      0,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    const taskChart = page.getByRole('figure', { name: 'Estado de las tareas', exact: true });
    assert.equal(await taskChart.getByRole('listitem').count(), 4);
    assert.match(await taskChart.innerText(), /Pendientes\s+3\s+\(100%\)/);
    assert.match(await taskChart.innerText(), /Aprobadas\s+0\s+\(0%\)/);
    const findingChart = page.getByRole('figure', { name: 'Estado de los hallazgos', exact: true });
    assert.equal(await findingChart.getByRole('listitem').count(), 3);
    assert.match(await findingChart.innerText(), /Abiertos\s+1\s+\(100%\)/);
    const global = page.getByRole('link').filter({ hasText: 'Tareas vencidas de la organización' });
    assert.ok((await global.innerText()).includes('2'));
    await page.screenshot({ path: `artifacts/client-dashboard-ui/${width}.png`, fullPage: true });
  }
  await fixture.db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [ids.a]);
    await tx.exec('set local role authenticated');
    await tx.query(
      "update tasks set status='IN_PROGRESS' where organization_id=$1 and title='Título privado del consultor'",
      [fixture.orgA],
    );
  });
  await page.reload();
  const mixedChart = page.getByRole('figure', { name: 'Estado de las tareas', exact: true });
  assert.match(await mixedChart.innerText(), /Pendientes\s+2\s+\(67%\)/);
  assert.match(await mixedChart.innerText(), /En ejecución\s+1\s+\(33%\)/);
  assert.equal(await page.getByText('Título privado del consultor', { exact: true }).count(), 0);
  const pdfHref = await page
    .getByRole('link', { name: 'Descargar informe PDF', exact: true })
    .getAttribute('href');
  assert.ok(pdfHref);
  const pdf = await page.request.get(base + pdfHref);
  assert.equal(pdf.status(), 200);
  assert.ok((await pdf.body()).subarray(0, 5).equals(Buffer.from('%PDF-')));
  await page.getByRole('link', { name: 'Ver mis tareas', exact: true }).click();
  await page.locator('main h1').waitFor();
  assert.equal(await page.getByText('Título privado del consultor', { exact: true }).count(), 0);
  await login('a');
  await page.getByRole('heading', { name: 'Dashboard de evaluación', exact: true }).waitFor();
  await login('admin');
  await page.getByRole('heading', { name: 'Dashboard de evaluación', exact: true }).waitFor();
  await login('other');
  await page.getByRole('heading', { name: 'Mi organización', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    'Dashboard cliente UI: visión global/personal, privacidad, PDF, sin organización, roles y 360/768/1440 aprobados.',
  );
} catch (error) {
  await writeFile('artifacts/client-dashboard-ui/server.log', logs);
  if (browser) {
    for (const p of browser.contexts().flatMap((c) => c.pages())) {
      await p.screenshot({ path: 'artifacts/client-dashboard-ui/failure.png', fullPage: true });
      await writeFile(
        'artifacts/client-dashboard-ui/failure.txt',
        await p.locator('body').innerText(),
      );
    }
  }
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await fixture.close();
}
