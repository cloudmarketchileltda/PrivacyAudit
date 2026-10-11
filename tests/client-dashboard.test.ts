import { randomUUID } from 'node:crypto';
import type { ClientDashboardSummary } from '../src/features/dashboard/client-dashboard';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';

test('Dashboard cliente: totales globales, detalle personal, aislamiento, revocación y borrados pendientes', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.client);
    const readSummary = async () =>
      (
        await db.query<{ value: ClientDashboardSummary | null }>(
          'select client_organization_dashboard() value',
        )
      ).rows[0].value;
    const summary = async () => {
      const value = await readSummary();
      assert.ok(value);
      return value;
    };
    assert.equal(await readSummary(), null);
    await identity(db, ids.a);
    const a = await org(db, 'Empresa global A', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa global B', '76234567-6');
    await identity(db, ids.admin);
    await db.query("select manage_member($1,$2,'CLIENT')", [a, ids.client]);
    await db.query("select manage_member($1,$2,'CLIENT')", [b, ids.other]);
    await identity(db, ids.client);
    let s = await summary();
    assert.equal(s.organization.id, a);
    assert.equal(s.tasks.total, 0);
    assert.equal(s.assessment, null);
    assert.equal(s.latest_report, null);
    for (const [organization, manager] of [
      [a, ids.a],
      [b, ids.b],
    ]) {
      await identity(db, manager);
      const assessment = (
        await db.query<{ id: string }>("select create_assessment($1,'Diagnóstico') id", [
          organization,
        ])
      ).rows[0].id;
      const finding = (
        await db.query<{ id: string }>(
          "insert into findings(organization_id,assessment_id,title,description,severity) values($1,$2,'Brecha crítica','Descripción de prueba','CRITICAL') returning id",
          [organization, assessment],
        )
      ).rows[0].id;
      await db.query(
        "insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Mi tarea',$3,(now() at time zone 'America/Santiago')::date-1)",
        [organization, finding, organization === a ? ids.client : ids.other],
      );
      await db.query(
        "insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Detalle ajeno secreto',$3,(now() at time zone 'America/Santiago')::date+7)",
        [organization, finding, manager],
      );
      await db.query(
        "insert into tasks(organization_id,finding_id,title,due_date) values($1,$2,'Fuera del próximo plazo',(now() at time zone 'America/Santiago')::date+8)",
        [organization, finding],
      );
      if (organization === a) {
        await db.query(
          "update tasks set status='WAITING_REVIEW' where title='Mi tarea' and organization_id=$1",
          [a],
        );
        await db.query(
          "update tasks set status='DONE' where title='Mi tarea' and organization_id=$1",
          [a],
        );
        await db.query(
          "insert into tasks(organization_id,finding_id,title,due_date) select $1,$2,'Acción pendiente '||i,(now() at time zone 'America/Santiago')::date-1 from generate_series(1,1001) i",
          [a, finding],
        );
        const hiddenTask = (
          await db.query<{ id: string }>(
            "select id from tasks where organization_id=$1 and title='Detalle ajeno secreto'",
            [a],
          )
        ).rows[0].id;
        const addEvidence = async (previous: string | null = null) => {
          const id = randomUUID(),
            path = `${a}/${id}/file`;
          await db.query(
            "insert into evidence(id,organization_id,task_id,previous_evidence_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,$5,'Prueba.txt','text/plain',5,'Contenido privado ajeno')",
            [id, a, hiddenTask, previous, path],
          );
          await db.query(
            'insert into storage.objects(bucket_id,name,metadata) values(\'evidence\',$1,\'{"size":5,"mimetype":"text/plain"}\')',
            [path],
          );
          await db.query('select finalize_evidence($1)', [id]);
          return id;
        };
        const accepted = await addEvidence();
        await db.query("update evidence set review_status='ACCEPTED' where id=$1", [accepted]);
        const rejected = await addEvidence();
        await db.query(
          "update evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Revisar entrega' where id=$1",
          [rejected],
        );
        await addEvidence(rejected);
        await db.query(
          "select create_report($1,'Informe de diagnóstico','Resumen ejecutivo completo','Alcance de diagnóstico completo','Conclusiones profesionales completas')",
          [assessment],
        );
        await db.query("update assessment_controls set status='CONFORM' where assessment_id=$1", [
          assessment,
        ]);
      }
    }
    await identity(db, ids.client);
    s = await summary();
    assert.equal(s.tasks.total, 1004);
    assert.equal(s.tasks.done, 1);
    assert.equal(s.tasks.todo, 1003);
    assert.equal(s.tasks.overdue, 1001);
    assert.equal(s.tasks.due_soon, 1);
    assert.equal(s.tasks.mine_total, 1);
    assert.equal(s.tasks.mine_done, 1);
    assert.equal(s.tasks.mine_overdue, 0);
    assert.equal(s.evidence.pending, 1);
    assert.equal(s.evidence.accepted, 1);
    assert.equal((await db.query('select * from evidence')).rows.length, 0);
    assert.equal(s.findings.critical, 1);
    assert.equal(s.controls.total, 52);
    assert.equal(s.controls.evaluated, 52);
    assert.ok(s.latest_report?.id);
    assert.equal((await db.query('select * from tasks')).rows.length, 1);
    assert.ok(!JSON.stringify(s).includes('Detalle ajeno secreto'));
    assert.ok(!JSON.stringify(s).includes(ids.a));
    assert.ok(!JSON.stringify(s).includes(b));
    assert.ok(s.assessment);
    const firstAssessment = s.assessment.id;
    await identity(db, ids.a);
    const newest = (
      await db.query<{ id: string }>("select create_assessment($1,'Segundo diagnóstico') id", [a])
    ).rows[0].id;
    await identity(db, ids.client);
    s = await summary();
    assert.equal(s.assessment?.id, newest);
    assert.equal(s.controls.evaluated, 0);
    assert.equal(s.tasks.total, 1004);
    await identity(db, ids.a);
    await db.query("select prepare_assessment_deletion($1,'ELIMINAR EVALUACION')", [
      firstAssessment,
    ]);
    await identity(db, ids.client);
    s = await summary();
    assert.equal(s.tasks.total, 0);
    assert.equal(s.findings.open, 0);
    assert.equal(s.latest_report, null);
    await identity(db, ids.other);
    s = await summary();
    assert.equal(s.organization.id, b);
    assert.equal(s.tasks.total, 3);
    for (const id of [ids.a, ids.b, ids.admin]) {
      await identity(db, id);
      await assert.rejects(summary(), /No autorizado/);
    }
    await identity(db, ids.client, 'anon');
    await assert.rejects(summary(), /permission denied/);
    await identity(db, ids.admin);
    await db.query("update organizations set status='ARCHIVED' where id=$1", [a]);
    await identity(db, ids.client);
    assert.equal((await summary()).organization.status, 'ARCHIVED');
    await identity(db, ids.admin);
    await db.query('select manage_member($1,$2,null)', [a, ids.client]);
    await identity(db, ids.client);
    assert.equal(await readSummary(), null);
    await db.exec('reset role');
    await db.exec(await readFile('scripts/verify-client-dashboard-remote.sql', 'utf8'));
  } finally {
    await db.close();
  }
});
