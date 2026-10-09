import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { database, identity, ids, users, org } from './db-helper';
import { buildOrganizationPackage, sha256 } from '../src/features/organizations/export-package';
import { renderReportPdf } from '../src/features/reports/pdf';

function unzip(buffer: Buffer) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let position = buffer.readUInt32LE(end + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < buffer.readUInt16LE(end + 10); i++) {
    assert.equal(buffer.readUInt32LE(position), 0x02014b50);
    const method = buffer.readUInt16LE(position + 10);
    const size = buffer.readUInt32LE(position + 20);
    const nameLength = buffer.readUInt16LE(position + 28);
    const name = buffer.subarray(position + 46, position + 46 + nameLength).toString();
    const local = buffer.readUInt32LE(position + 42);
    const offset = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const content = buffer.subarray(offset, offset + size);
    files.set(name, method === 8 ? inflateRawSync(content) : content);
    position +=
      46 + nameLength + buffer.readUInt16LE(position + 30) + buffer.readUInt16LE(position + 32);
  }
  return files;
}

test('Script remoto de cierre: permisos, exportación, conservación y rollback sin residuos', async () => {
  const db = await database();
  try {
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await db.exec(await readFile('scripts/verify-organization-closure-remote.sql', 'utf8'));
    assert.equal((await db.query('select id from organizations')).rows.length, 0);
    assert.equal((await db.query('select id from auth.users')).rows.length, 0);
  } finally {
    await db.close();
  }
});

test('Cierre: archivo, exportación completa verificable, acceso administrativo y retención', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('supabase/seed.sql', 'utf8'));
    await identity(db, ids.a);
    const organization = await org(db, 'Empresa cierre', '76123456-0');
    const assessment = (
      await db.query<{ id: string }>("select create_assessment($1,'Evaluación') id", [organization])
    ).rows[0].id;
    const finding = (
      await db.query<{ id: string }>(
        "insert into findings(organization_id,assessment_id,title,description) values($1,$2,'Hallazgo','Descripción') returning id",
        [organization, assessment],
      )
    ).rows[0].id;
    const evidence = randomUUID();
    const path = `${organization}/${evidence}/file`;
    await db.query(
      "insert into evidence(id,organization_id,finding_id,file_path,original_filename,mime_type,file_size,description) values($1,$2,$3,$4,'Documento.txt','text/plain',5,'Documento cierre')",
      [evidence, organization, finding, path],
    );
    await db.query(
      `insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,'{"size":5,"mimetype":"text/plain"}')`,
      [path],
    );
    await db.query('select finalize_evidence($1)', [evidence]);
    await db.query(
      "select create_report($1,'Informe cierre','Resumen de evaluación','Alcance de evaluación','Conclusiones de evaluación')",
      [assessment],
    );
    await db.query("select invite_client($1,'client@example.test')", [organization]);
    await assert.rejects(db.query('select organization_export_snapshot($1)', [organization]));
    await identity(db, ids.admin);
    await assert.rejects(
      db.query('select organization_export_snapshot($1)', [organization]),
      /Archive/,
    );
    await db.query("update organizations set status='ARCHIVED' where id=$1", [organization]);
    await db.exec('reset role');
    // A complete export must not inherit the Data API's 1,000-row limit.
    await db.query(
      "insert into audit_logs(organization_id,action,entity_type,entity_id,metadata) select $1,'TEST','organizations',$1,'{}' from generate_series(1,1050)",
      [organization],
    );
    await identity(db, ids.admin);
    const snapshot = (
      await db.query<{ content: Record<string, unknown> }>(
        'select organization_export_snapshot($1) content',
        [organization],
      )
    ).rows[0].content;
    assert.ok(!JSON.stringify(snapshot).includes('token_hash'));
    const data = snapshot.data as {
      audit_logs: unknown[];
      files: { name: string }[];
      evidence: unknown[];
    };
    assert.ok(data.audit_logs.length > 1000);
    assert.deepEqual(
      data.files.map((f) => f.name),
      [path],
    );
    const bundle = await buildOrganizationPackage(
      snapshot,
      async (p) => {
        assert.equal(p, path);
        return Buffer.from('hello');
      },
      renderReportPdf,
    );
    try {
      const files = unzip(await readFile(bundle.path));
      const manifest = JSON.parse(files.get('indice.json')!.toString());
      assert.equal(manifest.complete, true);
      assert.equal(bundle.manifestSha256, sha256(files.get('indice.json')!));
      for (const entry of manifest.entries) {
        assert.equal(files.get(entry.path)!.length, entry.bytes);
        assert.equal(sha256(files.get(entry.path)!), entry.sha256);
      }
      assert.equal(files.get('archivos/000001.bin')!.toString(), 'hello');
      assert.ok(
        [...files].some(
          ([name, content]) =>
            name.endsWith('.pdf') && content.subarray(0, 4).toString() === '%PDF',
        ),
      );
      await db.query('select record_organization_export($1,$2)', [
        organization,
        bundle.manifestSha256,
      ]);
    } finally {
      await bundle.cleanup();
    }
    await assert.rejects(
      buildOrganizationPackage(
        snapshot,
        async () => {
          throw new Error('Missing blob');
        },
        renderReportPdf,
      ),
    );
    await assert.rejects(
      buildOrganizationPackage(snapshot, async () => Buffer.from('wrong size'), renderReportPdf),
    );
    await assert.rejects(
      buildOrganizationPackage(
        { ...snapshot, data: { ...(snapshot.data as object), files: [] } },
        async () => Buffer.from('hello'),
        renderReportPdf,
      ),
    );
    const before = (await db.query('select id from audit_logs')).rows;
    await assert.rejects(
      db.query("select purge_audit_logs(now(),'Purga válida anterior','BORRAR LOG')"),
    );
    assert.deepEqual((await db.query('select id from audit_logs')).rows, before);
    for (const user of [ids.a, ids.client]) {
      await identity(db, user);
      await assert.rejects(db.query('select organization_export_snapshot($1)', [organization]));
      await assert.rejects(
        db.query('select record_organization_export($1,$2)', [organization, 'a'.repeat(64)]),
      );
    }
    await identity(db, ids.admin);
    await db.query("update organizations set status='ACTIVE' where id=$1", [organization]);
    await assert.rejects(
      db.query('select record_organization_export($1,$2)', [organization, 'a'.repeat(64)]),
    );
    await db.query("update organizations set status='ARCHIVED' where id=$1", [organization]);
    await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [
      organization,
    ]);
    await assert.rejects(db.query('select organization_export_snapshot($1)', [organization]));
    await assert.rejects(db.query('select finish_organization_deletion($1)', [organization]));
    await db.exec('reset role');
    // Storage API is represented by this deletion in the SQL-only fixture.
    await db.query('delete from storage.objects where name=$1', [path]);
    await identity(db, ids.admin);
    await db.query('select finish_organization_deletion($1)', [organization]);
    assert.equal(
      (
        await db.query(
          'select id from audit_logs where organization_ref=$1 or organization_id=$1',
          [organization],
        )
      ).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
