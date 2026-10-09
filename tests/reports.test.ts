import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';
import {
  reportSnapshotSchema,
  reportMetrics,
  reportInputSchema,
} from '../src/features/reports/model';
import { renderReportPdf } from '../src/features/reports/pdf';

test('Fase 7: publicación atómica, aislamiento, historial, PDF y borrado completo', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    const a = await org(db, 'Empresa Diagnóstico SpA', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    await identity(db, ids.admin);
    await db.query("select manage_member($1,$2,'CLIENT')", [a, ids.client]);
    await identity(db, ids.a);
    const assessment = (
      await db.query<{ id: string }>(
        "select create_assessment($1,'Diagnóstico inicial','Revisión documental del programa de privacidad') id",
        [a],
      )
    ).rows[0].id;
    const otherAssessment = (
      await db.query<{ id: string }>(
        "select create_assessment($1,'Otra evaluación','Fuera del informe') id",
        [a],
      )
    ).rows[0].id;
    await identity(db, ids.b);
    const bAssessment = (
      await db.query<{ id: string }>("select create_assessment($1,'Evaluación B','Alcance') id", [
        b,
      ])
    ).rows[0].id;
    await identity(db, ids.a);
    const controls = (
      await db.query<{ id: string }>(
        'select id from assessment_controls where assessment_id=$1 order by id',
        [assessment],
      )
    ).rows;
    await db.query(
      "update assessment_controls set status='CONFORM',auditor_comment='Política revisada con observaciones profesionales.' where id=$1",
      [controls[0].id],
    );
    await db.query(
      "update assessment_controls set status='NOT_APPLICABLE',applicability_reason='No se realiza este tratamiento en el alcance.' where id=$1",
      [controls[1].id],
    );
    const finding = (
      await db.query<{ id: string }>(
        "insert into findings(organization_id,assessment_id,control_id,title,description,recommendation,severity,assigned_to,due_date) values($1,$2,$3,'Política de conservación','Faltan criterios documentados de conservación y eliminación.','Definir plazos, responsables y criterios por finalidad.','HIGH',$4,'2026-10-01') returning id",
        [a, assessment, controls[0].id, ids.client],
      )
    ).rows[0].id;
    await db.query(
      "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Hallazgo fuera del alcance','No debe aparecer en este informe')",
      [a, otherAssessment],
    );
    await db.query(
      "insert into tasks(organization_id,finding_id,title,description,assigned_to,due_date) values($1,$2,'Documentar retención','Preparar los criterios y someterlos a revisión.',$3,'2026-10-01')",
      [a, finding, ids.client],
    );
    await db.query(
      "insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Gestión de clientes','Administrar las relaciones comerciales',array['CLIENTS'],array['CONTACT'])",
      [a],
    );
    const evidence = randomUUID();
    const ep = `${a}/${evidence}/file`;
    await db.query(
      "insert into evidence(id,organization_id,finding_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,'Política.txt','text/plain',5,'Política de conservación entregada')",
      [evidence, a, finding, ep],
    );
    await db.query(
      'insert into storage.objects(bucket_id,name,metadata) values(\'evidence\',$1,\'{"size":5,"mimetype":"text/plain"}\')',
      [ep],
    );
    await db.query('select finalize_evidence($1)', [evidence]);
    await db.query(
      "update evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Completar plazos por categoría de titulares.' where id=$1",
      [evidence],
    );
    const publish = () =>
      db.query<{ id: string }>(
        "select create_report($1,'Diagnóstico de privacidad','La evaluación identifica oportunidades para documentar el programa de privacidad.','Revisión de los controles, hallazgos y acciones de la evaluación seleccionada.','Priorizar las acciones de conservación y revisar los controles pendientes con el profesional responsable.') id",
        [assessment],
      );
    await assert.rejects(
      db.query(
        "select create_report($1,'Título','corto','Alcance suficiente','Conclusión suficiente')",
        [assessment],
      ),
    );
    await assert.rejects(
      db.query(
        "select create_report($1,'Título válido','Resumen suficiente','Alcance suficiente','Conclusión suficiente')",
        [bAssessment],
      ),
    );
    const id = (await publish()).rows[0].id;
    const r = (
      await db.query<{ id: string; title: string; snapshot: unknown }>(
        'select id,title,snapshot from reports where id=$1',
        [id],
      )
    ).rows[0];
    const s = reportSnapshotSchema.parse(r.snapshot);
    assert.equal(s.controls.length, 52);
    assert.equal(s.findings.length, 1);
    assert.equal(s.tasks.length, 1);
    assert.equal(s.processing.length, 1);
    assert.equal(s.evidence.length, 1);
    assert.equal(s.author, 'a');
    assert.equal(s.consultant, 'a');
    assert.equal(reportMetrics(s).evaluated, 2);
    await assert.rejects(db.query("update reports set title='Alterado' where id=$1", [id]));
    await assert.rejects(db.query('delete from reports where id=$1', [id]));
    await assert.rejects(
      db.query(
        "insert into reports(organization_id,assessment_id,created_by,title,snapshot) values($1,$2,$3,'Falso',$4)",
        [a, assessment, ids.a, s],
      ),
    );
    await db.query("update assessment_controls set status='PARTIAL' where id=$1", [controls[0].id]);
    assert.deepEqual(
      (await db.query<{ snapshot: unknown }>('select snapshot from reports where id=$1', [id]))
        .rows[0].snapshot,
      r.snapshot,
    );
    const next = (await publish()).rows[0].id;
    assert.notEqual(next, id);
    assert.equal(
      (await db.query("select * from audit_logs where action='REPORT_GENERATED'")).rows.length,
      2,
    );
    await identity(db, ids.b);
    assert.equal((await db.query('select * from reports')).rows.length, 0);
    await assert.rejects(db.query('select record_report_download($1)', [id]));
    await identity(db, ids.client);
    assert.equal((await db.query('select * from reports')).rows.length, 2);
    await assert.rejects(publish());
    await db.query('select record_report_download($1)', [id]);
    await identity(db, ids.admin);
    await db.query('select manage_member($1,$2,null)', [a, ids.client]);
    await identity(db, ids.client);
    assert.equal((await db.query('select * from reports')).rows.length, 0);
    await assert.rejects(db.query('select record_report_download($1)', [id]));
    await identity(db, ids.other, 'anon');
    await assert.rejects(db.query('select * from reports'));
    await assert.rejects(publish());
    const pdf = await renderReportPdf(r);
    assert.ok(pdf.length > 10000);
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
    await mkdir('artifacts/reports', { recursive: true });
    await writeFile('artifacts/reports/phase7-sample.pdf', pdf);
    // Stress wrapping and pagination without truncating long or multilingual input.
    const stress = structuredClone(s);
    stress.executive_summary = 'Revisión extensa con ñ, á, é y datos. '.repeat(120);
    stress.findings[0].description = 'Detalle extenso y revisión profesional. '.repeat(200);
    stress.organization.legal_name = 'Organización con nombre extenso '.repeat(8);
    await writeFile(
      'artifacts/reports/phase7-long.pdf',
      await renderReportPdf({ ...r, snapshot: stress }),
    );
    await identity(db, ids.admin);
    await db.query("update organizations set status='ARCHIVED' where id=$1", [a]);
    await assert.rejects(publish());
    assert.equal((await db.query('select * from reports')).rows.length, 2);
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [a]);
    await assert.rejects(publish());
    // Test adapter simulates Storage API deletion; this is not a remote blob deletion.
    await db.exec('reset role');
    await db.query('delete from storage.objects where name=$1', [ep]);
    await identity(db, ids.admin);
    await db.query('select finish_organization_deletion($1)', [a]);
    assert.equal((await db.query('select * from reports')).rows.length, 0);
    assert.equal(
      (await db.query("select * from audit_logs where entity_type='reports'")).rows.length,
      0,
    );
    assert.equal((await db.query('select * from controls')).rows.length, 52);
  } finally {
    await db.close();
  }
});

test('Informe: validación de textos y métricas sin dividir por cero', () => {
  const empty = reportSnapshotSchema.parse({
    version: 1,
    captured_at: '2026-10-08T15:00:00Z',
    organization: { id: ids.a, legal_name: 'Empresa de prueba', rut: '76123456-0' },
    assessment: {
      id: ids.b,
      name: 'Evaluación',
      description: '',
      status: 'DRAFT',
      started_at: null,
      completed_at: null,
    },
    consultant: 'Consultor',
    author: 'Consultor',
    executive_summary: 'Resumen profesional',
    scope: 'Alcance profesional',
    conclusions: 'Conclusión profesional',
    controls: [],
    findings: [],
    tasks: [],
    processing: [],
    evidence: [],
  });
  assert.equal(reportMetrics(empty).progress, 0);
  assert.equal(reportMetrics(empty).total, 0);

  assert.equal(
    reportInputSchema.safeParse({
      assessment: ids.a,
      report_title: 'Informe',
      executive_summary: 'x'.repeat(5001),
      report_scope: 'Alcance suficiente',
      conclusions: 'Conclusión suficiente',
    }).success,
    false,
  );
});

test('Informes: snapshot íntegro con más de 1.000 controles', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.admin);
    await db.exec(
      "insert into controls(code,title,category) select 'TEST-'||n,'Control de prueba '||n,'Categoría de prueba' from generate_series(1,1005) n",
    );
    await identity(db, ids.a);
    const organization = await org(db, 'Empresa de prueba de volumen', '76123456-0');
    const assessment = (
      await db.query<{ id: string }>(
        "select create_assessment($1,'Evaluación amplia','Alcance de prueba') id",
        [organization],
      )
    ).rows[0].id;
    const report = (
      await db.query<{ id: string }>(
        "select create_report($1,'Informe de volumen','Resumen profesional registrado','Alcance profesional registrado','Conclusiones profesionales registradas') id",
        [assessment],
      )
    ).rows[0].id;
    const snapshot = (
      await db.query<{ snapshot: unknown }>('select snapshot from reports where id=$1', [report])
    ).rows[0].snapshot;
    assert.equal(reportSnapshotSchema.parse(snapshot).controls.length, 1005);
  } finally {
    await db.close();
  }
});
