import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { database, identity, ids, users, org } from './db-helper';
import { deletionHandler } from '../supabase/functions/admin-delete-organization/handler';

test('Organizaciones: CRUD administrativo, borrado completo, bloqueo, reintento y aislamiento', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    await assert.rejects(
      db.query('select create_organization(\'{"legal_name":"Intrusión","rut":"76123456-0"}\')'),
    );
    const a = await org(db, 'Organización eliminable', '76123456-0');
    const untouched = await org(db, 'Organización conservada', '76234567-6');
    assert.equal(
      (
        await db.query(
          "update organizations set legal_name='No autorizado' where id=$1 returning id",
          [a],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(db.query('delete from organizations where id=$1', [a]));
    await assert.rejects(
      db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [a]),
    );
    await identity(db, ids.client);
    await assert.rejects(
      db.query('select create_organization(\'{"legal_name":"Intrusión","rut":"76345678-1"}\')'),
    );
    await identity(db, ids.admin);
    await db.query("update organizations set legal_name='Nombre modificado' where id=$1", [a]);
    await assert.rejects(db.query('select finish_organization_deletion($1)', [a]));
    await assert.rejects(db.query("select prepare_organization_deletion($1,'')", [a]));
    await identity(db, ids.a);
    const scalar = async (sql: string, args: unknown[]) =>
      (await db.query<{ id: string }>(sql, args)).rows[0].id;
    const assessment = await scalar("select create_assessment($1,'Evaluación de borrado') id", [a]);
    const control = await scalar(
      'select id from assessment_controls where assessment_id=$1 limit 1',
      [assessment],
    );
    const finding = await scalar(
      "insert into findings(organization_id,assessment_id,control_id,title,description) values($1,$2,$3,'Hallazgo de borrado','Descripción') returning id",
      [a, assessment, control],
    );
    const task = await scalar(
      "insert into tasks(organization_id,finding_id,title) values($1,$2,'Tarea de borrado') returning id",
      [a, finding],
    );
    await db.query(
      "insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Tratamiento','Gestionar clientes',array['CLIENTS'],array['CONTACT'])",
      [a],
    );
    await db.query("select invite_client($1,'client@example.test')", [a]);
    let previous: string | null = null;
    for (let version = 0; version < 2; version++) {
      const id = randomUUID(),
        path = `${a}/${id}/file`;
      await db.query(
        "insert into evidence(id,organization_id,control_id,finding_id,task_id,previous_evidence_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,$5,$6,$7,'prueba.txt','text/plain',5,'Evidencia de borrado')",
        [id, a, control, finding, task, previous, path],
      );
      await db.query(
        'insert into storage.objects(bucket_id,name,metadata) values(\'evidence\',$1,\'{"size":5,"mimetype":"text/plain"}\')',
        [path],
      );
      await db.query('select finalize_evidence($1)', [id]);
      await db.query(
        "insert into comments(organization_id,evidence_id,body) values($1,$2,'Comentario de borrado')",
        [a, id],
      );
      await db.query(
        "update evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Corregir documento' where id=$1",
        [id],
      );
      previous = id;
    }
    await identity(db, ids.admin);
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [a]);
    // Direct finalization cannot bypass Storage API removal.
    await assert.rejects(db.query('select finish_organization_deletion($1)', [a]));
    assert.equal((await db.query('select * from organizations where id=$1', [a])).rows.length, 1);
    await assert.rejects(
      db.query("update organizations set legal_name='Mutación bloqueada' where id=$1", [a]),
    );
    await identity(db, ids.a);
    await assert.rejects(
      db.query(
        "insert into comments(organization_id,finding_id,body) values($1,$2,'Comentario tardío')",
        [a, finding],
      ),
    );
    const late = randomUUID();
    await assert.rejects(
      db.query(
        "insert into evidence(id,organization_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,'nuevo.txt','text/plain',5,'Archivo tardío')",
        [late, a, `${a}/${late}/file`],
      ),
    );
    await identity(db, ids.admin);
    // Retrying preparation is safe after a Storage failure.
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [a]);
    const paths = (
      await db.query<{ paths: string[] }>('select organization_deletion_files($1) paths', [a])
    ).rows[0].paths;
    assert.equal(paths.length, 2);
    // Isolated Storage service adapter, not a production SQL deletion of blobs.
    await db.exec('reset role');
    for (const path of paths) await db.query('delete from storage.objects where name=$1', [path]);
    await identity(db, ids.admin);
    await db.query('select finish_organization_deletion($1)', [a]);
    for (const table of [
      'organization_members',
      'organization_invitations',
      'assessments',
      'assessment_controls',
      'processing_activities',
      'findings',
      'tasks',
      'evidence',
      'comments',
      'notifications',
      'audit_logs',
    ]) {
      assert.equal(
        (await db.query(`select organization_id from ${table} where organization_id=$1`, [a])).rows
          .length,
        0,
        table,
      );
    }
    assert.equal((await db.query('select * from organizations where id=$1', [a])).rows.length, 0);
    assert.equal(
      (await db.query('select * from organizations where id=$1', [untouched])).rows.length,
      1,
    );
    assert.equal(
      (await db.query('select * from audit_logs where organization_ref=$1', [a])).rows.length,
      0,
    );
    assert.equal((await db.query('select * from profiles')).rows.length, 5);
    assert.equal((await db.query('select * from controls')).rows.length, 52);
    await db.exec('reset role');
    assert.equal((await db.query('select * from private.organization_deletions')).rows.length, 0);
  } finally {
    await db.close();
  }
});

test('Borrado Functions: sesión, permisos, confirmación, errores Storage y orden de limpieza', async () => {
  const org = randomUUID();
  const events: string[] = [];
  let role = 'CONSULTANT',
    fail = false,
    batch = [`${org}/${randomUUID()}/file`];
  const handler = deletionHandler({
    async authorize() {
      return { role };
    },
    async prepare() {
      events.push('prepare');
    },
    async files() {
      return batch;
    },
    async remove() {
      events.push('storage');
      if (fail) throw new Error('SECRET');
      batch = [];
    },
    async finish() {
      events.push('database');
    },
  });
  const request = (token = 'token', confirmation = 'ELIMINAR ORGANIZACION') =>
    new Request('http://local', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ org, confirmation }),
    });
  assert.equal((await handler(request(''))).status, 401);
  assert.equal((await handler(request())).status, 403);
  role = 'SUPER_ADMIN';
  assert.equal((await handler(request('token', ''))).status, 400);
  assert.deepEqual(events, []);
  fail = true;
  const failure = await handler(request());
  assert.equal(failure.status, 409);
  assert.ok(!(await failure.text()).includes('SECRET'));
  assert.deepEqual(events, ['prepare', 'storage']);
  fail = false;
  assert.equal((await handler(request())).status, 200);
  assert.deepEqual(events, ['prepare', 'storage', 'prepare', 'storage', 'database']);
});
