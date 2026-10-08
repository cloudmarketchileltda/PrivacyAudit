import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, users, identity, org, ids } from './db-helper';
import { csvCell, csvRow, purgeSchema, chileDayStart } from '../src/features/audit/model';
test('Fase 6: notificaciones privadas, vencimientos, métricas y auditoría protegida', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    const assessment = (
      await db.query<{ id: string }>(`select create_assessment($1,'Evaluación') id`, [a])
    ).rows[0].id;
    const token = (
      await db.query<{ token: string }>(`select invite_client($1,'client@example.test') token`, [a])
    ).rows[0].token;
    await identity(db, ids.client);
    await db.query('select accept_invitation($1)', [token]);
    await identity(db, ids.a);
    const finding = (
      await db.query<{ id: string }>(
        `insert into findings(organization_id,assessment_id,title,description,severity) values($1,$2,'Retención','Faltan plazos','HIGH') returning id`,
        [a, assessment],
      )
    ).rows[0].id;
    const task = (
      await db.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Política',$3,current_date-2) returning id`,
        [a, finding, ids.client],
      )
    ).rows[0].id;
    await db.query(`update tasks set title='Política revisada' where id=$1`, [task]);
    await identity(db, ids.client);
    let notices = (
      await db.query<{ id: string; event_type: string }>(`select id,event_type from notifications`)
    ).rows;
    assert.equal(notices.length, 1);
    assert.equal(notices[0].event_type, 'TASK_ASSIGNED');
    await assert.rejects(
      db.query(
        `insert into notifications(recipient_id,organization_id,event_type,title,message,event_key) values($1,$2,'TASK_ASSIGNED','Falso','Falso','fake')`,
        [ids.client, a],
      ),
    );
    await assert.rejects(db.query(`update notifications set read_at=now()`));
    await db.query(`select read_notifications($1)`, [notices[0].id]);
    assert.ok(
      (await db.query<{ read_at: string | null }>(`select read_at from notifications`)).rows[0]
        .read_at,
    );
    await assert.rejects(
      db.query(`select purge_audit_logs(now(),'Intento de borrar','BORRAR LOG')`),
    );
    await assert.rejects(db.query(`delete from audit_logs`));
    await db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]);
    await identity(db, ids.a);
    assert.equal(
      (await db.query<{ event_type: string }>('select event_type from notifications')).rows[0]
        .event_type,
      'TASK_REVIEW',
    );
    await db.exec(`reset role`);
    assert.equal(
      (await db.query<{ n: number }>(`select private.run_due_notifications() n`)).rows[0].n,
      2,
    );
    assert.equal(
      (await db.query<{ n: number }>(`select private.run_due_notifications() n`)).rows[0].n,
      0,
    );
    await identity(db, ids.client);
    notices = (
      await db.query<{ id: string; event_type: string }>(`select id,event_type from notifications`)
    ).rows;
    assert.equal(notices.filter((n) => n.event_type === 'TASK_OVERDUE').length, 1);
    await identity(db, ids.a);
    const summary = (
      await db.query<{ s: { metrics: Record<string, number>; rows: unknown[]; total: number } }>(
        `select dashboard_summary('Empresa A','','overdue',1) s`,
      )
    ).rows[0].s;
    assert.equal(summary.metrics.overdue_tasks, 1);
    assert.equal(summary.metrics.high_findings, 1);
    assert.equal(summary.total, 1);
    assert.equal(summary.metrics.controls_total, 52);
    await identity(db, ids.b);
    assert.equal((await db.query(`select * from notifications`)).rows.length, 0);
    assert.equal(
      (await db.query<{ s: { total: number } }>(`select dashboard_summary() s`)).rows[0].s.total,
      0,
    );
    await assert.rejects(
      db.query(`select purge_audit_logs(now(),'Intento de borrar','BORRAR LOG')`),
    );
    await identity(db, ids.a);
    await db.query(`update tasks set assigned_to=$1 where id=$2`, [ids.a, task]);
    await identity(db, ids.client);
    assert.equal((await db.query(`select * from notifications`)).rows.length, 0);
    await identity(db, ids.admin);
    const logs = (
      await db.query<{ entity_type: string; metadata: unknown }>(
        'select entity_type,metadata from audit_logs',
      )
    ).rows;
    for (const type of [
      'organizations',
      'organization_members',
      'organization_invitations',
      'profiles',
      'controls',
      'assessments',
      'assessment_controls',
      'findings',
      'tasks',
    ])
      assert.ok(
        logs.some((l) => l.entity_type === type),
        type,
      );
    assert.ok(!JSON.stringify(logs).includes(token));
    await assert.rejects(db.query(`update audit_logs set action='FAKE'`));
    await assert.rejects(db.query(`delete from audit_logs`));
    await assert.rejects(db.query(`select purge_audit_logs(now(),'Motivo válido',null)`));
    await assert.rejects(db.query(`select purge_audit_logs(now(),null,'BORRAR LOG')`));
    await db.exec('reset role');
    await db.query(
      `update auth.users set last_sign_in_at=now(),encrypted_password='never-copy-password' where id=$1`,
      [ids.client],
    );
    await db.query(
      `update auth.users set encrypted_password='never-copy-new-password' where id=$1`,
      [ids.client],
    );
    await db.query(`insert into auth.sessions(user_id) values($1)`, [ids.client]);
    await db.query(`delete from auth.sessions where user_id=$1`, [ids.client]);
    await db.query(`insert into auth.audit_log_entries(payload) values($1::json)`, [
      JSON.stringify({ action: 'login', actor_id: ids.client, password: 'never-copy' }),
    ]);
    await identity(db, ids.admin);
    const auth = (
      await db.query<{ actor_id: string; metadata: unknown }>(
        `select actor_id,metadata from audit_logs where action='AUTH_LOGIN'`,
      )
    ).rows;
    assert.equal(auth[0].actor_id, ids.client);
    assert.ok(!JSON.stringify(auth).includes('never-copy'));
    for (const [action, count] of Object.entries({
      AUTH_SIGN_IN: 1,
      AUTH_CREDENTIAL_UPDATED: 2,
      AUTH_SESSION_ENDED: 1,
    }))
      assert.equal(
        (await db.query(`select * from audit_logs where action=$1`, [action])).rows.length,
        count,
      );
    assert.ok(
      !JSON.stringify(
        (await db.query(`select metadata from audit_logs where entity_type='authentication'`)).rows,
      ).includes('never-copy'),
    );
    await db.exec('reset role');
    const unused = randomUUID();
    await db.query(
      `insert into auth.users(id,email,raw_user_meta_data) values($1,'unused@example.test','{"full_name":"Cuenta temporal"}')`,
      [unused],
    );
    await db.query(`update auth.users set last_sign_in_at=now() where id=$1`, [unused]);
    await db.query(`delete from auth.users where id=$1`, [unused]);
    await identity(db, ids.admin);
    const retained = (
      await db.query<{ actor_id: string | null; actor_ref: string; actor_name: string }>(
        `select actor_id,actor_ref,actor_name from audit_logs where action='AUTH_SIGN_IN' and actor_ref=$1`,
        [unused],
      )
    ).rows[0];
    assert.equal(retained.actor_id, null);
    assert.equal(retained.actor_ref, unused);
    assert.equal(retained.actor_name, 'Cuenta temporal');
    const expected = (
      await db.query<{ n: number }>(`select count(*)::int n from audit_logs where created_at<now()`)
    ).rows[0].n;
    const removed = (
      await db.query<{ n: number }>(
        `select purge_audit_logs(now(),'Conservación de prueba','BORRAR LOG') n`,
      )
    ).rows[0].n;
    assert.equal(Number(removed), expected);
    assert.equal((await db.query(`select * from audit_logs`)).rows.length, 1);
    assert.equal(
      (await db.query<{ action: string }>(`select action from audit_logs`)).rows[0].action,
      'AUDIT_PURGE',
    );
    await db.query(`select purge_audit_logs(now(),'Segunda conservación','BORRAR LOG')`);
    assert.equal(
      (await db.query(`select * from audit_logs where action='AUDIT_PURGE'`)).rows.length,
      2,
    );
    await db.query(`select record_audit_export('{}',2)`);
    assert.equal(
      (await db.query(`select * from audit_logs where action='AUDIT_EXPORT'`)).rows.length,
      1,
    );
    await identity(db, ids.a);
    const empty = await org(db, 'Organización sin datos', '76234567-6');
    await assert.rejects(db.query(`delete from organizations where id=$1`, [empty]));
    await identity(db, ids.admin);
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [empty]);
    await db.query('select finish_organization_deletion($1)', [empty]);
    assert.equal(
      (await db.query('select * from audit_logs where organization_ref=$1', [empty])).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from audit_logs where action='ADMIN_ORGANIZATION_DELETED'")).rows
        .length,
      1,
    );
  } finally {
    await db.close();
  }
});
test('CSV auditable: comillas, saltos, fórmulas y confirmación de borrado', () => {
  assert.equal(chileDayStart('2026-06-01'), '2026-06-01T04:00:00.000Z');
  assert.equal(chileDayStart('2026-10-07'), '2026-10-07T03:00:00.000Z');
  assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"');
  for (const formula of ['=SUM(A1)', '+cmd', ' @x', '\t-2'])
    assert.ok(csvCell(formula).startsWith('"\''));
  assert.ok(csvRow({ metadata: { before: 'é' } }).includes('é'));
  assert.equal(
    purgeSchema.safeParse({
      before_time: new Date(Date.now() + 60000).toISOString(),
      reason: 'Motivo de prueba',
      confirmation: 'BORRAR LOG',
    }).success,
    false,
  );
});
