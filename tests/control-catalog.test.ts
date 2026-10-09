import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { database, identity, ids, users, org } from './db-helper';
import { controlSchema } from '../src/features/controls/schemas';
import {
  expandedControl,
  migrationSQL,
  seedSQL,
  originalDescription,
  originalObjective,
  originalGuidance,
  originalReference,
  type Catalog,
} from '../scripts/privacy-control-catalog';

const catalog: Catalog = JSON.parse(await readFile('docs/catalog/privacy-controls.json', 'utf8'));
const migrationName = (await readdir('supabase/migrations')).find((name) =>
  name.endsWith('_enrich_privacy_control_catalog.sql'),
)!;
const migration = await readFile(`supabase/migrations/${migrationName}`, 'utf8');
const seed = await readFile('supabase/seed.sql', 'utf8');

test('Catálogo editorial: 52 controles específicos, fuentes y vigencia, dentro del contrato del formulario', () => {
  assert.equal(catalog.controls.length, 52);
  assert.equal(new Set(catalog.controls.map((entry) => entry.code)).size, 52);
  catalog.controls.forEach((entry, index) => {
    assert.equal(entry.code, `PR-${String(index + 1).padStart(3, '0')}`);
    assert.ok(entry.criteria.length >= 3);
    const value = controlSchema.parse(expandedControl(catalog, entry, index));
    assert.match(value.description, /Cumplimiento esperado del control/);
    assert.match(value.guidance, /Evidencias sugeridas/);
    assert.match(value.normative_reference, /Hasta el 30 de noviembre de 2026/);
    assert.match(value.normative_reference, /Desde el 1 de diciembre de 2026/);
    assert.equal(value.legal_review_status, 'PENDING');
  });
  assert.equal(seed, seedSQL(catalog));
  assert.equal(migration, migrationSQL(catalog));
  // No importar plazos del RGPD ni confundir el régimen actual con la reforma.
  assert.match(expandedControl(catalog, catalog.controls[25], 25).description, /dos días hábiles/);
  assert.match(expandedControl(catalog, catalog.controls[25], 25).description, /30 días corridos/);
  assert.match(
    expandedControl(catalog, catalog.controls[40], 40).description,
    /sin inventar un plazo general de 72 horas/,
  );
});

test('Actualización editorial: 52 textos, seed idempotente, personalización e historia protegidas', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.admin);
    await db.exec(seed);
    await db.exec(seed);
    assert.equal((await db.query('select code from controls')).rows.length, 52);
    // Reproducir el catálogo anterior que existe en instalaciones con datos.
    for (const entry of catalog.controls) {
      await db.query(
        'update controls set description=$1,objective=$2,guidance=$3,normative_reference=$4 where code=$5',
        [
          originalDescription(entry.title),
          originalObjective(entry.title),
          originalGuidance,
          originalReference,
          entry.code,
        ],
      );
    }
    await identity(db, ids.a);
    const organization = await org(db, 'Catálogo histórico', '76123456-0');
    await db.query("select create_assessment($1,'Evaluación anterior')", [organization]);
    await identity(db, ids.admin);
    const snapshots = (await db.query('select id,snapshot from assessment_controls order by id'))
      .rows;
    const before = (
      await db.query(
        'select id,code,active,sort_order,category,severity_if_failed,requires_evidence,legal_review_status from controls order by code',
      )
    ).rows;
    await db.exec(migration);
    assert.equal(
      (
        await db.query(
          "select code from controls where description like '%Cumplimiento esperado del control%'",
        )
      ).rows.length,
      52,
    );
    assert.deepEqual(
      (await db.query('select id,snapshot from assessment_controls order by id')).rows,
      snapshots,
    );
    assert.deepEqual(
      (
        await db.query(
          'select id,code,active,sort_order,category,severity_if_failed,requires_evidence,legal_review_status from controls order by code',
        )
      ).rows,
      before,
    );
    await identity(db, ids.a);
    const next = (
      await db.query<{ id: string }>("select create_assessment($1,'Evaluación nueva') as id", [
        organization,
      ])
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          "select id from assessment_controls where assessment_id=$1 and snapshot->>'description' like '%Cumplimiento esperado del control%'",
          [next],
        )
      ).rows.length,
      52,
    );
    await identity(db, ids.admin);
    // Cambios del administrador y controles propios no se sobrescriben al migrar.
    for (const entry of catalog.controls.slice(0, 5)) {
      await db.query(
        'update controls set description=$1,objective=$2,guidance=$3,normative_reference=$4 where code=$5',
        [
          originalDescription(entry.title),
          originalObjective(entry.title),
          originalGuidance,
          originalReference,
          entry.code,
        ],
      );
    }
    await db.exec(
      "update controls set description='Descripción adaptada' where code='PR-001'; update controls set guidance='Evidencias propias' where code='PR-002'; update controls set normative_reference='Análisis profesional' where code='PR-003'; update controls set legal_review_status='REVIEWED' where code='PR-004'; update controls set title='Nombre adaptado' where code='PR-005'; insert into controls(code,title,category,description) values('PROPIO-1','Control propio','Interno','Texto propio');",
    );
    const customized = (
      await db.query(
        "select * from controls where code in ('PR-001','PR-002','PR-003','PR-004','PR-005','PROPIO-1') order by code",
      )
    ).rows;
    await db.exec(migration);
    assert.deepEqual(
      (
        await db.query(
          "select * from controls where code in ('PR-001','PR-002','PR-003','PR-004','PR-005','PROPIO-1') order by code",
        )
      ).rows,
      customized,
    );
    assert.deepEqual(
      (
        await db.query(
          'select id,snapshot from assessment_controls where assessment_id<>$1 order by id',
          [next],
        )
      ).rows,
      snapshots,
    );
  } finally {
    await db.close();
  }
});
