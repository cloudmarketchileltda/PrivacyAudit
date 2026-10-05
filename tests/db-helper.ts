import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
export async function database(phase = 2) {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
  );
  for (const name of (await readdir('supabase/migrations')).sort()) {
    if (phase === 1 && !name.includes('_phase1_')) continue;
    await db.exec(await readFile(`supabase/migrations/${name}`, 'utf8'));
  }
  return db;
}
export async function identity(db: PGlite, id: string, role = 'authenticated') {
  await db.exec(
    `reset role; select set_config('request.jwt.claim.sub','${id}',false); set role ${role};`,
  );
}
export const ids = {
  a: '10000000-0000-4000-8000-000000000001',
  b: '10000000-0000-4000-8000-000000000002',
  client: '10000000-0000-4000-8000-000000000003',
  other: '10000000-0000-4000-8000-000000000004',
  admin: '10000000-0000-4000-8000-000000000005',
};
export async function users(db: PGlite) {
  for (const [name, id] of Object.entries(ids))
    await db.query(
      `insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)`,
      [id, `${name}@example.test`, JSON.stringify({ full_name: name, role: 'SUPER_ADMIN' })],
    );
  await db.exec(
    `update public.profiles set role='CONSULTANT' where id in ('${ids.a}','${ids.b}'); update public.profiles set role='SUPER_ADMIN' where id='${ids.admin}';`,
  );
}
export async function org(db: PGlite, name: string, rut: string) {
  const { rows } = await db.query<{ id: string }>(
    `select public.create_organization($1::jsonb) as id`,
    [JSON.stringify({ legal_name: name, rut })],
  );
  return rows[0].id;
}
