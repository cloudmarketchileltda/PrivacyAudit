import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountHandler, accountInput } from '../supabase/functions/admin-create-user/handler';
import { database, users, ids, identity } from './db-helper';
const input = {
  full_name: 'Nuevo usuario',
  email: 'new@example.test',
  password: 'StrongPassword123!',
  role: 'CONSULTANT',
};
test('Creación administrativa: sesión, roles, validación y ausencia de secretos en errores', async () => {
  let calls = 0;
  let role = 'CLIENT';
  const handler = accountHandler({
    authorize: async (token) => (token === 'valid' ? { id: ids.admin, role } : null),
    create: async (data, actor) => {
      calls++;
      assert.equal(actor, ids.admin);
      assert.equal(data.role, 'CONSULTANT');
      return { id: ids.other };
    },
  });
  const request = (value: unknown = input, token?: string) =>
    new Request('https://example.test', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(value),
    });
  assert.equal((await handler(request())).status, 401);
  assert.equal((await handler(request(input, 'expired'))).status, 401);
  for (role of ['CLIENT', 'CONSULTANT'])
    assert.equal((await handler(request(input, 'valid'))).status, 403);
  assert.equal(calls, 0);
  role = 'SUPER_ADMIN';
  for (const value of [
    { ...input, role: ['CONSULTANT'] },
    { ...input, role: 'SUPER_ADMIN' },
    { ...input, password: 'short' },
    { ...input, email: 'invalid' },
  ])
    assert.equal((await handler(request(value, 'valid'))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await handler(request(input, 'valid'))).status, 201);
  assert.equal(calls, 1);
  const failing = accountHandler({
    authorize: async () => ({ id: ids.admin, role }),
    create: async () => {
      throw new Error(input.password);
    },
  });
  assert.equal((await failing(request(input, 'valid'))).status, 503);
  assert.ok(!(await (await failing(request(input, 'valid'))).text()).includes(input.password));
  assert.equal(accountInput({ ...input, role: 'CLIENT' })?.role, 'CLIENT');
});
test('Auth: registro público y autoactivación bloqueados, rol inicial y actor administrativo atómicos', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.other);
    await assert.rejects(db.query('select public.register_consultant()'));
    await assert.rejects(db.query('select private.register_consultant()'));
    await assert.rejects(
      db.query("update profiles set role='CONSULTANT' where id=$1", [ids.other]),
    );
    await db.exec(
      `reset role; create role supabase_auth_admin; grant usage on schema auth to supabase_auth_admin; grant insert on auth.users to supabase_auth_admin; set role supabase_auth_admin;`,
    );
    const uid = '10000000-0000-4000-8000-000000000099';
    const insert = (app: object = {}, meta: object = {}) =>
      db.query(
        'insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values($1,$2,$3,$4)',
        [uid, 'admin-created@example.test', JSON.stringify(app), JSON.stringify(meta)],
      );
    await assert.rejects(insert());
    await assert.rejects(insert({}, { provisioned_by: ids.admin, provisioned_role: 'CONSULTANT' }));
    await assert.rejects(insert({ provisioned_by: ids.a, provisioned_role: 'CONSULTANT' }));
    await assert.rejects(insert({ provisioned_by: ids.admin, provisioned_role: 'SUPER_ADMIN' }));
    await insert(
      { provisioned_by: ids.admin, provisioned_role: 'CONSULTANT' },
      { full_name: 'Consultor creado', role: 'SUPER_ADMIN' },
    );
    await db.exec('reset role');
    assert.equal(
      (await db.query<{ role: string }>('select role from profiles where id=$1', [uid])).rows[0]
        .role,
      'CONSULTANT',
    );
    const events = await db.query<{ actor_id: string; metadata: { role: string } }>(
      "select actor_id,metadata from audit_logs where entity_id=$1 and action='ADMIN_ACCOUNT_CREATED'",
      [uid],
    );
    assert.equal(events.rows.length, 1);
    assert.equal(events.rows[0].actor_id, ids.admin);
    assert.equal(events.rows[0].metadata.role, 'CONSULTANT');
    assert.equal(
      (await db.query('select * from organization_members where user_id=$1', [uid])).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
