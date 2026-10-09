import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { database, identity, ids, users, org } from './db-helper';
import { assessmentDeletionHandler } from '../supabase/functions/assessment-delete/handler';
import { assessmentDeletionConfirmation } from '../supabase/functions/_shared/assessment-deletion';

test('Evaluaciones: permisos, edición, borrado integral acotado, archivos, bloqueo y reintento', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.admin);
    await db.exec(
      "insert into controls(code,title,category) values('DELETE-1','Control de borrado','Prueba');",
    );
    await identity(db, ids.a);
    const organization = await org(db, 'Empresa de evaluaciones', '76123456-0');
    await identity(db, ids.admin);
    await db.query("select manage_member($1,$2,'CLIENT')", [organization, ids.client]);
    await identity(db, ids.a);
    const scalar = async (sql: string, args: unknown[] = []) =>
      (await db.query<{ id: string }>(sql, args)).rows[0].id;
    const assessment = await scalar("select create_assessment($1,'Evaluación original') id", [
      organization,
    ]);
    const other = await scalar("select create_assessment($1,'Evaluación conservada') id", [
      organization,
    ]);
    const control = await scalar('select id from assessment_controls where assessment_id=$1', [
      assessment,
    ]);
    const otherControl = await scalar('select id from assessment_controls where assessment_id=$1', [
      other,
    ]);
    await db.query(
      "update assessments set name='Nombre modificado',description='Alcance editado',status='IN_PROGRESS' where id=$1",
      [assessment],
    );
    assert.equal(
      (await db.query<{ name: string }>('select name from assessments where id=$1', [assessment]))
        .rows[0].name,
      'Nombre modificado',
    );
    await assert.rejects(
      db.query("update assessments set status='COMPLETED' where id=$1", [assessment]),
    );
    const finding = await scalar(
      "insert into findings(organization_id,assessment_id,control_id,title,description,assigned_to) values($1,$2,$3,'Hallazgo','Descripción',$4) returning id",
      [organization, assessment, control, ids.client],
    );
    const task = await scalar(
      "insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Tarea',$3) returning id",
      [organization, finding, ids.client],
    );
    const otherFinding = await scalar(
      "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Hallazgo conservado','Descripción') returning id",
      [organization, other],
    );
    const otherTask = await scalar(
      "insert into tasks(organization_id,finding_id,title) values($1,$2,'Tarea conservada') returning id",
      [organization, otherFinding],
    );
    const evidenceIds: string[] = [],
      paths: string[] = [];
    async function evidence(
      options: {
        control?: string;
        finding?: string;
        task?: string;
        previous?: string;
        upload?: boolean;
      } = {},
    ) {
      const id = randomUUID(),
        path = `${organization}/${id}/file`;
      await db.query(
        "insert into evidence(id,organization_id,control_id,finding_id,task_id,previous_evidence_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,$5,$6,$7,'prueba.txt','text/plain',5,'Evidencia de prueba')",
        [
          id,
          organization,
          options.control ?? null,
          options.finding ?? null,
          options.task ?? null,
          options.previous ?? null,
          path,
        ],
      );
      if (options.upload !== false) {
        await db.query(
          'insert into storage.objects(bucket_id,name,metadata) values(\'evidence\',$1,\'{"size":5,"mimetype":"text/plain"}\')',
          [path],
        );
        await db.query('select finalize_evidence($1)', [id]);
      }
      return { id, path };
    }
    let previous: string | undefined;
    for (let version = 0; version < 2; version++) {
      const e = await evidence({ control, finding, task, previous });
      evidenceIds.push(e.id);
      paths.push(e.path);
      await db.query(
        "update evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Completar documento' where id=$1",
        [e.id],
      );
      await db.query(
        "insert into comments(organization_id,evidence_id,body) values($1,$2,'Comentario de evidencia')",
        [organization, e.id],
      );
      previous = e.id;
    }
    for (const options of [{ control }, { finding }, { task }]) {
      const e = await evidence(options);
      evidenceIds.push(e.id);
      paths.push(e.path);
    }
    const reserved = await evidence({ control, upload: false });
    evidenceIds.push(reserved.id);
    const general = await evidence();
    const otherEvidence = await evidence({ control: otherControl });
    await db.query(
      "insert into comments(organization_id,finding_id,body) values($1,$2,'Comentario hallazgo')",
      [organization, finding],
    );
    await db.query(
      "insert into comments(organization_id,task_id,body) values($1,$2,'Comentario tarea')",
      [organization, task],
    );
    await db.query(
      "insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Tratamiento compartido','Gestionar clientes',array['CLIENTS'],array['CONTACT'])",
      [organization],
    );
    const report = await scalar(
      "select create_report($1,'Informe relacionado','Resumen de la evaluación','Alcance de la evaluación','Conclusiones profesionales') id",
      [assessment],
    );
    const otherReport = await scalar(
      "select create_report($1,'Informe conservado','Resumen de la evaluación','Alcance de la evaluación','Conclusiones profesionales') id",
      [other],
    );
    await db.query(
      "update findings set status='ACCEPTED_RISK',closure_note='Se acepta el riesgo para probar eliminación íntegra' where id=$1",
      [finding],
    );
    await db.query("update assessment_controls set status='CONFORM' where assessment_id=$1", [
      assessment,
    ]);
    await db.query("update assessments set status='COMPLETED' where id=$1", [assessment]);
    // Current membership, never consultant_id ownership, authorizes both operations.
    for (const actor of [ids.client, ids.b]) {
      await identity(db, actor);
      assert.equal(
        (
          await db.query("update assessments set name='Intrusión' where id=$1 returning id", [
            assessment,
          ])
        ).rows.length,
        0,
      );
      await assert.rejects(
        db.query('select prepare_assessment_deletion($1,$2)', [
          assessment,
          assessmentDeletionConfirmation,
        ]),
      );
      await assert.rejects(db.query('select assessment_deletion_files($1)', [assessment]));
      await assert.rejects(db.query('select finish_assessment_deletion($1)', [assessment]));
    }
    await identity(db, ids.a, 'anon');
    await assert.rejects(
      db.query('select prepare_assessment_deletion($1,$2)', [
        assessment,
        assessmentDeletionConfirmation,
      ]),
    );
    await identity(db, ids.a);
    await assert.rejects(db.query('delete from assessments where id=$1', [assessment]));
    await assert.rejects(db.query('select prepare_assessment_deletion($1,$2)', [assessment, '']));
    await assert.rejects(db.query('select finish_assessment_deletion($1)', [assessment]));
    // A second assigned consultant may delete an assessment authored by someone else.
    await identity(db, ids.admin);
    await db.query("select manage_member($1,$2,'CONSULTANT')", [organization, ids.b]);
    await identity(db, ids.b);
    await db.query('select prepare_assessment_deletion($1,$2)', [
      assessment,
      assessmentDeletionConfirmation,
    ]);
    await db.query('select prepare_assessment_deletion($1,$2)', [
      assessment,
      assessmentDeletionConfirmation,
    ]);
    assert.equal(
      (
        await db.query<{ deletion_pending: boolean }>(
          'select deletion_pending from assessments where id=$1',
          [assessment],
        )
      ).rows[0].deletion_pending,
      true,
    );
    assert.deepEqual(
      (
        await db.query<{ paths: string[] }>('select assessment_deletion_files($1) paths', [
          assessment,
        ])
      ).rows[0].paths.sort(),
      paths.sort(),
    );
    await assert.rejects(db.query('select finish_assessment_deletion($1)', [assessment]));
    await assert.rejects(
      db.query("update assessments set name='Cambio tardío' where id=$1", [assessment]),
    );
    await assert.rejects(
      db.query("update assessment_controls set status='PENDING' where id=$1", [control]),
    );
    await assert.rejects(
      db.query(
        "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Tardío','Descripción')",
        [organization, assessment],
      ),
    );
    await assert.rejects(
      db.query("insert into comments(organization_id,finding_id,body) values($1,$2,'Tardío')", [
        organization,
        finding,
      ]),
    );
    await assert.rejects(
      db.query("insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,'{}')", [
        reserved.path,
      ]),
    );
    await assert.rejects(
      db.query(
        "select create_report($1,'Informe tardío','Resumen de la evaluación','Alcance de la evaluación','Conclusiones profesionales')",
        [assessment],
      ),
    );
    await db.query("update assessments set description='Otra evaluación editable' where id=$1", [
      other,
    ]);
    await identity(db, ids.admin);
    await db.query('select manage_member($1,$2,null)', [organization, ids.b]);
    await identity(db, ids.b);
    await assert.rejects(db.query('select assessment_deletion_files($1)', [assessment]));
    await assert.rejects(db.query('select finish_assessment_deletion($1)', [assessment]));
    await identity(db, ids.a);
    // Simulate Storage API success after a failure; SQL cannot finalize while a single blob remains.
    await db.exec('reset role');
    await db.query('delete from storage.objects where name=$1', [paths[0]]);
    await identity(db, ids.a);
    await assert.rejects(db.query('select finish_assessment_deletion($1)', [assessment]));
    await db.exec('reset role');
    await db.query('delete from storage.objects where name=any($1::text[])', [paths]);
    await identity(db, ids.a);
    await db.query('select finish_assessment_deletion($1)', [assessment]);
    await identity(db, ids.admin);
    for (const [table, predicate, args] of [
      ['assessments', 'id=$1', [assessment]],
      ['assessment_controls', 'assessment_id=$1', [assessment]],
      ['findings', 'assessment_id=$1', [assessment]],
      ['tasks', 'finding_id=$1', [finding]],
      ['evidence', 'id=any($1::uuid[])', [evidenceIds]],
      [
        'comments',
        'finding_id=$1 or task_id=$2 or evidence_id=any($3::uuid[])',
        [finding, task, evidenceIds],
      ],
      [
        'notifications',
        'finding_id=$1 or task_id=$2 or evidence_id=any($3::uuid[])',
        [finding, task, evidenceIds],
      ],
      ['reports', 'id=$1', [report]],
    ] as const)
      assert.equal(
        (await db.query(`select id from ${table} where ${predicate}`, [...args])).rows.length,
        0,
        table,
      );
    const removedIds = [assessment, control, finding, task, report, ...evidenceIds];
    assert.equal(
      (
        await db.query(
          'select id from audit_logs where entity_id=any($1::uuid[]) or exists(select 1 from unnest($1::uuid[]) x where position(x::text in metadata::text)>0)',
          [removedIds],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select id from audit_logs where action='ASSESSMENT_DELETED' and actor_id=$1",
          [ids.a],
        )
      ).rows.length,
      1,
    );
    assert.equal(
      (await db.query('select id from assessments where id=$1', [other])).rows.length,
      1,
    );
    assert.equal((await db.query('select id from tasks where id=$1', [otherTask])).rows.length, 1);
    assert.equal(
      (
        await db.query('select id from evidence where id=any($1::uuid[])', [
          [general.id, otherEvidence.id],
        ])
      ).rows.length,
      2,
    );
    assert.equal(
      (await db.query('select id from reports where id=$1', [otherReport])).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query('select id from processing_activities where organization_id=$1', [
          organization,
        ])
      ).rows.length,
      1,
    );
    assert.equal((await db.query('select id from controls')).rows.length, 1);
    assert.equal((await db.query('select id from profiles')).rows.length, 5);
    const adminAssessment = await scalar(
      "select create_assessment($1,'Evaluación del administrador') id",
      [organization],
    );
    await db.query("update assessments set name='Editada por administrador' where id=$1", [
      adminAssessment,
    ]);
    await db.query('select prepare_assessment_deletion($1,$2)', [
      adminAssessment,
      assessmentDeletionConfirmation,
    ]);
    await db.query('select finish_assessment_deletion($1)', [adminAssessment]);
    assert.equal(
      (await db.query('select id from assessments where id=$1', [adminAssessment])).rows.length,
      0,
    );
    // Admin deletion and priority of whole-organization deletion over pending assessment deletion.
    await db.query('select prepare_assessment_deletion($1,$2)', [
      other,
      assessmentDeletionConfirmation,
    ]);
    await db.query("update organizations set status='ARCHIVED' where id=$1", [organization]);
    await assert.rejects(db.query("update assessments set name='Archivada' where id=$1", [other]));
    await assert.rejects(
      db.query('select prepare_assessment_deletion($1,$2)', [
        other,
        assessmentDeletionConfirmation,
      ]),
    );
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [
      organization,
    ]);
    await db.exec('reset role');
    await db.query('delete from storage.objects where name like $1', [`${organization}/%`]);
    await identity(db, ids.admin);
    await db.query('select finish_organization_deletion($1)', [organization]);
    assert.equal((await db.query('select id from assessments')).rows.length, 0);
  } finally {
    await db.close();
  }
});

test('Function de evaluaciones: sesión, rol, confirmación, límites, errores y orden Storage/SQL', async () => {
  let role = 'CONSULTANT',
    fail = false,
    paths = ['org/a'],
    listed = 0;
  const calls: string[] = [];
  const handler = assessmentDeletionHandler({
    async authorize() {
      return { role };
    },
    async prepare() {
      calls.push('prepare');
      return 'org';
    },
    async files() {
      calls.push('files');
      return listed++ === 0 ? paths : [];
    },
    async remove() {
      calls.push('remove');
      if (fail) throw new Error('Secret storage error');
    },
    async finish() {
      calls.push('finish');
    },
  });
  const request = (body: object, token = true) =>
    handler(
      new Request('https://function.test', {
        method: 'POST',
        headers: token ? { Authorization: 'Bearer session' } : {},
        body: JSON.stringify(body),
      }),
    );
  const input = { assessment: randomUUID(), confirmation: assessmentDeletionConfirmation };
  assert.equal((await request(input, false)).status, 401);
  role = 'CLIENT';
  assert.equal((await request(input)).status, 403);
  assert.equal(calls.length, 0);
  role = 'CONSULTANT';
  assert.equal((await request({ ...input, confirmation: '' })).status, 400);
  assert.equal((await request(input)).status, 200);
  assert.deepEqual(calls, ['prepare', 'files', 'remove', 'files', 'finish']);
  calls.length = 0;
  listed = 0;
  fail = true;
  const failed = await request(input);
  assert.equal(failed.status, 409);
  assert.doesNotMatch(await failed.text(), /Secret/);
  assert.ok(!calls.includes('finish'));
  calls.length = 0;
  listed = 0;
  fail = false;
  paths = ['other/unauthorized'];
  assert.equal((await request(input)).status, 409);
  assert.ok(!calls.includes('remove'));
  assert.ok(!calls.includes('finish'));
  calls.length = 0;
  listed = 0;
  paths = Array.from({ length: 101 }, (_, i) => `org/${i}`);
  assert.equal((await request(input)).status, 409);
  assert.ok(!calls.includes('remove'));
  calls.length = 0;
  listed = 0;
  paths = [];
  role = 'SUPER_ADMIN';
  assert.equal((await request(input)).status, 200);
  assert.deepEqual(calls, ['prepare', 'files', 'finish']);
});

test('Verificación SQL remota de evaluaciones: script ejecutable y sin fixtures residuales', async () => {
  const db = await database();
  try {
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await db.exec(await readFile('scripts/verify-assessment-deletion-remote.sql', 'utf8'));
    assert.equal((await db.query('select id from auth.users')).rows.length, 0);
    assert.equal((await db.query('select id from organizations')).rows.length, 0);
    assert.equal((await db.query('select id from assessments')).rows.length, 0);
  } finally {
    await db.close();
  }
});

test('Evaluaciones pendientes: avisos de vencimiento y marcar todos mantienen operativas otras evaluaciones', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.admin);
    await db.exec(
      "insert into controls(code,title,category) values('NOTIFY-1','Control de avisos','Prueba')",
    );
    await identity(db, ids.a);
    const organization = await org(db, 'Organización con avisos', '76123456-0');
    const assessments: string[] = [];
    const tasks: string[] = [];
    for (const title of ['Evaluación congelada', 'Evaluación operativa']) {
      const assessment = (
        await db.query<{ id: string }>('select create_assessment($1,$2) id', [organization, title])
      ).rows[0].id;
      assessments.push(assessment);
      const finding = (
        await db.query<{ id: string }>(
          "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Hallazgo','Descripción') returning id",
          [organization, assessment],
        )
      ).rows[0].id;
      tasks.push(
        (
          await db.query<{ id: string }>(
            "insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Tarea vencida',$3,'2020-01-01') returning id",
            [organization, finding, ids.a],
          )
        ).rows[0].id,
      );
    }
    await db.exec('reset role');
    await db.query(
      "select private.emit_notification($1,'TASK_ASSIGNED','Aviso anterior','Aviso anterior','pending-test',$2,null,null,$3,false,false)",
      [organization, tasks[0], ids.a],
    );
    await identity(db, ids.a);
    await db.query('select prepare_assessment_deletion($1,$2)', [
      assessments[0],
      assessmentDeletionConfirmation,
    ]);
    await db.exec('reset role');
    await db.query('select private.run_due_notifications()');
    assert.equal(
      (
        await db.query(
          "select id from notifications where task_id=$1 and event_type='TASK_OVERDUE'",
          [tasks[0]],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "select id from notifications where task_id=$1 and event_type='TASK_OVERDUE'",
          [tasks[1]],
        )
      ).rows.length,
      1,
    );
    await identity(db, ids.a);
    await db.query('select read_notifications()');
    assert.equal(
      (
        await db.query('select id from notifications where task_id=$1 and read_at is null', [
          tasks[0],
        ])
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query('select id from notifications where task_id=$1 and read_at is null', [
          tasks[1],
        ])
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
