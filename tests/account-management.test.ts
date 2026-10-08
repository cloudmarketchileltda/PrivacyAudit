import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, users, ids, identity, org } from './db-helper';
import { mutationHandler } from '../supabase/functions/admin-manage-user/handler';
test('Gestión Auth: validación, autorización, protección propia y errores sin secretos', async () => {
  let calls = 0,
    role = 'CLIENT';
  const handler = mutationHandler({
    authorize: async (token) => (token === 'valid' ? { id: ids.admin, role } : null),
    mutate: async () => {
      calls++;
      return true;
    },
  });
  const req = (value: unknown, token = 'valid') =>
    new Request('https://example.test', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(value),
    });
  const input = {
    target: ids.other,
    operation: 'UPDATE',
    full_name: 'Cuenta nueva',
    email: 'new@example.test',
  };
  assert.equal((await handler(req(input, 'expired'))).status, 401);
  assert.equal((await handler(req(input))).status, 403);
  role = 'SUPER_ADMIN';
  assert.equal((await handler(req({ ...input, email: 'invalid' }))).status, 400);
  assert.equal((await handler(req({ target: ids.other, operation: 'DELETE' }))).status, 400);
  assert.equal(
    (
      await handler(
        req({ target: ids.admin, operation: 'DELETE', confirmation: 'ELIMINAR CUENTA' }),
      )
    ).status,
    400,
  );
  assert.equal(calls, 0);
  assert.equal((await handler(req(input))).status, 200);
  assert.equal(
    (
      await handler(
        req({ target: ids.other, operation: 'DELETE', confirmation: 'ELIMINAR CUENTA' }),
      )
    ).status,
    200,
  );
  assert.equal(calls, 2);
  const failing = mutationHandler({
    authorize: async () => ({ id: ids.admin, role }),
    mutate: async () => {
      throw new Error('secret');
    },
  });
  const response = await failing(req(input));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('secret'));
});
test('Cuentas SQL: correo restringido, sincronización atómica, borrado y conservación de historial', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(
      'create role supabase_auth_admin; grant usage on schema auth to supabase_auth_admin; grant select,update,delete on auth.users to supabase_auth_admin;',
    );
    for (const uid of [ids.client, ids.a]) {
      await identity(db, uid);
      await assert.rejects(db.query("select public.admin_accounts('',1)"));
      await assert.rejects(
        db.query(
          "select public.reserve_account_mutation($1,'UPDATE','new@example.test','Nuevo nombre')",
          [ids.other],
        ),
      );
    }
    await identity(db, ids.admin);
    const accounts = (
      await db.query<{ data: { users: unknown[]; count: number } }>(
        "select public.admin_accounts('',1) data",
      )
    ).rows[0].data;
    assert.equal(accounts.count, 5);
    assert.equal(accounts.users.length, 5);
    await assert.rejects(db.query('select * from private.account_mutations'));
    await assert.rejects(
      db.query("select public.reserve_account_mutation($1,'DELETE',null,null)", [ids.admin]),
    );
    const reserve = async (target: string, operation: string) =>
      (
        await db.query<{ id: string }>(
          "select public.reserve_account_mutation($1,$2,'new@example.test','Nuevo nombre') id",
          [target, operation],
        )
      ).rows[0].id;
    const expired = await reserve(ids.other, 'UPDATE');
    await db.exec('reset role');
    await db.query(
      "update private.account_mutations set expires_at=now()-interval '1 minute' where id=$1",
      [expired],
    );
    await db.exec('set role supabase_auth_admin');
    await db.query('update auth.users set raw_user_meta_data=$2 where id=$1', [
      ids.other,
      JSON.stringify({ full_name: 'Nuevo nombre' }),
    ]);
    await db.exec('reset role');
    assert.equal(
      (
        await db.query<{ full_name: string }>('select full_name from profiles where id=$1', [
          ids.other,
        ])
      ).rows[0].full_name,
      'other',
    );
    await db.exec('set role supabase_auth_admin');
    await assert.rejects(db.query('delete from auth.users where id=$1', [ids.other]));
    await identity(db, ids.admin);
    await db.query('select public.cancel_account_mutation($1)', [expired]);
    await reserve(ids.other, 'UPDATE');
    await db.exec('reset role; set role supabase_auth_admin');
    await db.query(
      "update auth.users set email='new@example.test',raw_user_meta_data='{" +
        '"full_name":"Nuevo nombre"' +
        "}' where id=$1",
      [ids.other],
    );
    await db.exec('reset role');
    assert.equal(
      (
        await db.query<{ full_name: string }>('select full_name from profiles where id=$1', [
          ids.other,
        ])
      ).rows[0].full_name,
      'Nuevo nombre',
    );
    const event = (
      await db.query<{ actor_id: string }>(
        "select actor_id from audit_logs where action='ADMIN_ACCOUNT_UPDATED' and entity_id=$1",
        [ids.other],
      )
    ).rows[0];
    assert.equal(event.actor_id, ids.admin);
    await db.query(
      "update auth.users set raw_user_meta_data='{" + '"full_name":"Autocambio"' + "}' where id=$1",
      [ids.other],
    );
    assert.equal(
      (
        await db.query<{ full_name: string }>('select full_name from profiles where id=$1', [
          ids.other,
        ])
      ).rows[0].full_name,
      'Nuevo nombre',
    );
    await identity(db, ids.a);
    const historicalOrg = await org(db, 'Empresa histórica', '76123456-0');
    await db.query(
      "insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Tratamiento histórico','Gestionar clientes',array['CLIENTS'],array['CONTACT'])",
      [historicalOrg],
    );
    await identity(db, ids.admin);
    await reserve(ids.a, 'DELETE');
    await db.exec('reset role; set role supabase_auth_admin');
    await assert.rejects(db.query('delete from auth.users where id=$1', [ids.a]));
    await db.exec('reset role');
    assert.equal(
      (
        await db.query(
          "select * from audit_logs where action='ADMIN_ACCOUNT_DELETED' and entity_id=$1",
          [ids.a],
        )
      ).rows.length,
      0,
    );
    assert.equal((await db.query('select * from profiles where id=$1', [ids.a])).rows.length, 1);
    await identity(db, ids.admin);
    await reserve(ids.other, 'DELETE');
    await db.exec('reset role');
    await db.query('insert into auth.sessions(user_id) values($1)', [ids.other]);
    await db.exec('set role supabase_auth_admin');
    await db.query('delete from auth.users where id=$1', [ids.other]);
    await db.exec('reset role');
    assert.equal(
      (await db.query('select * from profiles where id=$1', [ids.other])).rows.length,
      0,
    );
    assert.equal(
      (await db.query('select * from auth.sessions where user_id=$1', [ids.other])).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query<{ actor_id: string }>(
          "select actor_id from audit_logs where action='ADMIN_ACCOUNT_DELETED' and entity_id=$1",
          [ids.other],
        )
      ).rows[0].actor_id,
      ids.admin,
    );
    assert.ok(
      (await db.query('select * from audit_logs where entity_id=$1', [ids.other])).rows.length >= 2,
    );
    await db.exec('reset role; set session authorization supabase_auth_admin');
    await assert.rejects(db.query('delete from auth.users where id=$1', [ids.client]));
  } finally {
    await db.close();
  }
});
