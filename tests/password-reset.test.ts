import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, users, ids, identity } from './db-helper';
import { mutationHandler } from '../supabase/functions/admin-manage-user/handler';

test('Restablecimiento: permisos, confirmación y respuesta sin credenciales', async () => {
  let role = 'CLIENT',
    calls = 0;
  const handler = mutationHandler({
    authorize: async () => ({ id: ids.admin, role }),
    mutate: async (input) => {
      calls++;
      assert.equal(input.password, 'TemporaryPassword123!');
      return true;
    },
  });
  const request = (patch = {}) =>
    new Request('https://example.test', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid' },
      body: JSON.stringify({
        target: ids.client,
        operation: 'RESET_PASSWORD',
        password: 'TemporaryPassword123!',
        password_confirmation: 'TemporaryPassword123!',
        ...patch,
      }),
    });
  assert.equal((await handler(request())).status, 403);
  role = 'SUPER_ADMIN';
  assert.equal((await handler(request({ target: ids.admin }))).status, 400);
  assert.equal(
    (await handler(request({ password_confirmation: 'DifferentPassword123' }))).status,
    400,
  );
  assert.equal(
    (await handler(request({ password: 'short', password_confirmation: 'short' }))).status,
    400,
  );
  assert.equal(
    (await handler(request({ password: 'x'.repeat(129), password_confirmation: 'x'.repeat(129) })))
      .status,
    400,
  );
  assert.equal(calls, 0);
  const result = await handler(request());
  assert.equal(result.status, 200);
  assert.equal(await result.text(), '{"success":true}');
  assert.equal(calls, 1);
});

test('Restablecimiento SQL: GoTrue, actor vigente, atomicidad, sesiones y ausencia de secretos', async () => {
  const db = await database();
  try {
    await users(db);
    await db.exec(
      'create role supabase_auth_admin; grant usage on schema auth to supabase_auth_admin; grant select,update on auth.users to supabase_auth_admin;',
    );
    for (const id of [ids.client, ids.a]) {
      await identity(db, id);
      await assert.rejects(db.query('select public.reserve_password_reset($1)', [ids.other]));
    }
    await identity(db, ids.admin);
    await assert.rejects(db.query('select public.reserve_password_reset($1)', [ids.admin]));
    await assert.rejects(db.query('select * from private.password_resets'));
    const reserve = async () =>
      (await db.query<{ id: string }>('select public.reserve_password_reset($1) id', [ids.client]))
        .rows[0].id;
    const receipt = await reserve();
    assert.equal(
      (
        await db.query<{ done: boolean }>('select public.password_reset_completed($1) done', [
          receipt,
        ])
      ).rows[0].done,
      false,
    );
    await assert.rejects(reserve());
    await db.exec('reset role');
    await db.query('insert into auth.sessions(user_id) values($1)', [ids.client]);
    // An unrelated self-change occurs after reservation but in a different transaction.
    await db.query('update auth.users set encrypted_password=$2 where id=$1', [
      ids.client,
      'self-change-hash',
    ]);
    await db.query('update auth.users set raw_app_meta_data=$2 where id=$1', [
      ids.client,
      JSON.stringify({ password_reset_receipt: receipt }),
    ]);
    assert.equal(
      (await db.query("select * from audit_logs where action='ADMIN_ACCOUNT_PASSWORD_RESET'")).rows
        .length,
      0,
    );
    await db.query("update auth.users set raw_app_meta_data='{}' where id=$1", [ids.client]);
    await db.transaction(async (tx) => {
      await tx.exec('set local role supabase_auth_admin');
      await tx.query('update auth.users set encrypted_password=$2 where id=$1', [
        ids.client,
        'auth-generated-hash',
      ]);
      await tx.query('update auth.users set raw_app_meta_data=$2 where id=$1', [
        ids.client,
        JSON.stringify({ password_reset_receipt: receipt }),
      ]);
    });
    assert.equal(
      (await db.query('select * from auth.sessions where user_id=$1', [ids.client])).rows.length,
      0,
    );
    const event = (
      await db.query<{ actor_id: string; metadata: unknown }>(
        "select actor_id,metadata from audit_logs where action='ADMIN_ACCOUNT_PASSWORD_RESET'",
      )
    ).rows[0];
    assert.equal(event.actor_id, ids.admin);
    assert.equal(JSON.stringify(event).includes('hash'), false);
    await identity(db, ids.admin);
    assert.equal(
      (
        await db.query<{ done: boolean }>('select public.password_reset_completed($1) done', [
          receipt,
        ])
      ).rows[0].done,
      true,
    );
    await db.query('select public.cancel_password_reset($1)', [receipt]);
    assert.equal(
      (
        await db.query<{ done: boolean }>('select public.password_reset_completed($1) done', [
          receipt,
        ])
      ).rows[0].done,
      false,
    );
    const stale = await reserve();
    await db.exec('reset role');
    await db.query("update profiles set role='CLIENT' where id=$1", [ids.admin]);
    await assert.rejects(
      db.transaction(async (tx) => {
        await tx.exec('set local role supabase_auth_admin');
        await tx.query('update auth.users set encrypted_password=$2 where id=$1', [
          ids.client,
          'must-rollback',
        ]);
        await tx.query('update auth.users set raw_app_meta_data=$2 where id=$1', [
          ids.client,
          JSON.stringify({ password_reset_receipt: stale }),
        ]);
      }),
    );
    assert.equal(
      (
        await db.query<{ encrypted_password: string }>(
          'select encrypted_password from auth.users where id=$1',
          [ids.client],
        )
      ).rows[0].encrypted_password,
      'auth-generated-hash',
    );
    await db.query("update profiles set role='SUPER_ADMIN' where id=$1", [ids.admin]);
    await db.query(
      "update private.password_resets set expires_at=now()-interval '1 minute' where id=$1",
      [stale],
    );
    await identity(db, ids.admin);
    assert.equal(
      (
        await db.query<{ done: boolean }>('select public.password_reset_completed($1) done', [
          stale,
        ])
      ).rows[0].done,
      false,
    );
  } finally {
    await db.close();
  }
});
