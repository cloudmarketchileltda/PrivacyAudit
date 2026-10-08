import { test } from 'node:test';
import assert from 'node:assert/strict';
import { database, users, ids, identity, org } from './db-helper';
import {
  changePasswordSchema,
  passwordSchema,
  profileSchema,
} from '../src/features/account/schemas';
import { contactInput } from '../supabase/functions/_shared/account-contact';

test('Cuenta propia: validación de contactos y contraseñas confirmadas', () => {
  const base = {
    current_password: 'OldPassword123',
    password: 'NewPassword123',
    password_confirmation: 'NewPassword123',
  };
  assert.ok(changePasswordSchema.safeParse(base).success);
  assert.ok(
    !changePasswordSchema.safeParse({ ...base, password_confirmation: 'DifferentPassword123' })
      .success,
  );
  assert.ok(!changePasswordSchema.safeParse({ ...base, current_password: base.password }).success);
  assert.ok(!changePasswordSchema.safeParse({ ...base, current_password: '' }).success);
  assert.ok(!passwordSchema.safeParse({ password: base.password }).success);
  assert.ok(!profileSchema.safeParse({ full_name: 'Nombre', address: 'x'.repeat(301) }).success);
  assert.equal(contactInput({ phone: [] }), null);
  assert.deepEqual(contactInput({ city: ' Santiago ' }), {
    address: '',
    phone: '',
    city: 'Santiago',
    country: '',
  });
});

test('Datos de cuenta: privacidad entre miembros, guardado atómico, alta y edición reservadas y borrado', async () => {
  const db = await database();
  const contact = {
    address: 'Calle de prueba 123',
    phone: '+56 9 1234 5678',
    city: 'Santiago',
    country: 'Chile',
  };
  try {
    await users(db);
    await db.exec(
      'create role supabase_auth_admin; grant usage on schema auth to supabase_auth_admin; grant select,insert,update,delete on auth.users to supabase_auth_admin;',
    );
    await identity(db, ids.a);
    const organization = await org(db, 'Contacto Demo', '76123456-0');
    await identity(db, ids.admin);
    await db.query("select public.manage_member($1,$2,'CLIENT')", [organization, ids.client]);
    await identity(db, ids.client);
    await db.query('select public.save_my_account($1,$2)', [
      'Cliente con contacto',
      JSON.stringify(contact),
    ]);
    assert.deepEqual(
      (await db.query('select address,phone,city,country from account_details')).rows,
      [contact],
    );
    await assert.rejects(
      db.query('update account_details set city=$1 where user_id=$2', ['Otra', ids.client]),
    );
    await assert.rejects(
      db.query('select private.write_account_contact($1,$2)', [ids.other, JSON.stringify(contact)]),
    );
    await assert.rejects(
      db.query('select public.save_my_account($1,$2)', [
        'Cambio que debe revertir',
        JSON.stringify({ ...contact, city: 'x'.repeat(121) }),
      ]),
    );
    assert.equal(
      (
        await db.query<{ full_name: string }>('select full_name from profiles where id=$1', [
          ids.client,
        ])
      ).rows[0].full_name,
      'Cliente con contacto',
    );
    await identity(db, ids.a);
    assert.equal(
      (await db.query('select * from account_details where user_id=$1', [ids.client])).rows.length,
      0,
    );
    await assert.rejects(
      db.query('select public.reserve_account_contact_mutation($1,$2,$3,$4,$5)', [
        ids.client,
        'UPDATE',
        'changed@example.test',
        'Changed',
        JSON.stringify(contact),
      ]),
    );
    await identity(db, '', 'anon');
    await assert.rejects(db.query('select * from account_details'));
    await assert.rejects(db.query('select public.save_my_account($1,$2)', ['Anónimo', '{}']));
    await identity(db, ids.admin);
    const account = (
      await db.query<{ data: { users: ({ id: string } & typeof contact)[] } }>(
        "select public.admin_accounts('',1) data",
      )
    ).rows[0].data.users.find((user) => user.id === ids.client)!;
    assert.equal(account.city, 'Santiago');
    const reservation = (
      await db.query<{ id: string }>(
        'select public.reserve_account_contact_mutation($1,$2,$3,$4,$5) id',
        [
          ids.client,
          'UPDATE',
          'changed@example.test',
          'Nombre administrativo',
          JSON.stringify({ ...contact, city: 'Valparaíso' }),
        ],
      )
    ).rows[0].id;
    await db.exec('set role supabase_auth_admin');
    await db.query('update auth.users set email=$2,raw_user_meta_data=$3 where id=$1', [
      ids.client,
      'changed@example.test',
      JSON.stringify({ full_name: 'Nombre administrativo' }),
    ]);
    await identity(db, ids.admin);
    assert.equal(
      (
        await db.query<{ done: boolean }>('select public.account_mutation_completed($1) done', [
          reservation,
        ])
      ).rows[0].done,
      true,
    );
    assert.equal(
      (
        await db.query<{ city: string }>('select city from account_details where user_id=$1', [
          ids.client,
        ])
      ).rows[0].city,
      'Valparaíso',
    );
    const provisioned = (
      await db.query<{ id: string }>(
        'select public.reserve_account_contact_provisioning($1,$2,$3,$4) id',
        ['new-contact@example.test', 'Nueva cuenta', 'CLIENT', JSON.stringify(contact)],
      )
    ).rows[0].id;
    await db.exec('set role supabase_auth_admin');
    await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)', [
      provisioned,
      'new-contact@example.test',
      JSON.stringify({ full_name: 'Nombre imitado' }),
    ]);
    await identity(db, ids.admin);
    assert.equal(
      (
        await db.query<{ full_name: string }>('select full_name from profiles where id=$1', [
          provisioned,
        ])
      ).rows[0].full_name,
      'Nueva cuenta',
    );
    assert.deepEqual(
      (
        await db.query('select address,phone,city,country from account_details where user_id=$1', [
          provisioned,
        ])
      ).rows[0],
      contact,
    );
    await db.query("select public.reserve_account_mutation($1,'DELETE',null,null)", [provisioned]);
    await db.exec('set role supabase_auth_admin');
    await db.query('delete from auth.users where id=$1', [provisioned]);
    await identity(db, ids.admin);
    assert.equal(
      (await db.query('select * from account_details where user_id=$1', [provisioned])).rows.length,
      0,
    );
    const events = (
      await db.query<{ metadata: unknown }>(
        "select metadata from audit_logs where action='ACCOUNT_CONTACT_UPDATED'",
      )
    ).rows;
    assert.ok(events.length >= 3);
    assert.ok(!JSON.stringify(events).includes(contact.address));
    assert.ok(!JSON.stringify(events).includes(contact.phone));
  } finally {
    await db.close();
  }
});
