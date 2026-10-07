import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import type { startFixture } from './ui-fixture';
export async function checkEvidenceFlow(
  page: Page,
  base: string,
  fixture: Awaited<ReturnType<typeof startFixture>>,
  results: unknown[],
) {
  // Phase 5: authenticated file upload, chronological comments, correction and download.
  async function loginAs(name: string) {
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await page.waitForURL('**/login');
    await page.getByLabel('Email', { exact: true }).fill(`${name}@example.test`);
    await page.getByLabel('Contraseña', { exact: true }).fill('FixturePassword123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await page.waitForURL('**/dashboard');
  }
  await loginAs('client');
  await page.goto(`${base}/tasks/${fixture.taskId}`);
  await page.getByRole('link', { name: 'Adjuntar evidencia', exact: true }).click();
  await page.getByLabel('Descripción', { exact: true }).fill('Política propuesta por el cliente');
  await page.getByLabel('Archivo', { exact: true }).setInputFiles({
    name: 'Retencion.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nEvidencia inicial\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Subir evidencia', exact: true }).click();
  await page.waitForURL(/\/evidence\/[0-9a-f-]+$/);
  const evidenceId = page.url().split('/').pop()!;
  await page.getByText('Pendiente de revisión', { exact: true }).first().waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Registrar revisión', exact: true }).count(),
    0,
  );
  await page
    .getByLabel('Nuevo comentario', { exact: true })
    .fill('Adjunto el borrador para revisión.');
  await page.getByRole('button', { name: 'Agregar comentario', exact: true }).click();
  await page.getByText('Adjunto el borrador para revisión.', { exact: true }).waitFor();
  const download = await page.request.get(`${base}/api/evidence/${evidenceId}/download`);
  assert.equal(download.status(), 200);
  assert.match((await download.body()).toString(), /Evidencia inicial/);
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/evidence/${evidenceId}`);
    await page.getByRole('heading', { name: 'Retencion.pdf', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Comentarios', exact: true }).waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1),
      false,
    );
    results.push({ width, path: `/evidence/${evidenceId}`, overflow: false });
    await page.screenshot({ path: `artifacts/ui/evidence-${width}.png`, fullPage: true });
  }
  await loginAs('b');
  await page.goto(`${base}/evidence/${evidenceId}`);
  await page.getByRole('heading', { name: 'Registro no disponible' }).waitFor();
  assert.equal(
    (await page.request.get(`${base}/api/evidence/${evidenceId}/download`)).status(),
    404,
  );
  await loginAs('a');
  await page.goto(`${base}/evidence/${evidenceId}`);
  await page.getByLabel('Resultado', { exact: true }).selectOption('CHANGES_REQUESTED');
  await page.getByRole('button', { name: 'Registrar revisión', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Agregue observaciones' }).waitFor();
  await page.getByLabel('Observaciones', { exact: true }).fill('Agregar responsables y plazos.');
  await page.getByRole('button', { name: 'Registrar revisión', exact: true }).click();
  await page.getByText('Cambios solicitados', { exact: true }).first().waitFor();
  await loginAs('client');
  await page.goto(`${base}/evidence/${evidenceId}`);
  await page.getByRole('link', { name: 'Subir nueva entrega', exact: true }).click();
  await page.getByLabel('Descripción', { exact: true }).fill('Política corregida con responsables');
  await page.getByLabel('Archivo', { exact: true }).setInputFiles({
    name: 'Retencion-v2.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\nEvidencia corregida\n%%EOF'),
  });
  await page.getByRole('button', { name: 'Subir evidencia', exact: true }).click();
  await page.waitForURL(/\/evidence\/[0-9a-f-]+$/);
  const correctedId = page.url().split('/').pop()!;
  assert.notEqual(correctedId, evidenceId);
  await page.getByRole('link', { name: 'Entrega anterior', exact: true }).waitFor();
  await loginAs('a');
  await page.goto(`${base}/evidence/${correctedId}`);
  await page.getByRole('button', { name: 'Registrar revisión', exact: true }).click();
  await page.getByText('Aceptada', { exact: true }).first().waitFor();
  await page.goto(`${base}/evidence/${evidenceId}`);
  await page.getByText('Cambios solicitados', { exact: true }).first().waitFor();
  await page.getByRole('link', { name: 'Entrega siguiente', exact: true }).waitFor();
  await page.goto(`${base}/evidence?organization=${fixture.orgA}`);
  await page.getByLabel('Estado', { exact: true }).selectOption('ACCEPTED');
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await page.getByRole('link', { name: 'Retencion-v2.pdf', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Retencion.pdf', exact: true }).count(), 0);
  // Populate reservations only in the isolated fixture to verify stable table pagination.
  await fixture.db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [
      '10000000-0000-4000-8000-000000000001',
    ]);
    await tx.exec('set local role authenticated');
    await tx.query(
      `insert into evidence(id,organization_id,file_path,original_filename,mime_type,file_size,description)
      select id,$1::uuid,$1::uuid::text||'/'||id::text||'/file','Listado-'||lpad(n::text,2,'0')||'.txt','text/plain',12,'Reserva de prueba'
      from (select gen_random_uuid() id,n from generate_series(1,21) n) s`,
      [fixture.orgA],
    );
  });
  await page.goto(
    `${base}/evidence?organization=${fixture.orgA}&q=Listado&status=INCOMPLETE&sort=name`,
  );
  await page.getByRole('link', { name: 'Listado-01.txt', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Listado-21.txt', exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Siguiente', exact: true }).click();
  await page.getByRole('link', { name: 'Listado-21.txt', exact: true }).waitFor();
  assert.equal(await page.getByRole('link', { name: 'Listado-01.txt', exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Anterior', exact: true }).waitFor();
  await loginAs('admin');
}
