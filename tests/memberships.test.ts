import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, users, ids, identity, org } from './db-helper';
import { validRut } from '../src/features/organizations/schemas';
import { membershipSchema } from '../src/features/users/membership-schema';
const array = (value: string[]) => `{${value.join(',')}}`;
test('Membresías: cliente único, consultor múltiple, transferencia atómica, permisos y guardado obsoleto', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    const save = (target: string, role: string, wanted: string[], expected: string[]) =>
      db.query('select set_user_organizations($1,$2,$3::uuid[],$4::uuid[])', [
        target,
        role,
        array(wanted),
        array(expected),
      ]);
    for (const id of [ids.client, ids.a]) {
      await identity(db, id);
      await assert.rejects(save(ids.client, 'CLIENT', [a], []));
      await assert.rejects(db.query("select admin_membership_users('CLIENT','',1)"));
      await assert.rejects(db.query('select admin_membership_organizations()'));
    }
    await identity(db, ids.admin);
    await save(ids.client, 'CLIENT', [a], []);
    await assert.rejects(save(ids.client, 'CLIENT', [a, b], [a]));
    await assert.rejects(save(ids.client, 'CLIENT', [b], []), 'rechaza página obsoleta');
    await assert.rejects(save(ids.client, 'CONSULTANT', [b], [a]), 'rol actual confirmado en SQL');
    await assert.rejects(
      save(ids.client, 'CLIENT', ['10000000-0000-4000-8000-000000000099'], [a]),
      'referencia inexistente no elimina acceso anterior',
    );
    assert.equal(
      (await db.query('select * from organization_members where user_id=$1', [ids.client])).rows
        .length,
      1,
    );
    await assert.rejects(
      db.query("select manage_member($1,$2,'CLIENT')", [b, ids.client]),
      'RPC antigua tampoco asigna segunda empresa',
    );
    await assert.rejects(
      db.query("select set_user_role($1,'CONSULTANT')", [ids.client]),
      'rol incompatible exige retirar membresía',
    );
    const invitation = (
      await db.query<{ token: string }>("select invite_client($1,'client@example.test') token", [b])
    ).rows[0].token;
    await identity(db, ids.client);
    await assert.rejects(
      db.query('select accept_invitation($1)', [invitation]),
      'invitación tampoco permite segunda organización',
    );
    await identity(db, ids.admin);
    await save(ids.client, 'CLIENT', [b], [a]);
    await identity(db, ids.client);
    assert.deepEqual(
      (await db.query<{ id: string }>('select id from organizations')).rows.map((x) => x.id),
      [b],
      'transferencia retira acceso anterior',
    );
    await identity(db, ids.admin);
    await save(ids.a, 'CONSULTANT', [a, b], [a]);
    await identity(db, ids.a);
    assert.equal((await db.query('select * from organizations')).rows.length, 2);
    await identity(db, ids.admin);
    await db.query("update organizations set status='ARCHIVED' where id=$1", [a]);
    await assert.rejects(save(ids.other, 'CLIENT', [a], []), 'no incorpora usuarios a archivadas');
    await save(ids.a, 'CONSULTANT', [a, b], [a, b]);
    await save(ids.a, 'CONSULTANT', [b], [a, b]);
    await assert.rejects(save(ids.a, 'CONSULTANT', [b, b], [b]), 'no acepta duplicados');
    await save(ids.client, 'CLIENT', [], [b]);
    await db.query("select set_user_role($1,'CONSULTANT')", [ids.client]);
    const grid = (
      await db.query<{
        value: { count: number; users: { id: string; organizations: string[]; email: string }[] };
      }>("select admin_membership_users('CONSULTANT','client@example.test',1) value")
    ).rows[0].value;
    assert.equal(grid.count, 1);
    assert.equal(grid.users[0].id, ids.client);
    assert.deepEqual(grid.users[0].organizations, []);
    await identity(db, '', 'anon');
    await assert.rejects(save(ids.client, 'CONSULTANT', [b], []));
    await assert.rejects(db.query("select admin_membership_users('CLIENT','',1)"));
    await db.exec('reset role');
    assert.ok(
      (
        await db.query(
          "select * from audit_logs where entity_type='organization_members' and actor_id=$1",
          [ids.admin],
        )
      ).rows.length > 0,
      'auditoría administrativa de cambios',
    );
  } finally {
    await db.close();
  }
});
test('Grillas paginadas por rol, búsqueda literal y organizaciones sin truncamiento de API', async () => {
  const db = await database();
  try {
    await users(db);
    for (let n = 0; n < 21; n++) {
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [
        `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
        `grid-${n}@example.test`,
        JSON.stringify({ full_name: `Cliente ${String(n).padStart(2, '0')}` }),
      ]);
    }
    const records = Array.from({ length: 1001 }, (_, n) => {
      const body = String(80000000 + n);
      const rut = Array.from('0123456789K')
        .map((d) => `${body}-${d}`)
        .find(validRut)!;
      return { legal_name: `Organización ${n}`, rut };
    });
    await db.query(
      'insert into organizations(legal_name,rut,created_by) select legal_name,rut,$2::uuid from jsonb_to_recordset($1::jsonb) as r(legal_name text,rut text)',
      [JSON.stringify(records), ids.admin],
    );
    await identity(db, ids.admin);
    const allOrgs = (
      await db.query<{ value: unknown[] }>('select admin_membership_organizations() value')
    ).rows[0].value;
    assert.equal(allOrgs.length, 1001);
    const query = async (page: number) =>
      (
        await db.query<{ value: { count: number; users: { id: string }[] } }>(
          "select admin_membership_users('CLIENT','grid-',$1) value",
          [page],
        )
      ).rows[0].value;
    const first = await query(1),
      second = await query(2);
    assert.equal(first.count, 21);
    assert.equal(first.users.length, 20);
    assert.equal(second.users.length, 1);
    assert.ok(!first.users.some((x) => x.id === second.users[0].id));
    await assert.rejects(db.query("select admin_membership_users('SUPER_ADMIN','',1)"));
    assert.ok(
      !membershipSchema.safeParse({
        target: ids.client,
        expected_role: 'CLIENT',
        organizations: [ids.a, ids.b],
        expected_organizations: [],
      }).success,
    );
  } finally {
    await db.close();
  }
});

test('Script de verificación remota de membresías ejecutable localmente y sin datos residuales', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(await readFile('scripts/verify-memberships-remote.sql', 'utf8'));
    assert.equal(
      (await db.query("select * from auth.users where email like 'membership-grid-%'")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from organizations where legal_name like 'Grilla temporal %'")).rows
        .length,
      0,
    );
  } finally {
    await db.close();
  }
});
