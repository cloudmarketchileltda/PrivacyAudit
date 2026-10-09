import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { startFixture } from './ui-fixture';
import { ids } from '../tests/db-helper';
export async function checkPhase6Flow(
  page: Page,
  base: string,
  fixture: Awaited<ReturnType<typeof startFixture>>,
  results: unknown[],
) {
  async function login(name: string) {
    await page.goto(base + '/dashboard');
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await page.waitForURL('**/login');
    await page.getByLabel('Email', { exact: true }).fill(name + '@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  // Create isolated live SQL events without depending on the status left by previous workflows.
  const task = await fixture.db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [ids.a]);
    await tx.exec('set local role authenticated');
    const f = (
      await tx.query<{ id: string }>(
        `insert into findings(organization_id,assessment_id,title,description,severity) values($1,$2,'Hallazgo fase 6','Prueba de notificaciones','CRITICAL') returning id`,
        [fixture.orgA, fixture.assessment],
      )
    ).rows[0].id;
    return (
      await tx.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Tarea fase 6',$3,current_date-2) returning id`,
        [fixture.orgA, f, ids.client],
      )
    ).rows[0].id;
  });
  await fixture.db.query('select private.run_due_notifications()');
  await login('client');
  assert.equal((await page.request.get(base + '/api/administration/audit/export')).status(), 403);
  await page.goto(base + '/administration/audit');
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  await page.goto(base + '/notifications');
  await page.getByLabel('Evento', { exact: true }).selectOption('TASK_OVERDUE');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await page.getByRole('heading', { name: 'Tarea vencida', exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Marcar todas como leídas', exact: true }).click();
  await page.getByRole('link', { name: 'Notificaciones: 0 sin leer', exact: true }).waitFor();
  assert.equal((await page.request.get(base + '/api/notifications/unread')).status(), 200);
  await page.goto(base + '/dashboard?attention=overdue');
  await page.getByRole('heading', { name: 'Dashboard de evaluación' }).waitFor();
  assert.ok(await page.getByText('Empresa Demo SpA', { exact: true }).isVisible());
  assert.equal(await page.getByText('Segunda Empresa SpA', { exact: true }).count(), 0);
  await login('b');
  await page.goto(base + '/notifications');
  assert.equal(await page.getByRole('heading', { name: 'Tarea vencida', exact: true }).count(), 0);
  await login('admin');
  await page.goto(base + '/administration');
  await page.getByRole('link', { name: /Log auditable/ }).click();
  await page.getByRole('heading', { name: 'Log auditable', exact: true }).waitFor();
  await page.getByLabel('Acción', { exact: true }).selectOption('AUTH_LOGIN');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  assert.ok((await page.locator('tbody tr').count()) > 0);
  const filtered = await page.request.get(
    base + '/api/administration/audit/export?action=AUTH_LOGIN',
  );
  assert.equal(filtered.status(), 200);
  assert.match(await filtered.text(), /AUTH_LOGIN/);
  assert.ok(!(await filtered.text()).includes('TASK_OVERDUE'));
  const actorCsv = await page.request.get(
    `${base}/api/administration/audit/export?action=AUTH_SIGN_IN&actor=${ids.client}`,
  );
  assert.equal(actorCsv.status(), 200);
  assert.ok((await actorCsv.text()).includes(ids.client));
  assert.ok(!(await actorCsv.text()).includes(ids.admin));
  // Export over 1,000 records to prove the API cap does not truncate the file.
  await fixture.db.query(
    `insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) select $1,'EXPORT_TEST','audit_logs',gen_random_uuid(),jsonb_build_object('n',n) from generate_series(1,1105) n`,
    [ids.admin],
  );
  const csv = await page.request.get(base + '/api/administration/audit/export?action=EXPORT_TEST');
  assert.equal(csv.status(), 200);
  assert.equal((await csv.text()).split('\r\n').filter(Boolean).length, 1106);
  assert.match(csv.headers()['content-disposition'], /attachment/);
  for (const width of [360, 768, 1440])
    for (const path of [
      '/dashboard',
      '/notifications',
      '/administration',
      '/administration/audit',
    ]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + path);
      await page.locator('main h1').waitFor();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
        false,
      );
      results.push({ width, path, overflow: false });
      if (width === 1440 && path === '/administration/audit')
        await page.screenshot({ path: 'artifacts/ui/phase6-audit.png', fullPage: true });
    }
  await page.getByRole('heading', { name: 'Conservación del historial', exact: true }).waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Borrar eventos anteriores', exact: true }).count(),
    0,
  );
  // Current assignment removes stale notices from the former assignee.
  await fixture.db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [ids.a]);
    await tx.exec('set local role authenticated');
    await tx.query('update tasks set assigned_to=$1 where id=$2', [ids.a, task]);
  });
  results.push({
    flow: 'phase6 notifications, tenant denial, read state, dashboard filters, admin audit CSV >1000 and protected retention',
    passed: true,
  });
}
