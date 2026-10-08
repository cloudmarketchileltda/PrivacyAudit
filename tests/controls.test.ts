import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, identity, ids, users, org } from './db-helper';
test('Catálogo: administración exclusiva, historial, protección de uso y prioridad del borrado de organización', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.admin);
    const control = (
      await db.query<{ id: string }>(
        "insert into controls(code,title,category) values('CAT-TEST','Control original','Gobierno') returning id",
      )
    ).rows[0].id;
    const unused = (
      await db.query<{ id: string }>(
        "insert into controls(code,title,category,active) values('CAT-FREE','Control libre','Gobierno',false) returning id",
      )
    ).rows[0].id;
    await identity(db, ids.a);
    assert.equal((await db.query('select id from controls')).rows.length, 0);
    await assert.rejects(
      db.query(
        "insert into controls(code,title,category) values('INTRUSION','Control inválido','Gobierno')",
      ),
    );
    assert.equal(
      (await db.query('delete from controls where id=$1 returning id', [unused])).rows.length,
      0,
    );
    assert.equal(
      (await db.query("update controls set title='Intrusión' where id=$1 returning id", [control]))
        .rows.length,
      0,
    );
    const a = await org(db, 'Organización A', '76123456-0');
    const b = await org(db, 'Organización B', '76234567-6');
    await db.query("select create_assessment($1,'Aplicación A')", [a]);
    await db.query("select create_assessment($1,'Aplicación B')", [b]);
    await identity(db, ids.admin);
    await db.query("update controls set title='Control modificado',active=false where id=$1", [
      control,
    ]);
    assert.equal(
      (
        await db.query<{ title: string }>(
          "select snapshot->>'title' as title from assessment_controls where control_id=$1 limit 1",
          [control],
        )
      ).rows[0].title,
      'Control original',
    );
    await assert.rejects(
      db.query('delete from controls where id=$1', [control]),
      (error: unknown) => ['23503', '23001'].includes((error as { code: string }).code),
    );
    assert.equal(
      (await db.query('delete from controls where id=$1 returning id', [unused])).rows.length,
      1,
    );
    // Archived read-only and applied-control protection must never prevent organization cleanup.
    await db.query("update organizations set status='ARCHIVED' where id=$1", [a]);
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [a]);
    await db.query('select finish_organization_deletion($1)', [a]);
    assert.equal(
      (await db.query('select id from assessment_controls where organization_id=$1', [a])).rows
        .length,
      0,
    );
    assert.equal((await db.query('select id from controls where id=$1', [control])).rows.length, 1);
    assert.equal(
      (await db.query('select id from assessment_controls where organization_id=$1', [b])).rows
        .length,
      1,
    );
    await assert.rejects(
      db.query('delete from controls where id=$1', [control]),
      (error: unknown) => ['23503', '23001'].includes((error as { code: string }).code),
    );
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [b]);
    await db.query('select finish_organization_deletion($1)', [b]);
    assert.equal(
      (await db.query('delete from controls where id=$1 returning id', [control])).rows.length,
      1,
    );
    assert.equal(
      (await db.query("select id from audit_logs where entity_type='controls' and action='DELETE'"))
        .rows.length,
      2,
    );
    await identity(db, ids.client);
    assert.equal((await db.query('select id from controls')).rows.length, 0);
    await identity(db, ids.client, 'anon');
    await assert.rejects(db.query('delete from controls'));
  } finally {
    await db.close();
  }
});
