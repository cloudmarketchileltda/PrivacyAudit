import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';

test('Aislamiento integral: cliente, consultor multiorganización y revocación de acceso', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    const fixtures: {
      organization: string;
      assessment: string;
      finding: string;
      evidence: string;
      report: string;
      path: string;
    }[] = [];
    for (const [index, consultant, client] of [
      [1, ids.a, ids.client],
      [2, ids.a, null],
      [3, ids.b, ids.other],
    ] as const) {
      await identity(db, consultant);
      const organization = await org(
        db,
        `Aislamiento ${index}`,
        ['76123456-0', '76234567-6', '76345678-1'][index - 1],
      );
      if (client) {
        await identity(db, ids.admin);
        await db.query("select manage_member($1,$2,'CLIENT')", [organization, client]);
        await identity(db, consultant);
      }
      const assessment = (
        await db.query<{ id: string }>("select create_assessment($1,'Evaluación aislada') id", [
          organization,
        ])
      ).rows[0].id;
      const finding = (
        await db.query<{ id: string }>(
          "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Hallazgo aislado','Descripción del hallazgo') returning id",
          [organization, assessment],
        )
      ).rows[0].id;
      await db.query(
        "insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Tarea aislada',$3)",
        [organization, finding, client || consultant],
      );
      await db.query(
        "insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Clientes','Administrar clientes',array['CLIENTS'],array['CONTACT'])",
        [organization],
      );
      await db.query(
        "insert into comments(organization_id,finding_id,body) values($1,$2,'Comentario aislado')",
        [organization, finding],
      );
      const evidence = randomUUID();
      const path = `${organization}/${evidence}/file`;
      await db.query(
        "insert into evidence(id,organization_id,finding_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,'Documento.txt','text/plain',5,'Documento aislado')",
        [evidence, organization, finding, path],
      );
      await db.query(
        `insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,'{"size":5,"mimetype":"text/plain"}')`,
        [path],
      );
      await db.query('select finalize_evidence($1)', [evidence]);
      const report = (
        await db.query<{ id: string }>(
          "select create_report($1,'Informe aislado','Resumen de evaluación aislada','Alcance de evaluación aislada','Conclusiones de evaluación aislada') id",
          [assessment],
        )
      ).rows[0].id;
      fixtures.push({ organization, assessment, finding, evidence, report, path });
    }

    async function verify(user: string, allowed: string[]) {
      await identity(db, user);
      const organizations = (await db.query<{ id: string }>('select id from organizations')).rows;
      assert.deepEqual(organizations.map((row) => row.id).sort(), [...allowed].sort());
      for (const table of [
        'assessments',
        'assessment_controls',
        'findings',
        'tasks',
        'processing_activities',
        'evidence',
        'comments',
        'reports',
        'audit_logs',
        'notifications',
        'organization_members',
      ]) {
        const rows = (
          await db.query<{ organization_id: string }>(`select organization_id from ${table}`)
        ).rows;
        assert.ok(
          rows.every((row) => allowed.includes(row.organization_id)),
          `${table}: ninguna organización ajena`,
        );
        if (allowed.length && !['notifications', 'audit_logs'].includes(table))
          assert.ok(rows.length, `${table}: acceso positivo a datos propios`);
      }
      const paths = (await db.query<{ name: string }>('select name from storage.objects')).rows;
      assert.deepEqual(
        paths.map((row) => row.name).sort(),
        fixtures
          .filter((f) => allowed.includes(f.organization))
          .map((f) => f.path)
          .sort(),
      );
      for (const fixture of fixtures) {
        const visible = allowed.includes(fixture.organization);
        assert.equal(
          (await db.query('select id from findings where id=$1', [fixture.finding])).rows.length,
          Number(visible),
        );
        if (visible) {
          await db.query('select record_evidence_download($1)', [fixture.evidence]);
          await db.query('select record_report_download($1)', [fixture.report]);
        } else {
          await assert.rejects(db.query('select finding_progress($1)', [fixture.finding]));
          await assert.rejects(db.query('select record_evidence_download($1)', [fixture.evidence]));
          await assert.rejects(db.query('select record_report_download($1)', [fixture.report]));
          await assert.rejects(
            db.query("select create_assessment($1,'Intrusión')", [fixture.organization]),
          );
        }
      }
    }
    await verify(ids.client, [fixtures[0].organization]);
    await verify(ids.other, [fixtures[2].organization]);
    await verify(ids.a, [fixtures[0].organization, fixtures[1].organization]);
    await verify(ids.b, [fixtures[2].organization]);
    // Conserva autoría y asignaciones históricas: ninguna concede acceso sin membresía.
    await identity(db, ids.admin);
    await db.query('select manage_member($1,$2,null)', [fixtures[0].organization, ids.client]);
    await db.query('select manage_member($1,$2,null)', [fixtures[0].organization, ids.a]);
    await verify(ids.client, []);
    await verify(ids.a, [fixtures[1].organization]);
  } finally {
    await db.close();
  }
});
