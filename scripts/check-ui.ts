import { checkPhase6Flow } from './phase6-ui-flow';
import { checkEvidenceFlow } from './evidence-ui-flow';
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
    '/assessments',
    '/assessments/new',
    `/assessments/${fixture.assessment}`,
    `/assessments/${fixture.assessment}/controls/${fixture.responseId}`,
    '/controls',
    '/account',
    '/processing',
    '/findings',
    '/tasks',
    '/action-plan',
    '/evidence',
    `/evidence?organization=${fixture.orgA}`,
    `/evidence/new?organization=${fixture.orgA}&task=${fixture.taskId}`,
    `/evidence/new?organization=${fixture.orgA}&control=${fixture.responseId}`,
    `/findings/${fixture.findingId}`,
    `/findings/${fixture.findingId}/edit`,
    `/tasks/${fixture.taskId}`,
    `/tasks/${fixture.taskId}/edit`,
    `/tasks/new?finding=${fixture.findingId}`,
    `/organizations/${fixture.orgA}/findings/new`,
    `/organizations/${fixture.orgA}/processing`,
    `/organizations/${fixture.orgA}/processing/new`,
    `/organizations/${fixture.orgA}/processing/${fixture.activityId}`,
    `/organizations/${fixture.orgA}/processing/${fixture.activityId}/edit`,
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
        [
          '/dashboard',
          `/findings/${fixture.findingId}`,
          `/tasks/${fixture.taskId}`,
          `/organizations/${fixture.orgA}/findings/new`,
          '/organizations/new',
          `/assessments/${fixture.assessment}`,
          `/organizations/${fixture.orgA}/processing/new`,
          `/organizations/${fixture.orgA}/processing/${fixture.activityId}`,
        ].includes(path)
      )
        await page.screenshot({
          path: `artifacts/ui/${width}-${path.replaceAll('/', '_')}.png`,
          fullPage: true,
        });
    }
  }
  // Real Next.js Server Actions through browser, with SQL RLS from the fixture database.
  await context.clearCookies();
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${base}/administration/organizations/new`);
  await page.getByLabel('Razón social', { exact: true }).fill('Empresa UI SpA');
  await page.getByLabel('RUT', { exact: true }).fill('76345678-1');
  await page.getByLabel('Industria', { exact: true }).fill('Tecnología');
  await page.getByRole('button', { name: 'Guardar organización', exact: true }).click();
  await page.waitForURL(/\/organizations\/[a-f0-9-]+$/);
  const newOrg = page.url().split('/').at(-1)!;
  await page.getByRole('heading', { name: 'Empresa UI SpA', exact: true }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes('Tecnología'));
  await fixture.db.exec('reset role');
  await fixture.db.query(
    "insert into organization_members(organization_id,user_id,role) values($1,$2,'CONSULTANT')",
    [newOrg, '10000000-0000-4000-8000-000000000001'],
  );
  await context.clearCookies();
  await page.goto(`${base}/login`);
  await page.getByLabel('Email', { exact: true }).fill('a@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
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
  // Phase 4: create a finding from a historical control and an assigned corrective task.
  await page.goto(`${base}/assessments/${fixture.assessment}/controls/${fixture.responseId}`);
  await page.getByRole('link', { name: 'Crear hallazgo desde este control', exact: true }).click();
  await page
    .getByLabel('Título del hallazgo', { exact: true })
    .fill('Hallazgo creado desde navegador');
  await page
    .getByLabel('Descripción', { exact: true })
    .fill('Faltan criterios aprobados de conservación');
  await page
    .getByLabel('Recomendación', { exact: true })
    .fill('Documentar los plazos y responsables');
  await page
    .getByLabel('Responsable', { exact: true })
    .selectOption('10000000-0000-4000-8000-000000000003');
  await page.getByLabel('Área', { exact: true }).fill('Comercial');
  await page.getByLabel('Fecha objetivo', { exact: true }).fill('2020-01-01');
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.waitForURL(/\/findings\/[a-f0-9-]+$/);
  const uiFinding = page.url().split('/').at(-1)!;
  await page.getByRole('link', { name: 'Nueva tarea', exact: true }).click();
  await page.getByLabel('Título de la tarea', { exact: true }).fill('Tarea UI cliente');
  await page.getByLabel('Descripción', { exact: true }).fill('Preparar borrador de política');
  await page.getByRole('button', { name: 'Guardar tarea', exact: true }).click();
  await page.waitForURL(/\/tasks\/[a-f0-9-]+$/);
  const uiTask = page.url().split('/').at(-1)!;
  await page.goto(`${base}/findings/${uiFinding}/edit`);
  await page.getByLabel('Estado', { exact: true }).selectOption('CLOSED');
  await page
    .getByLabel('Justificación de cierre o riesgo aceptado', { exact: true })
    .fill('Revisión final');
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'aprobación de todas las tareas' }).waitFor();
  await page.goto(
    `${base}/action-plan?organization=${fixture.orgA}&overdue=yes&open=yes&area=Comercial`,
  );
  await page.getByRole('link', { name: /Hallazgo creado desde navegador/ }).waitFor();
  await page.goto(`${base}/tasks?organization=${fixture.orgA}&status=TODO&overdue=yes&q=Tarea UI`);
  await page.getByRole('link', { name: 'Tarea UI cliente', exact: true }).waitFor();
  // Processing register: actual form, Server Action, SQL and query filters.
  const processingBase = `${base}/organizations/${fixture.orgA}/processing`;
  await page.goto(`${processingBase}?sort=name`);
  assert.equal(await page.locator('tbody tr').count(), 20);
  await page.getByRole('link', { name: 'Siguiente', exact: true }).click();
  await page.waitForURL(/sort=name.*page=2/);
  assert.equal(await page.locator('tbody tr').count(), 1);
  await page.getByRole('link', { name: 'Gestión de clientes', exact: true }).waitFor();
  await page.goto(`${processingBase}/new`);
  await page.getByLabel('Nombre del tratamiento', { exact: true }).fill('Marketing de clientes');
  await page.getByLabel('Área', { exact: true }).fill('Comercial');
  await page
    .getByLabel('Responsable interno (nombre o cargo)', { exact: true })
    .fill('Encargado comercial');
  await page
    .getByLabel('Finalidad del tratamiento', { exact: true })
    .fill('Gestionar campañas solicitadas por clientes');
  await page.getByLabel('Clientes', { exact: true }).check();
  await page.getByLabel('Trabajadores', { exact: true }).check();
  await page.getByLabel('Contacto', { exact: true }).check();
  await page.getByLabel('Base de licitud propuesta', { exact: true }).selectOption('OTHER');
  await page
    .getByLabel('Explicación de la base de licitud', { exact: true })
    .fill('Pendiente de revisión por el consultor');
  await page
    .getByLabel('¿Realiza transferencias internacionales?', { exact: true })
    .selectOption('YES');
  await page.getByRole('button', { name: 'Guardar tratamiento', exact: true }).click();
  await page.getByText('Describa las transferencias internacionales.', { exact: true }).waitFor();
  await page
    .getByLabel('Detalle de transferencias internacionales', { exact: true })
    .fill('Servicio alojado en otro país');
  await page.getByRole('button', { name: 'Guardar tratamiento', exact: true }).click();
  await page.waitForURL(/\/processing\/[a-f0-9-]+$/);
  const createdProcessing = page.url();
  await page.getByRole('heading', { name: 'Marketing de clientes', exact: true }).waitFor();
  await page.getByText('Clientes, Trabajadores', { exact: true }).waitFor();
  await page.getByRole('link', { name: 'Editar tratamiento', exact: true }).click();
  await page.getByLabel('Estado', { exact: true }).selectOption('ARCHIVED');
  await page.getByLabel('Plazo de conservación', { exact: true }).fill('Pendiente de definición');
  await page.getByRole('button', { name: 'Guardar tratamiento', exact: true }).click();
  await page.waitForURL(createdProcessing);
  await page.getByText('Pendiente de definición', { exact: true }).waitFor();
  await page.goto(`${processingBase}?status=ARCHIVED&transfer=YES&q=Marketing`);
  await page.getByRole('link', { name: 'Marketing de clientes', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('link', { name: 'Gestión de clientes', exact: true }).count(),
    0,
  );
  await page.goto(`${base}/processing`);
  assert.equal(await page.getByText('Tratamiento privado de B', { exact: true }).count(), 0);
  await page.goto(createdProcessing);
  await page.getByText('Eliminar tratamiento', { exact: true }).click();
  await page.getByLabel('Confirmación', { exact: true }).fill('ELIMINAR');
  await page.getByRole('button', { name: 'Eliminar definitivamente', exact: true }).click();
  await page.waitForURL(processingBase);
  assert.equal(
    await page.getByRole('link', { name: 'Marketing de clientes', exact: true }).count(),
    0,
  );
  await page.goto(`${base}/organizations/${fixture.orgB}/processing`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
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
  await page.goto(`${base}/tasks`);
  assert.equal(
    await page.getByRole('link', { name: 'Revisión privada del consultor', exact: true }).count(),
    0,
  );
  await page.goto(`${base}/tasks/${fixture.hiddenTaskId}`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.goto(`${base}/tasks/${uiTask}/edit`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.goto(`${base}/findings/${uiFinding}/edit`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.goto(`${base}/tasks/${uiTask}`);
  await page.getByRole('button', { name: 'Actualizar mi tarea', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Tarea enviada a revisión' }).waitFor();
  await page.goto(`${base}/organizations/${fixture.orgA}/processing/${fixture.activityId}`);
  await page.getByRole('heading', { name: 'Gestión de clientes', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('link', { name: 'Editar tratamiento', exact: true }).count(),
    0,
  );
  assert.equal(await page.getByText('Eliminar tratamiento', { exact: true }).count(), 0);
  await page.goto(`${base}/organizations/${fixture.orgA}/processing/${fixture.activityId}/edit`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.goto(`${base}/organizations/${fixture.orgA}/processing/new`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
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
  // Consultant return, client resubmission, approval and finding closure.
  await page.goto(`${base}/tasks/${uiTask}/edit`);
  await page.getByLabel('Estado', { exact: true }).selectOption('TODO');
  await page.getByRole('button', { name: 'Guardar tarea', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'devolver exige observaciones' }).waitFor();
  await page
    .getByLabel('Observaciones del consultor', { exact: true })
    .fill('Agregar responsables y plazos');
  await page.getByRole('button', { name: 'Guardar tarea', exact: true }).click();
  await page.waitForURL(`${base}/tasks/${uiTask}`);
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email', { exact: true }).fill('client@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${base}/tasks/${uiTask}`);
  await page.getByRole('button', { name: 'Actualizar mi tarea', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Tarea enviada a revisión' }).waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`${base}/tasks/${uiTask}/edit`);
  await page.getByLabel('Estado', { exact: true }).selectOption('DONE');
  await page.getByRole('button', { name: 'Guardar tarea', exact: true }).click();
  await page.waitForURL(`${base}/tasks/${uiTask}`);
  await page.goto(`${base}/findings/${uiFinding}/edit`);
  await page.getByLabel('Estado', { exact: true }).selectOption('CLOSED');
  await page
    .getByLabel('Justificación de cierre o riesgo aceptado', { exact: true })
    .fill('Acciones revisadas y aprobadas');
  await page.getByRole('button', { name: 'Guardar hallazgo', exact: true }).click();
  await page.waitForURL(`${base}/findings/${uiFinding}`);
  await page.getByText('1/1 tareas aprobadas', { exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Nueva tarea', exact: true }).count(), 0);
  await checkEvidenceFlow(page, base, fixture, results);

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
  await checkPhase6Flow(page, base, fixture, results);
  assert.deepEqual(errors, []);
  await writeFile(
    'artifacts/ui/results.json',
    JSON.stringify(
      {
        backend: 'Isolated PostgreSQL UI fixture; not live Supabase Auth/PostgREST',
        screens: results.length,
        checks: results,
        flows: [
          'finding from historical control, task assignment and closure blocked with pending tasks',
          'action plan and task search, overdue and area filters',
          'client assigned task only and editing denial',
          'task submission, consultant return with observations, resubmission, approval and finding closure',
          'private evidence upload, download, comments, request changes, new delivery and acceptance',
          'evidence tenant URL and file download denial, status filtering and responsive detail',
          'consultant login',
          'organization create with profile',
          'assessment create with 52 controls',
          'control not applicable',
          'tenant URL denial',
          'logout',
          'client read only',
          'client comment without evaluation change',
          'admin control create',
          'processing create with multiple categories and conditional validation',
          'processing edit and archive',
          'processing search, status and transfer filters',
          'processing pagination with stable ordering',
          'processing confirmed deletion',
          'processing tenant URL denial and client read only',
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
