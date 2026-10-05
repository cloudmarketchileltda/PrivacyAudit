// Isolated UI test backend. This is NOT Supabase Auth or PostgREST and is never imported by application code.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from '../tests/db-helper';
import type { PGlite } from '@electric-sql/pglite';
const tables = new Set([
  'profiles',
  'organizations',
  'organization_members',
  'organization_invitations',
  'controls',
  'assessments',
  'assessment_controls',
]);
const functions = new Set([
  'register_consultant',
  'create_organization',
  'invite_client',
  'accept_invitation',
  'manage_member',
  'set_user_role',
  'revoke_invitation',
  'can_manage_organization',
  'create_assessment',
  'update_client_comment',
]);
function identifier(value: string) {
  if (!/^[a-z_]+$/.test(value)) throw new Error('Invalid identifier');
  return `"${value}"`;
}
function tokenFor(id: string) {
  return `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) })).toString('base64url')}.Zml4dHVyZQ`;
}
function uid(request: IncomingMessage) {
  try {
    return JSON.parse(
      Buffer.from(
        (request.headers.authorization || '').split(' ')[1].split('.')[1],
        'base64url',
      ).toString(),
    ).sub as string;
  } catch {
    return '';
  }
}
async function body(request: IncomingMessage) {
  let s = '';
  for await (const piece of request) s += piece;
  return s ? JSON.parse(s) : {};
}
function json(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  });
  response.end(JSON.stringify(value));
}
function user(id: string) {
  const name = Object.entries(ids).find(([, value]) => value === id)?.[0] || 'a';
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `${name}@example.test`,
    email_confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { full_name: name },
    identities: [],
  };
}
export async function startFixture(port = 54331) {
  const db: PGlite = await database();
  await users(db);
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  await identity(db, ids.a);
  const orgA = await org(db, 'Empresa Demo SpA', '76123456-0');
  await db.query(
    `update organizations set industry='Servicios profesionales',contact_name='María Pérez',contact_email='maria@example.test',privacy_officer='Juan Gómez' where id=$1`,
    [orgA],
  );
  const assessment = (
    await db.query<{ id: string }>(
      `select create_assessment($1,'Diagnóstico inicial','Evaluación de prácticas y documentación') id`,
      [orgA],
    )
  ).rows[0].id;
  await db.query(`update assessments set status='IN_PROGRESS' where id=$1`, [assessment]);
  const responses = (
    await db.query<{ id: string }>(
      `select id from assessment_controls where assessment_id=$1 order by snapshot->>'code'`,
      [assessment],
    )
  ).rows;
  for (let i = 0; i < 15; i++)
    await db.query(
      `update assessment_controls set status=$1,auditor_comment='Antecedentes revisados en entrevista con el responsable.' where id=$2`,
      [i < 10 ? 'CONFORM' : i < 13 ? 'PARTIAL' : 'NON_CONFORM', responses[i].id],
    );
  const invite = (
    await db.query<{ token: string }>(`select invite_client($1,'client@example.test') token`, [
      orgA,
    ])
  ).rows[0].token;
  await identity(db, ids.client);
  await db.query(`select accept_invitation($1)`, [invite]);
  await identity(db, ids.b);
  const orgB = await org(db, 'Segunda Empresa SpA', '76234567-6');
  await db.exec('reset role');
  const server = createServer(async (request, response) => {
    try {
      if (request.method === 'OPTIONS') {
        response.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Allow-Methods': '*',
        });
        response.end();
        return;
      }
      const url = new URL(request.url || '/', `http://localhost:${port}`);
      if (url.pathname === '/auth/v1/token') {
        const data = await body(request);
        const name = String(data.email || '').split('@')[0] as keyof typeof ids;
        const id = ids[name];
        if (!id || data.password !== 'FixturePassword123') {
          json(response, 400, { error: 'invalid_grant', error_description: 'Invalid credentials' });
          return;
        }
        json(response, 200, {
          access_token: tokenFor(id),
          refresh_token: `fixture-${id}`,
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: user(id),
        });
        return;
      }
      if (url.pathname === '/auth/v1/user') {
        const id = uid(request);
        if (!Object.values(ids).includes(id)) {
          json(response, 401, { message: 'Not authenticated' });
          return;
        }
        json(response, 200, user(id));
        return;
      }
      if (url.pathname === '/auth/v1/logout') {
        response.writeHead(204);
        response.end();
        return;
      }
      if (!url.pathname.startsWith('/rest/v1/')) {
        json(response, 404, { message: 'Fixture endpoint missing' });
        return;
      }
      const path = url.pathname.slice('/rest/v1/'.length);
      const id = uid(request);
      const payload = await body(request);
      const result = await db.transaction(async (tx) => {
        await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [id]);
        await tx.exec(id ? 'set local role authenticated' : 'set local role anon');
        if (path.startsWith('rpc/')) {
          const fn = path.slice(4);
          if (!functions.has(fn)) throw new Error('Unknown RPC');
          const args = Object.entries(payload);
          const query = `select public.${identifier(fn)}(${args.map(([key], i) => `${identifier(key)} => $${i + 1}`).join(',')}) as value`;
          const result = await tx.query<{ value: unknown }>(
            query,
            args.map(([, v]) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v)),
          );
          return { value: result.rows[0].value, count: 1 };
        }
        if (!tables.has(path)) throw new Error('Unknown table');
        const table = `public.${identifier(path)}`;
        const values: unknown[] = [];
        const param = (v: unknown) => {
          values.push(v);
          return `$${values.length}`;
        };
        const filters: string[] = [];
        for (const [key, value] of url.searchParams) {
          if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
          if (key === 'or') {
            const alternatives = value
              .replace(/^\(|\)$/g, '')
              .split(',')
              .map((clause) => {
                const [column, op, ...rest] = clause.split('.');
                if (op !== 'ilike') throw new Error('Unsupported OR');
                return `${identifier(column)} ilike ${param(rest.join('.'))}`;
              });
            filters.push(`(${alternatives.join(' or ')})`);
            continue;
          }
          const [op, ...rest] = value.split('.');
          const match = rest.join('.');
          if (op === 'eq') filters.push(`${identifier(key)}=${param(match)}`);
          else if (op === 'ilike') filters.push(`${identifier(key)} ilike ${param(match)}`);
          else if (op === 'in') {
            const entries = match.replace(/^\(|\)$/g, '').split(',');
            filters.push(`${identifier(key)} in (${entries.map((v) => param(v)).join(',')})`);
          } else throw new Error(`Unsupported filter ${value}`);
        }
        const where = filters.length ? ` where ${filters.join(' and ')}` : '';
        const select = (url.searchParams.get('select') || '*')
          .split(',')
          .map((v) => (v === '*' ? '*' : identifier(v)))
          .join(',');
        if (request.method === 'GET' || request.method === 'HEAD') {
          const count = (
            await tx.query<{ total: number }>(
              `select count(*)::int as total from ${table}${where}`,
              values,
            )
          ).rows[0].total;
          const order = url.searchParams
            .get('order')
            ?.split(',')
            .map((value) => {
              const [key, direction] = value.split('.');
              return `${identifier(key)} ${direction === 'desc' ? 'desc' : 'asc'}`;
            })
            .join(',');
          const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
          const limit = Math.min(1000, Number(url.searchParams.get('limit') || 1000));
          const data = await tx.query(
            `select ${select} from ${table}${where}${order ? ` order by ${order}` : ''} limit ${limit} offset ${offset}`,
            values,
          );
          return { value: data.rows, count };
        }
        if (request.method === 'PATCH') {
          const pairs = Object.entries(payload);
          const set = pairs.map(([key, value]) => `${identifier(key)}=${param(value)}`).join(',');
          const data = await tx.query(
            `update ${table} set ${set}${where} returning ${select}`,
            values,
          );
          return { value: data.rows, count: data.rows.length };
        }
        if (request.method === 'DELETE') {
          const data = await tx.query(`delete from ${table}${where} returning ${select}`, values);
          return { value: data.rows, count: data.rows.length };
        }
        if (request.method === 'POST') {
          const pairs = Object.entries(payload);
          const data = await tx.query(
            `insert into ${table}(${pairs.map(([key]) => identifier(key)).join(',')}) values(${pairs.map(([, value]) => param(value)).join(',')}) returning ${select}`,
            values,
          );
          return { value: data.rows, count: data.rows.length };
        }
        throw new Error('Unsupported method');
      });
      response.setHeader('Content-Range', `0-${Math.max(0, result.count - 1)}/${result.count}`);
      if (request.method === 'HEAD') {
        response.writeHead(200);
        response.end();
        return;
      }
      const single = String(request.headers.accept || '').includes(
        'application/vnd.pgrst.object+json',
      );
      if (single && Array.isArray(result.value)) {
        if (result.value.length !== 1) {
          json(response, 406, { code: 'PGRST116', message: 'No rows' });
          return;
        }
        json(response, 200, result.value[0]);
        return;
      }
      json(response, 200, result.value);
    } catch (error) {
      json(response, 400, {
        code: 'FIXTURE_ERROR',
        message: error instanceof Error ? error.message : 'Error',
      });
    }
  });
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  return {
    db,
    orgA,
    orgB,
    assessment,
    responseId: responses[0].id,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.close();
    },
  };
}
