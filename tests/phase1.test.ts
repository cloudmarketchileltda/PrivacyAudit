import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, identity, ids, users, org } from './db-helper';
test('Fase 1: RLS, roles, organizaciones, membresías e invitaciones', async () => {
  const db = await database();
  try {
    await users(db);
    assert.equal(
      (await db.query<{ role: string }>(`select role from profiles where id=$1`, [ids.client]))
        .rows[0].role,
      'CLIENT',
      'metadata no puede asignar SUPER_ADMIN',
    );
    await identity(db, ids.a);
    const a = await org(db, 'Empresa A', '76123456-0');
    await identity(db, ids.b);
    const b = await org(db, 'Empresa B', '76234567-6');
    assert.equal((await db.query('select * from organizations')).rows.length, 1);
    assert.equal(
      (await db.query('select * from organizations where id=$1', [a])).rows.length,
      0,
      'consultor B no ve A',
    );
    assert.equal(
      (
        await db.query('update organizations set legal_name=$1 where id=$2 returning id', [
          'Intrusión',
          a,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(db.query('delete from organizations where id=$1 returning id', [a]));
    await assert.rejects(
      db.query(`insert into organization_members values($1,$2,'CONSULTANT',now(),now())`, [
        a,
        ids.b,
      ]),
    );
    await assert.rejects(db.query(`update profiles set role='SUPER_ADMIN' where id=$1`, [ids.b]));
    await identity(db, ids.a);
    const { rows } = await db.query<{ token: string }>(
      `select invite_client($1,'client@example.test') token`,
      [a],
    );
    const token = rows[0].token;
    assert.match(token, /^[a-f0-9]{64}$/);
    await assert.rejects(db.query('select token_hash from organization_invitations'));
    await identity(db, ids.other);
    await assert.rejects(db.query('select accept_invitation($1)', [token]));
    await identity(db, ids.client);
    await db.query('select accept_invitation($1)', [token]);
    assert.equal((await db.query('select * from organizations')).rows.length, 1);
    assert.equal((await db.query('select * from organizations where id=$1', [b])).rows.length, 0);
    await assert.rejects(db.query('select register_consultant()'));
    assert.equal(
      (
        await db.query('update organizations set legal_name=$1 where id=$2 returning id', [
          'Intrusión',
          a,
        ])
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query('select create_organization($1::jsonb)', [
        JSON.stringify({ legal_name: 'Cliente', rut: '76345678-1' }),
      ]),
    );
    await assert.rejects(
      db.query('select accept_invitation($1)', [token]),
      'token no se reutiliza',
    );
    await identity(db, ids.a);
    await db.query('select manage_member($1,$2,null)', [a, ids.client]);
    await identity(db, ids.client);
    assert.equal(
      (await db.query('select * from organizations')).rows.length,
      0,
      'retiro quita acceso',
    );
    await identity(db, ids.other);
    await assert.rejects(db.query('select register_consultant()'), 'autoactivación deshabilitada');
    await identity(db, ids.admin);
    assert.equal((await db.query('select * from organizations')).rows.length, 2);
    await identity(db, '', 'anon');
    await assert.rejects(db.query('select * from organizations'));
    await assert.rejects(db.query('select create_organization($1::jsonb)', ['{}']));
  } finally {
    await db.close();
  }
});

test('Invitaciones rechazan cuentas sin confirmar, revocación, expiración y empresas archivadas', async () => {
  const db = await database();
  try {
    await users(db);
    await identity(db, ids.a);
    const organization = await org(db, 'Empresa invitaciones', '76123456-0');
    const invite = async () =>
      (
        await db.query<{ token: string }>("select invite_client($1,'other@example.test') token", [
          organization,
        ])
      ).rows[0].token;
    const first = await invite();
    const invitation = (
      await db.query<{ id: string }>(
        'select id from organization_invitations where organization_id=$1',
        [organization],
      )
    ).rows[0].id;
    await db.exec('reset role');
    await db.query('update auth.users set email_confirmed_at=null where id=$1', [ids.other]);
    await identity(db, ids.other);
    await assert.rejects(db.query('select accept_invitation($1)', [first]));
    await db.exec('reset role');
    await db.query('update auth.users set email_confirmed_at=now() where id=$1', [ids.other]);
    await identity(db, ids.a);
    await db.query('select revoke_invitation($1)', [invitation]);
    await identity(db, ids.other);
    await assert.rejects(db.query('select accept_invitation($1)', [first]));
    await identity(db, ids.a);
    const expired = await invite();
    await db.exec('reset role');
    await db.query(
      "update organization_invitations set expires_at=now()-interval '1 hour' where organization_id=$1",
      [organization],
    );
    await identity(db, ids.other);
    await assert.rejects(db.query('select accept_invitation($1)', [expired]));
    await identity(db, ids.a);
    const archived = await invite();
    await identity(db, ids.admin);
    await db.query("update organizations set status='ARCHIVED' where id=$1", [organization]);
    await identity(db, ids.a);
    await assert.rejects(invite());
    await identity(db, ids.other);
    await assert.rejects(db.query('select accept_invitation($1)', [archived]));
  } finally {
    await db.close();
  }
});

test('Todas las tablas públicas tienen RLS y ningún RPC público usa SECURITY DEFINER', async () => {
  const db = await database();
  try {
    const unprotected = await db.query(
      "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
    );
    assert.deepEqual(unprotected.rows, []);
    const definer = await db.query(
      "select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef",
    );
    assert.deepEqual(definer.rows, []);
    const publicExecute = await db.query<{ allowed: boolean }>(
      "select has_function_privilege('anon','private.bootstrap_profile()','EXECUTE') as allowed",
    );
    assert.equal(publicExecute.rows[0].allowed, false);
  } finally {
    await db.close();
  }
});
