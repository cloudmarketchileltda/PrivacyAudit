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
    assert.equal(
      (await db.query('select * from controls')).rows.length,
      0,
      'El catálogo es administrativo; las evaluaciones usan sus snapshots.',
    );
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

test('Fase 3: tratamientos, validación SQL, identidad, archivo y aislamiento', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    const create = (organization: string, name = 'Gestión de clientes') =>
      db.query<{ id: string; created_by: string }>(
        `insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories,created_by,created_at) values($1,$2,'Administrar relaciones comerciales',array['CLIENTS'],array['CONTACT'],$3,'2000-01-01') returning id,created_by`,
        [organization, name, ids.admin],
      );
    const activityB = (await create(b)).rows[0].id;
    await identity(db, ids.a);
    const activityA = (await create(a)).rows[0];
    assert.equal(activityA.created_by, ids.a, 'autor proviene de auth.uid, no del payload');
    assert.equal(
      (await db.query(`select * from processing_activities where created_at='2000-01-01'`)).rows
        .length,
      0,
    );
    await db.query(
      `update processing_activities set area='Comercial',owner='Responsable de ventas',status='ACTIVE',legal_basis='OTHER',legal_basis_details='Pendiente de revisión jurídica',international_transfer='YES',international_transfer_details='Proveedor en otro país' where id=$1`,
      [activityA.id],
    );
    await assert.rejects(
      db.query(`update processing_activities set international_transfer_details='' where id=$1`, [
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(`update processing_activities set legal_basis_details='' where id=$1`, [
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(
        `update processing_activities set data_subject_categories=array['INVALID'] where id=$1`,
        [activityA.id],
      ),
    );
    await assert.rejects(
      db.query(
        `update processing_activities set personal_data_categories=array[]::text[] where id=$1`,
        [activityA.id],
      ),
    );
    await assert.rejects(
      db.query(
        `update processing_activities set personal_data_categories=array[null]::text[] where id=$1`,
        [activityA.id],
      ),
    );
    await assert.rejects(
      db.query(`update processing_activities set notes=repeat('x',10001) where id=$1`, [
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(`update processing_activities set organization_id=$1 where id=$2`, [
        b,
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(`update processing_activities set created_by=$1 where id=$2`, [
        ids.admin,
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(`update processing_activities set id=gen_random_uuid() where id=$1`, [activityA.id]),
    );
    await assert.rejects(
      db.query(`update processing_activities set created_at=now()-interval '1 day' where id=$1`, [
        activityA.id,
      ]),
    );
    await assert.rejects(
      db.query(`delete from organizations where id=$1`, [a]),
      'FK conserva registros',
    );
    await db.query(`update processing_activities set status='ARCHIVED' where id=$1`, [
      activityA.id,
    ]);
    assert.equal(
      (await db.query(`select * from processing_activities where status='ARCHIVED'`)).rows.length,
      1,
    );
    await db.query(`update processing_activities set status='ACTIVE' where id=$1`, [activityA.id]);
    const token = (
      await db.query<{ token: string }>(`select invite_client($1,'client@example.test') token`, [a])
    ).rows[0].token;
    await identity(db, ids.client);
    await db.query(`select accept_invitation($1)`, [token]);
    assert.equal((await db.query(`select * from processing_activities`)).rows.length, 1);
    assert.equal(
      (await db.query(`select * from processing_activities where id=$1`, [activityB])).rows.length,
      0,
    );
    await assert.rejects(create(a, 'Creación por cliente'));
    assert.equal(
      (
        await db.query(
          `update processing_activities set name='Intrusión' where id=$1 returning id`,
          [activityA.id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query(`delete from processing_activities where id=$1 returning id`, [activityA.id]))
        .rows.length,
      0,
    );
    await identity(db, ids.b);
    assert.equal(
      (await db.query(`select * from processing_activities where id=$1`, [activityA.id])).rows
        .length,
      0,
    );
    await assert.rejects(create(a, 'Creación por otro consultor'));
    assert.equal(
      (
        await db.query(
          `update processing_activities set name='Intrusión' where id=$1 returning id`,
          [activityA.id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query(`delete from processing_activities where id=$1 returning id`, [activityA.id]))
        .rows.length,
      0,
    );
    await identity(db, ids.admin);
    assert.equal((await db.query(`select * from processing_activities`)).rows.length, 2);
    const temporary = (await create(a, 'Registro temporal por administrador')).rows[0];
    assert.equal(temporary.created_by, ids.admin);
    assert.equal(
      (await db.query(`delete from processing_activities where id=$1 returning id`, [temporary.id]))
        .rows.length,
      1,
    );
    await identity(db, ids.a);
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ARCHIVED' where id=$1`, [a]);
    await identity(db, ids.a);
    await assert.rejects(create(a));
    assert.equal(
      (
        await db.query(
          `update processing_activities set name='Edición archivada' where id=$1 returning id`,
          [activityA.id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query(`delete from processing_activities where id=$1 returning id`, [activityA.id]))
        .rows.length,
      0,
    );
    await identity(db, ids.client);
    assert.equal(
      (await db.query(`select * from processing_activities where id=$1`, [activityA.id])).rows
        .length,
      1,
      'consulta del archivo',
    );
    await identity(db, ids.a);
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ACTIVE' where id=$1`, [a]);
    await identity(db, ids.a);
    await db.query(`select manage_member($1,$2,null)`, [a, ids.client]);
    await identity(db, ids.client);
    assert.equal(
      (await db.query(`select * from processing_activities`)).rows.length,
      0,
      'retirar membresía retira lectura',
    );
    await identity(db, ids.a);
    assert.equal(
      (await db.query(`delete from processing_activities where id=$1 returning id`, [activityA.id]))
        .rows.length,
      1,
    );
    await identity(db, '', 'anon');
    await assert.rejects(db.query(`select * from processing_activities`));
    await assert.rejects(create(b));
  } finally {
    await db.close();
  }
});
