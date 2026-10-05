import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';
test('Fase 2: catálogo, creación atómica, snapshots, estados e aislamiento', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    assert.equal((await db.query('select * from controls')).rows.length, 52);
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    await identity(db, ids.a);
    const { rows } = await db.query<{ id: string }>(
      `select create_assessment($1,'Evaluación 1','Alcance') id`,
      [a],
    );
    const assessment = rows[0].id;
    const controls = await db.query<{
      id: string;
      snapshot: { title: string };
      control_id: string;
    }>(`select * from assessment_controls where assessment_id=$1 order by id`, [assessment]);
    assert.equal(controls.rows.length, 52);
    const response = controls.rows[0];
    assert.ok(response.snapshot.title);
    await assert.rejects(
      db.query(`update assessments set status='COMPLETED' where id=$1`, [assessment]),
      'impide completar con pendientes',
    );
    await assert.rejects(
      db.query(`update assessment_controls set status='NOT_APPLICABLE' where id=$1`, [response.id]),
    );
    await db.query(
      `update assessment_controls set status='NOT_APPLICABLE',applicability_reason='Fuera del alcance' where id=$1`,
      [response.id],
    );
    assert.equal(
      (
        await db.query<{ evaluated_by: string }>(
          `select evaluated_by from assessment_controls where id=$1`,
          [response.id],
        )
      ).rows[0].evaluated_by,
      ids.a,
    );
    await assert.rejects(
      db.query(`update assessment_controls set organization_id=$1 where id=$2`, [b, response.id]),
    );
    await assert.rejects(
      db.query(`update assessment_controls set snapshot='{}' where id=$1`, [response.id]),
    );
    await assert.rejects(
      db.query(`update assessments set organization_id=$1 where id=$2`, [b, assessment]),
    );
    assert.equal(
      (
        await db.query(`update controls set title='Alteración' where id=$1 returning id`, [
          response.control_id,
        ])
      ).rows.length,
      0,
    );
    await identity(db, ids.admin);
    await db.query(`update controls set title='Cambio catálogo',active=false where id=$1`, [
      response.control_id,
    ]);
    assert.equal(
      (
        await db.query<{ snapshot: { title: string } }>(
          `select snapshot from assessment_controls where id=$1`,
          [response.id],
        )
      ).rows[0].snapshot.title,
      response.snapshot.title,
    );
    await identity(db, ids.a);
    assert.equal((await db.query('select * from controls')).rows.length, 51);
    await db.query(`update assessments set status='IN_PROGRESS' where id=$1`, [assessment]);
    await db.query(`update assessment_controls set status='CONFORM' where assessment_id=$1`, [
      assessment,
    ]);
    await db.query(`update assessments set status='COMPLETED' where id=$1`, [assessment]);
    const completed = (
      await db.query<{ completed_at: string }>(`select completed_at from assessments where id=$1`, [
        assessment,
      ])
    ).rows[0].completed_at;
    assert.ok(completed);
    await assert.rejects(
      db.query(`update assessment_controls set status='PENDING' where id=$1`, [response.id]),
    );
    await db.query(`update assessments set status='IN_PROGRESS' where id=$1`, [assessment]);
    assert.equal(
      (
        await db.query<{ completed_at: null }>(`select completed_at from assessments where id=$1`, [
          assessment,
        ])
      ).rows[0].completed_at,
      null,
    );
    await db.query(`update assessment_controls set status='NON_CONFORM' where id=$1`, [
      response.id,
    ]);
    const { rows: token } = await db.query<{ token: string }>(
      `select invite_client($1,'client@example.test') token`,
      [a],
    );
    await identity(db, ids.client);
    await db.query(`select accept_invitation($1)`, [token[0].token]);
    assert.equal((await db.query('select * from assessments')).rows.length, 1);
    assert.equal(
      (
        await db.query(`update assessment_controls set status='CONFORM' where id=$1 returning id`, [
          response.id,
        ])
      ).rows.length,
      0,
      'cliente solo consulta',
    );
    assert.equal(
      (
        await db.query(`update assessments set status='COMPLETED' where id=$1 returning id`, [
          assessment,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(db.query(`select create_assessment($1,'Intrusión','')`, [a]));
    const beforeComment = (
      await db.query<{ evaluated_by: string; evaluated_at: string; status: string }>(
        `select evaluated_by,evaluated_at,status from assessment_controls where id=$1`,
        [response.id],
      )
    ).rows[0];
    await db.query(`select update_client_comment($1,'Comentario cliente')`, [response.id]);
    const afterComment = (
      await db.query<{
        evaluated_by: string;
        evaluated_at: string;
        status: string;
        client_comment: string;
      }>(
        `select evaluated_by,evaluated_at,status,client_comment from assessment_controls where id=$1`,
        [response.id],
      )
    ).rows[0];
    assert.equal(afterComment.client_comment, 'Comentario cliente');
    assert.equal(afterComment.evaluated_by, beforeComment.evaluated_by);
    assert.deepEqual(afterComment.evaluated_at, beforeComment.evaluated_at);
    assert.equal(afterComment.status, beforeComment.status);
    await identity(db, ids.b);
    await assert.rejects(db.query(`select update_client_comment($1,'Intrusión')`, [response.id]));
    assert.equal(
      (await db.query(`select * from assessment_controls where id=$1`, [response.id])).rows.length,
      0,
    );
    await assert.rejects(db.query(`select create_assessment($1,'Intrusión','')`, [a]));
    assert.equal(
      (
        await db.query(`update assessment_controls set status='CONFORM' where id=$1 returning id`, [
          response.id,
        ])
      ).rows.length,
      0,
    );
    await identity(db, ids.a);
    await assert.rejects(
      db.query(`delete from organizations where id=$1`, [a]),
      'conserva historial',
    );
    await identity(db, ids.admin);
    await db.exec(`update controls set active=false;`);
    await identity(db, ids.a);
    const before = (await db.query(`select * from assessments`)).rows.length;
    await assert.rejects(db.query(`select create_assessment($1,'Catálogo vacío','')`, [a]));
    assert.equal((await db.query(`select * from assessments`)).rows.length, before);
    await identity(db, '', 'anon');
    await assert.rejects(db.query('select * from assessments'));
    await assert.rejects(db.query('select * from controls'));
  } finally {
    await db.close();
  }
});
