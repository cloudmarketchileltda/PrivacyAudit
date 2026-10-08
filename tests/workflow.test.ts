import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';
import { workflowSchema } from '../src/features/workflow/schemas';
test('Fase 4: referencias históricas, asignación, revisión, cierre e aislamiento', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    const assessment = (
      await db.query<{ id: string }>(`select create_assessment($1,'Evaluación A') id`, [a])
    ).rows[0].id;
    const control = (
      await db.query<{ id: string }>(
        `select id from assessment_controls where assessment_id=$1 limit 1`,
        [assessment],
      )
    ).rows[0].id;
    const token = (
      await db.query<{ token: string }>(`select invite_client($1,'client@example.test') token`, [a])
    ).rows[0].token;
    await identity(db, ids.client);
    await db.query(`select accept_invitation($1)`, [token]);
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    const assessmentB = (
      await db.query<{ id: string }>(`select create_assessment($1,'Evaluación B') id`, [b])
    ).rows[0].id;
    await identity(db, ids.a);
    const createFinding = (
      orgId = a,
      assessmentId = assessment,
      controlId: string | null = control,
    ) =>
      db.query<{ id: string; created_by: string }>(
        `insert into findings(organization_id,assessment_id,control_id,title,description,created_by,assigned_to) values($1,$2,$3,'Política de retención','Faltan criterios documentados',$4,$5) returning id,created_by`,
        [orgId, assessmentId, controlId, ids.b, ids.client],
      );
    const finding = (await createFinding()).rows[0];
    assert.equal(finding.created_by, ids.a);
    await assert.rejects(createFinding(a, assessmentB));
    await assert.rejects(
      db.query(`update findings set assigned_to=$1 where id=$2`, [ids.b, finding.id]),
    );
    await assert.rejects(
      db.query(`update findings set organization_id=$1 where id=$2`, [b, finding.id]),
    );
    await assert.rejects(db.query(`update findings set control_id=null where id=$1`, [finding.id]));
    const task = (
      await db.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Redactar política',$3) returning id`,
        [a, finding.id, ids.client],
      )
    ).rows[0].id;
    const hidden = (
      await db.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Revisión interna',$3) returning id`,
        [a, finding.id, ids.a],
      )
    ).rows[0].id;
    await assert.rejects(
      db.query(`update findings set status='CLOSED',closure_note='Revisado' where id=$1`, [
        finding.id,
      ]),
    );
    await assert.rejects(db.query(`update tasks set status='DONE' where id=$1`, [task]));
    await assert.rejects(db.query(`update tasks set assigned_to=$1 where id=$2`, [ids.b, task]));
    await assert.rejects(
      db.query(
        `insert into audit_logs(organization_id,action,entity_type,entity_id) values($1,'FAKE','tasks',$2)`,
        [a, task],
      ),
    );
    await identity(db, ids.client);
    assert.equal((await db.query(`select * from findings`)).rows.length, 1);
    assert.equal((await db.query(`select * from tasks`)).rows.length, 1);
    assert.equal((await db.query(`select * from audit_logs`)).rows.length, 0);
    assert.equal(
      (await db.query(`update findings set severity='LOW' returning id`)).rows.length,
      0,
    );
    assert.equal((await db.query(`update tasks set status='DONE' returning id`)).rows.length, 0);
    await assert.rejects(db.query(`select submit_task($1,'WAITING_REVIEW')`, [hidden]));
    await assert.rejects(db.query(`select submit_task($1,'DONE')`, [task]));
    await db.query(`select submit_task($1,'IN_PROGRESS')`, [task]);
    await db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]);
    await assert.rejects(db.query(`select submit_task($1,'IN_PROGRESS')`, [task]));
    const progress = (
      await db.query<{ p: { total: number; done: number } }>(`select finding_progress($1) p`, [
        finding.id,
      ])
    ).rows[0].p;
    assert.deepEqual(progress, { total: 2, done: 0 });
    await identity(db, ids.b);
    assert.equal((await db.query(`select * from findings`)).rows.length, 0);
    assert.equal((await db.query(`select * from tasks`)).rows.length, 0);
    await assert.rejects(createFinding());
    await assert.rejects(db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]));
    await assert.rejects(db.query(`select finding_progress($1)`, [finding.id]));
    assert.equal(
      (await db.query(`update tasks set title='Intrusión' returning id`)).rows.length,
      0,
    );
    await assert.rejects(db.query(`delete from tasks where id=$1`, [task]));
    await identity(db, ids.a);
    await assert.rejects(db.query(`update tasks set status='TODO' where id=$1`, [task]));
    await db.query(
      `update tasks set status='TODO',reviewer_comment='Agregar plazo y responsables' where id=$1`,
      [task],
    );
    await identity(db, ids.client);
    await db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]);
    await identity(db, ids.a);
    await db.query(`update tasks set status='DONE' where id=$1`, [task]);
    assert.ok(
      (
        await db.query<{ completed_at: string }>(`select completed_at from tasks where id=$1`, [
          task,
        ])
      ).rows[0].completed_at,
    );
    await db.query(`update tasks set status='WAITING_REVIEW' where id=$1`, [hidden]);
    await db.query(`update tasks set status='DONE' where id=$1`, [hidden]);
    await assert.rejects(db.query(`update findings set status='CLOSED' where id=$1`, [finding.id]));
    await db.query(
      `update findings set status='CLOSED',closure_note='Acciones revisadas por consultor' where id=$1`,
      [finding.id],
    );
    await assert.rejects(db.query(`update tasks set title='Cambio tardío' where id=$1`, [task]));
    await assert.rejects(
      db.query(`insert into tasks(organization_id,finding_id,title) values($1,$2,'Tardía')`, [
        a,
        finding.id,
      ]),
    );
    await db.query(`update findings set status='OPEN' where id=$1`, [finding.id]);
    assert.equal(
      (
        await db.query<{ closed_at: null }>(`select closed_at from findings where id=$1`, [
          finding.id,
        ])
      ).rows[0].closed_at,
      null,
    );
    await db.query(`update tasks set status='IN_PROGRESS' where id=$1`, [task]);
    assert.equal(
      (await db.query<{ completed_at: null }>(`select completed_at from tasks where id=$1`, [task]))
        .rows[0].completed_at,
      null,
    );
    await db.query(
      `update findings set status='ACCEPTED_RISK',closure_note='Riesgo evaluado y aceptado por el consultor' where id=$1`,
      [finding.id],
    );
    await assert.rejects(db.query(`update tasks set status='WAITING_REVIEW' where id=$1`, [task]));
    await db.query(`update findings set status='OPEN' where id=$1`, [finding.id]);
    await assert.rejects(
      db.query(`update tasks set finding_id=gen_random_uuid() where id=$1`, [task]),
    );
    await assert.rejects(db.query(`update tasks set created_by=$1 where id=$2`, [ids.b, task]));
    await assert.rejects(db.query(`delete from findings where id=$1`, [finding.id]));
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ARCHIVED' where id=$1`, [a]);
    await identity(db, ids.a);
    assert.equal(
      (await db.query(`update findings set title='Archivada' returning id`)).rows.length,
      0,
    );
    assert.equal(
      (await db.query(`update tasks set title='Archivada' returning id`)).rows.length,
      0,
    );
    await identity(db, ids.client);
    await assert.rejects(db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]));
    await identity(db, ids.a);
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ACTIVE' where id=$1`, [a]);
    await identity(db, ids.a);
    await db.query(`select manage_member($1,$2,null)`, [a, ids.client]);
    await identity(db, ids.client);
    assert.equal((await db.query(`select * from tasks`)).rows.length, 0);
    await assert.rejects(db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]));
    await identity(db, ids.admin);
    assert.ok((await db.query(`select * from audit_logs`)).rows.length > 0);
    await assert.rejects(db.query(`update audit_logs set action='FAKE'`));
    await identity(db, '', 'anon');
    for (const table of ['findings', 'tasks', 'audit_logs'])
      await assert.rejects(db.query(`select * from ${table}`));
  } finally {
    await db.close();
  }
});
test('Fase 4: formulario exige relaciones, fecha válida y justificación de cierre', () => {
  const valid = {
    kind: 'finding',
    organization_id: ids.a,
    id: '',
    assessment_id: ids.b,
    control_id: '',
    finding_id: '',
    title: 'Hallazgo',
    description: 'Descripción',
    recommendation: '',
    area: '',
    priority: 'HIGH',
    status: 'OPEN',
    assigned_to: '',
    due_date: '',
    closure_note: '',
    reviewer_comment: '',
  };
  assert.equal(workflowSchema.safeParse(valid).success, true);
  for (const change of [
    { assessment_id: '' },
    { due_date: '2026-02-30' },
    { status: 'CLOSED' },
    { status: 'ACCEPTED_RISK' },
    { assigned_to: 'invalid' },
    { description: '' },
  ])
    assert.equal(workflowSchema.safeParse({ ...valid, ...change }).success, false);
  assert.equal(
    workflowSchema.safeParse({ ...valid, status: 'CLOSED', closure_note: 'Cierre justificado' })
      .success,
    true,
  );
  assert.equal(
    workflowSchema.safeParse({ ...valid, kind: 'task', finding_id: ids.b, status: 'DONE' }).success,
    false,
  );
});
