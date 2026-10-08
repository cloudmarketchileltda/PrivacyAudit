import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';
import {
  uploadSchema,
  reviewSchema,
  commentSchema,
  MAX_FILE_SIZE,
} from '../src/features/evidence/schemas';
test('Fase 5: archivos privados, versiones, revisión y comentarios con aislamiento', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    const assessment = (
      await db.query<{ id: string }>(`select create_assessment($1,'Evaluación') id`, [a])
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
    const ab = (
      await db.query<{ id: string }>(`select create_assessment($1,'Otra evaluación') id`, [b])
    ).rows[0].id;
    const cb = (
      await db.query<{ id: string }>(
        `select id from assessment_controls where assessment_id=$1 limit 1`,
        [ab],
      )
    ).rows[0].id;
    await identity(db, ids.a);
    const f = (
      await db.query<{ id: string }>(
        `insert into findings(organization_id,assessment_id,control_id,title,description) values($1,$2,$3,'Retención','Faltan plazos') returning id`,
        [a, assessment, control],
      )
    ).rows[0].id;
    const task = (
      await db.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Política',$3) returning id`,
        [a, f, ids.client],
      )
    ).rows[0].id;
    const hidden = (
      await db.query<{ id: string }>(
        `insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Privada',$3) returning id`,
        [a, f, ids.a],
      )
    ).rows[0].id;
    async function reserve(
      options: {
        org?: string;
        control?: string;
        finding?: string;
        task?: string;
        previous?: string;
        path?: string;
        size?: number;
        mime?: string;
      } = {},
    ) {
      const id = randomUUID(),
        organization = options.org || a;
      const path = options.path || `${organization}/${id}/file`;
      const result = await db.query<{ id: string; uploaded_by: string }>(
        `insert into evidence(id,organization_id,control_id,finding_id,task_id,previous_evidence_id,file_path,original_filename,mime_type,file_size,description,uploaded_by) values($1,$2,$3,$4,$5,$6,$7,'Retencion.pdf',$8,$9,'Política documentada',$10) returning id,uploaded_by`,
        [
          id,
          organization,
          options.control || null,
          options.finding || null,
          options.task || null,
          options.previous || null,
          path,
          options.mime || 'application/pdf',
          options.size || 12,
          ids.b,
        ],
      );
      return { ...result.rows[0], path };
    }
    async function upload(path: string, size = 12, mime = 'application/pdf') {
      await db.query(
        `insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,$2::jsonb)`,
        [path, JSON.stringify({ size, mimetype: mime })],
      );
    }
    await identity(db, ids.client);
    await assert.rejects(reserve({ task: hidden }));
    await assert.rejects(reserve({ control: cb }));
    await assert.rejects(reserve({ org: b }));
    await assert.rejects(reserve({ path: `${b}/${randomUUID()}/file` }));
    await assert.rejects(reserve({ size: MAX_FILE_SIZE + 1 }));
    await assert.rejects(reserve({ mime: 'text/html' }));
    const initial = await reserve({ control, finding: f, task });
    assert.equal(initial.uploaded_by, ids.client);
    await assert.rejects(db.query(`select finalize_evidence($1)`, [initial.id]));
    await assert.rejects(upload(`${a}/${randomUUID()}/file`));
    await upload(initial.path, 13);
    await assert.rejects(db.query(`select finalize_evidence($1)`, [initial.id]));
    await db.query(`delete from storage.objects where name=$1`, [initial.path]);
    await upload(initial.path);
    await assert.rejects(
      db.query(`update evidence set uploaded_at=now() where id=$1`, [initial.id]),
    );
    await db.query(`select finalize_evidence($1)`, [initial.id]);
    await db.query(`select record_evidence_download($1)`, [initial.id]);
    assert.equal(
      (await db.query(`select * from audit_logs where action='DOWNLOAD'`)).rows.length,
      1,
    );
    await db.query(`select finalize_evidence($1)`, [initial.id]);
    await db.query(`select record_evidence_download($1)`, [initial.id]);
    assert.equal(
      (await db.query(`select * from audit_logs where action='DOWNLOAD'`)).rows.length,
      2,
    );
    assert.equal(
      (
        await db.query(`update storage.objects set metadata='{}' where name=$1 returning id`, [
          initial.path,
        ])
      ).rows.length,
      0,
    );
    assert.equal(
      (await db.query(`delete from storage.objects where name=$1 returning id`, [initial.path]))
        .rows.length,
      0,
    );
    assert.equal(
      (await db.query(`delete from evidence where id=$1 returning id`, [initial.id])).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(`update evidence set review_status='ACCEPTED' where id=$1 returning id`, [
          initial.id,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(`update evidence set file_path='hack' where id=$1`, [initial.id]),
    );
    await db.query(
      `insert into comments(organization_id,evidence_id,body,created_by) values($1,$2,'Adjunto la política',$3)`,
      [a, initial.id, ids.b],
    );
    assert.equal(
      (await db.query<{ created_by: string }>(`select created_by from comments`)).rows[0]
        .created_by,
      ids.client,
    );
    await assert.rejects(
      db.query(`insert into comments(organization_id,task_id,body) values($1,$2,'Intrusión')`, [
        a,
        hidden,
      ]),
    );
    await assert.rejects(
      db.query(
        `insert into comments(organization_id,task_id,evidence_id,body) values($1,$2,$3,'Dos relaciones')`,
        [a, task, initial.id],
      ),
    );
    await assert.rejects(db.query(`update comments set body='Cambio'`));
    await assert.rejects(db.query(`delete from comments`));
    await identity(db, ids.b);
    for (const table of ['evidence', 'comments', 'storage.objects'])
      assert.equal((await db.query(`select * from ${table}`)).rows.length, 0);
    await assert.rejects(upload(initial.path));
    await assert.rejects(db.query(`select finalize_evidence($1)`, [initial.id]));
    assert.equal(
      (await db.query(`update evidence set review_status='ACCEPTED' returning id`)).rows.length,
      0,
    );
    await assert.rejects(
      db.query(`insert into comments(organization_id,evidence_id,body) values($1,$2,'Intrusión')`, [
        a,
        initial.id,
      ]),
    );
    await identity(db, ids.a);
    assert.equal(
      (await db.query(`select * from notifications where event_type='EVIDENCE_UPLOADED'`)).rows
        .length,
      1,
    );
    await assert.rejects(
      db.query(`update evidence set review_status='CHANGES_REQUESTED' where id=$1`, [initial.id]),
    );
    await db.query(
      `update evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Agregar responsable' where id=$1`,
      [initial.id],
    );
    const reviewed = (
      await db.query<{ reviewed_by: string; reviewed_at: string }>(
        `select reviewed_by,reviewed_at from evidence where id=$1`,
        [initial.id],
      )
    ).rows[0];
    assert.equal(reviewed.reviewed_by, ids.a);
    assert.ok(reviewed.reviewed_at);
    await assert.rejects(
      db.query(`update evidence set review_status='ACCEPTED' where id=$1`, [initial.id]),
    );
    await identity(db, ids.client);
    await assert.rejects(reserve({ previous: initial.id }));
    assert.equal(
      (await db.query(`select * from notifications where event_type='EVIDENCE_CHANGES_REQUESTED'`))
        .rows.length,
      1,
    );
    const corrected = await reserve({ control, finding: f, task, previous: initial.id });
    await assert.rejects(reserve({ control, finding: f, task, previous: initial.id }));
    await upload(corrected.path);
    await db.query(`select finalize_evidence($1)`, [corrected.id]);
    await db.query(
      `insert into comments(organization_id,task_id,body) values($1,$2,'Nueva entrega enviada')`,
      [a, task],
    );
    await db.query(
      `insert into comments(organization_id,finding_id,body) values($1,$2,'Revisar corrección')`,
      [a, f],
    );
    assert.equal(
      (
        await db.query(
          `select * from audit_logs where entity_type='evidence' and action<>'DOWNLOAD'`,
        )
      ).rows.length,
      3,
    );
    await db.query(`select submit_task($1,'WAITING_REVIEW')`, [task]);
    await identity(db, ids.a);
    await assert.rejects(db.query(`update tasks set status='DONE' where id=$1`, [task]));
    await db.query(`update evidence set review_status='ACCEPTED' where id=$1`, [corrected.id]);
    await db.exec('reset role');
    assert.equal(
      (
        await db.query(
          `select * from notifications where recipient_id=$1 and event_type='EVIDENCE_ACCEPTED'`,
          [ids.client],
        )
      ).rows.length,
      1,
    );
    await identity(db, ids.a);
    await db.query(`update tasks set status='DONE' where id=$1`, [task]);
    await assert.rejects(reserve({ task }));
    await db.query(`update tasks set status='WAITING_REVIEW' where id=$1`, [hidden]);
    await db.query(`update tasks set status='DONE' where id=$1`, [hidden]);
    await db.query(`update findings set status='CLOSED',closure_note='Revisado' where id=$1`, [f]);
    await assert.rejects(reserve({ finding: f }));
    const pending = await reserve();
    await upload(pending.path);
    assert.equal(
      (await db.query(`delete from evidence where id=$1 returning id`, [pending.id])).rows.length,
      0,
    );
    await db.query(`delete from storage.objects where name=$1`, [pending.path]);
    await db.query(`delete from evidence where id=$1`, [pending.id]);
    const archivePending = await reserve();
    await upload(archivePending.path);
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ARCHIVED' where id=$1`, [a]);
    await identity(db, ids.a);
    await assert.rejects(db.query(`select finalize_evidence($1)`, [archivePending.id]));
    await assert.rejects(
      db.query(`insert into comments(organization_id,finding_id,body) values($1,$2,'Archivada')`, [
        a,
        f,
      ]),
    );
    assert.ok((await db.query(`select * from storage.objects`)).rows.length > 0);
    await identity(db, ids.admin);
    await db.query(`update organizations set status='ACTIVE' where id=$1`, [a]);
    await identity(db, ids.a);
    await db.query(`select manage_member($1,$2,null)`, [a, ids.client]);
    await identity(db, ids.client);
    for (const table of ['evidence', 'comments', 'storage.objects'])
      assert.equal((await db.query(`select * from ${table}`)).rows.length, 0);
    await identity(db, ids.admin);
    assert.ok((await db.query(`select * from evidence`)).rows.length > 0);
    await assert.rejects(db.query(`update audit_logs set action='FAKE'`));
    await identity(db, '', 'anon');
    for (const table of ['evidence', 'comments', 'audit_logs'])
      await assert.rejects(db.query(`select * from ${table}`));
  } finally {
    await db.close();
  }
});
test('Fase 5: validación de archivos, observaciones y comentarios', () => {
  const valid = {
    organization_id: ids.a,
    description: 'Documento',
    original_filename: 'politica.pdf',
    mime_type: 'application/pdf',
    file_size: 12,
  };
  assert.ok(uploadSchema.safeParse(valid).success);
  for (const change of [
    { file_size: 0 },
    { file_size: MAX_FILE_SIZE + 1 },
    { mime_type: 'text/html' },
    { original_filename: '../politica.pdf' },
    { organization_id: 'invalid' },
    { description: '' },
  ])
    assert.equal(uploadSchema.safeParse({ ...valid, ...change }).success, false);
  assert.equal(
    reviewSchema.safeParse({ id: ids.a, review_status: 'CHANGES_REQUESTED', reviewer_comment: '' })
      .success,
    false,
  );
  assert.equal(
    reviewSchema.safeParse({ id: ids.a, review_status: 'ACCEPTED', reviewer_comment: '' }).success,
    true,
  );
  assert.equal(
    commentSchema.safeParse({ organization_id: ids.a, kind: 'task', item: ids.b, body: ' ' })
      .success,
    false,
  );
});
