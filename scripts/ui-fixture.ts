import { assessmentDeletionHandler } from '../supabase/functions/assessment-delete/handler';
import { deletionHandler } from '../supabase/functions/admin-delete-organization/handler';
import { mutationHandler } from '../supabase/functions/admin-manage-user/handler';
import { accountHandler } from '../supabase/functions/admin-create-user/handler';
// Isolated UI test backend. This is NOT Supabase Auth or PostgREST and is never imported by application code.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { database, identity, ids, users, org } from '../tests/db-helper';
import type { PGlite } from '@electric-sql/pglite';
const tables = new Set([
  'profiles',
  'account_details',
  'organizations',
  'organization_members',
  'organization_invitations',
  'controls',
  'assessments',
  'assessment_controls',
  'processing_activities',
  'findings',
  'tasks',
  'audit_logs',
  'evidence',
  'comments',
  'notifications',
  'reports',
]);
const functions = new Set([
  'register_consultant',
  'create_organization',
  'invite_client',
  'accept_invitation',
  'manage_member',
  'set_user_organizations',
  'admin_accounts',
  'save_my_account',
  'admin_membership_users',
  'admin_membership_organizations',
  'set_user_role',
  'revoke_invitation',
  'can_manage_organization',
  'create_assessment',
  'update_client_comment',
  'submit_task',
  'finding_progress',
  'finalize_evidence',
  'dashboard_summary',
  'read_notifications',
  'purge_audit_logs',
  'record_audit_export',
  'record_evidence_download',
  'organization_export_snapshot',
  'record_organization_export',
  'create_report',
  'record_report_download',
]);
function identifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error('Invalid identifier');
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
  response.end(
    JSON.stringify(value, (key, v) =>
      key === 'due_date' && typeof v === 'string' ? v.slice(0, 10) : v,
    ),
  );
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
  await db.exec(
    'create role supabase_auth_admin; grant usage on schema auth to supabase_auth_admin; grant select,insert,update,delete on auth.users to supabase_auth_admin;',
  );
  await db.exec(await readFile('supabase/seed.sql', 'utf8'));
  await identity(db, ids.a);
  const orgA = await org(db, 'Empresa Demo SpA', '76123456-0');
  await identity(db, ids.admin);
  await db.query(
    `update organizations set industry='Servicios profesionales',contact_name='María Pérez',contact_email='maria@example.test',privacy_officer='Juan Gómez' where id=$1`,
    [orgA],
  );
  await identity(db, ids.a);
  const activityId = (
    await db.query<{ id: string }>(
      `insert into processing_activities(organization_id,name,area,purpose,data_subject_categories,personal_data_categories) values($1,'Gestión de clientes','Comercial','Gestionar relaciones comerciales',array['CLIENTS'],array['CONTACT']) returning id`,
      [orgA],
    )
  ).rows[0].id;
  for (let index = 1; index <= 20; index++)
    await db.query(
      `insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,$2,'Registro de prueba para paginación',array['CLIENTS'],array['CONTACT'])`,
      [orgA, `Actividad de prueba ${String(index).padStart(2, '0')}`],
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
  await identity(db, ids.a);
  const findingId = (
    await db.query<{ id: string }>(
      `insert into findings(organization_id,assessment_id,control_id,title,description,severity,assigned_to,area,due_date) values($1,$2,$3,'Retención pendiente','Faltan plazos documentados','HIGH',$4,'Comercial','2020-01-01') returning id`,
      [orgA, assessment, responses[0].id, ids.client],
    )
  ).rows[0].id;
  const taskId = (
    await db.query<{ id: string }>(
      `insert into tasks(organization_id,finding_id,title,assigned_to,due_date) values($1,$2,'Preparar política',$3,'2020-01-01') returning id`,
      [orgA, findingId, ids.client],
    )
  ).rows[0].id;
  const hiddenTaskId = (
    await db.query<{ id: string }>(
      `insert into tasks(organization_id,finding_id,title,assigned_to) values($1,$2,'Revisión privada del consultor',$3) returning id`,
      [orgA, findingId, ids.a],
    )
  ).rows[0].id;
  await identity(db, ids.b);
  const orgB = await org(db, 'Segunda Empresa SpA', '76234567-6');
  await db.query(
    `insert into processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values($1,'Tratamiento privado de B','Actividad aislada',array['EMPLOYEES'],array['EMPLOYMENT'])`,
    [orgB],
  );
  await db.exec('reset role');
  const bucket = (
    await db.query<{ allowed_mime_types: string[] }>(
      `select allowed_mime_types from storage.buckets where id='evidence'`,
    )
  ).rows[0];
  const files = new Map<string, { bytes: Buffer; mime: string }>();
  // Auth is simulated here, not GoTrue: these maps support account UI tests only.
  const accountPasswords = new Map<string, string>();
  const pendingEmails = new Map<string, string>();
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
      if (url.pathname === '/functions/v1/assessment-delete') {
        const data = await body(request);
        const actor = uid(request);
        const handler = assessmentDeletionHandler({
          async authorize() {
            await identity(db, actor);
            return (
              (await db.query<{ role: string }>('select role from profiles where id=$1', [actor]))
                .rows[0] ?? null
            );
          },
          async prepare(assessment) {
            await identity(db, actor);
            await db.query("select prepare_assessment_deletion($1,'ELIMINAR EVALUACION')", [
              assessment,
            ]);
            return (
              await db.query<{ organization_id: string }>(
                'select organization_id from assessments where id=$1',
                [assessment],
              )
            ).rows[0].organization_id;
          },
          async files(assessment) {
            await identity(db, actor);
            return (
              await db.query<{ paths: string[] }>('select assessment_deletion_files($1) paths', [
                assessment,
              ])
            ).rows[0].paths;
          },
          async remove(paths) {
            // Isolated Storage API adapter: remove both bytes and metadata, as the real API does.
            await db.exec('reset role');
            for (const path of paths) {
              await db.query("delete from storage.objects where bucket_id='evidence' and name=$1", [
                path,
              ]);
              files.delete(path);
            }
          },
          async finish(assessment) {
            await identity(db, actor);
            await db.query('select finish_assessment_deletion($1)', [assessment]);
          },
        });
        const result = await handler(
          new Request(url, {
            method: 'POST',
            headers: { Authorization: String(request.headers.authorization || '') },
            body: JSON.stringify(data),
          }),
        );
        json(response, result.status, await result.json());
        return;
      }
      if (url.pathname === '/functions/v1/admin-delete-organization') {
        const data = await body(request);
        const actor = uid(request);
        const handler = deletionHandler({
          async authorize() {
            await identity(db, actor);
            return (
              (await db.query<{ role: string }>('select role from profiles where id=$1', [actor]))
                .rows[0] ?? null
            );
          },
          async prepare(org) {
            await identity(db, actor);
            await db.query("select prepare_organization_deletion($1,'ELIMINAR ORGANIZACION')", [
              org,
            ]);
          },
          async files(org) {
            await identity(db, actor);
            return (
              await db.query<{ paths: string[] }>('select organization_deletion_files($1) paths', [
                org,
              ])
            ).rows[0].paths;
          },
          async remove(paths) {
            // Isolated Storage API adapter: remove both bytes and metadata, as the real API does.
            await db.exec('reset role');
            for (const path of paths) {
              await db.query("delete from storage.objects where bucket_id='evidence' and name=$1", [
                path,
              ]);
              files.delete(path);
            }
          },
          async finish(org) {
            await identity(db, actor);
            await db.query('select finish_organization_deletion($1)', [org]);
          },
        });
        const result = await handler(
          new Request(url, {
            method: 'POST',
            headers: { Authorization: String(request.headers.authorization || '') },
            body: JSON.stringify(data),
          }),
        );
        json(response, result.status, await result.json());
        return;
      }
      if (url.pathname === '/functions/v1/admin-manage-user') {
        const data = await body(request);
        const actor = uid(request);
        const handler = mutationHandler({
          async authorize() {
            const { rows } = await db.query<{ role: string }>(
              'select role from profiles where id=$1',
              [actor],
            );
            return rows[0] ? { id: actor, role: rows[0].role } : null;
          },
          async mutate(input) {
            await identity(db, actor);
            if (input.operation === 'RESET_PASSWORD') {
              const receipt = (
                await db.query<{ id: string }>('select public.reserve_password_reset($1) id', [
                  input.target,
                ])
              ).rows[0].id;
              try {
                await db.transaction(async (tx) => {
                  await tx.exec('set local role supabase_auth_admin');
                  await tx.query('update auth.users set encrypted_password=$2 where id=$1', [
                    input.target,
                    `fixture-hash-${receipt}`,
                  ]);
                  await tx.query(
                    "update auth.users set raw_app_meta_data=raw_app_meta_data||jsonb_build_object('password_reset_receipt',$2::text) where id=$1",
                    [input.target, receipt],
                  );
                });
                accountPasswords.set(input.target, input.password!);
                await identity(db, actor);
                return (
                  await db.query<{ done: boolean }>(
                    'select public.password_reset_completed($1) done',
                    [receipt],
                  )
                ).rows[0].done;
              } finally {
                await identity(db, actor);
                await db.query('select public.cancel_password_reset($1)', [receipt]);
              }
            }
            const { rows } = await db.query<{ id: string }>(
              input.contact
                ? 'select public.reserve_account_contact_mutation($1,$2,$3,$4,$5) id'
                : 'select public.reserve_account_mutation($1,$2,$3,$4) id',
              [
                input.target,
                input.operation,
                input.email ?? null,
                input.full_name ?? null,
                ...(input.contact ? [JSON.stringify(input.contact)] : []),
              ],
            );
            try {
              await db.transaction(async (tx) => {
                await tx.exec('set local role supabase_auth_admin');
                if (input.operation === 'DELETE')
                  await tx.query('delete from auth.users where id=$1', [input.target]);
                else
                  await tx.query(
                    'update auth.users set email=$2,raw_user_meta_data=$3 where id=$1',
                    [input.target, input.email, JSON.stringify({ full_name: input.full_name })],
                  );
              });
              return true;
            } catch {
              return false;
            } finally {
              await identity(db, actor);
              await db.query('select public.cancel_account_mutation($1)', [rows[0].id]);
            }
          },
        });
        const result = await handler(
          new Request(url, {
            method: 'POST',
            headers: { Authorization: String(request.headers.authorization || '') },
            body: JSON.stringify(data),
          }),
        );
        json(response, result.status, await result.json());
        return;
      }
      if (url.pathname === '/functions/v1/admin-create-user') {
        const data = await body(request);
        const handler = accountHandler({
          async authorize() {
            const id = uid(request);
            if (!Object.values(ids).includes(id)) return null;
            const { rows } = await db.query<{ role: string }>(
              'select role from profiles where id=$1',
              [id],
            );
            return rows[0] ? { id, role: rows[0].role } : null;
          },
          async create(input, actor) {
            await identity(db, actor);
            const { rows } = await db.query<{ id: string }>(
              'select public.reserve_account_contact_provisioning($1,$2,$3,$4) as id',
              [input.email, input.full_name, input.role, JSON.stringify(input.contact)],
            );
            const id = rows[0].id;
            try {
              await db.transaction(async (tx) => {
                await tx.exec('set local role supabase_auth_admin');
                await tx.query(
                  'insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values($1,$2,now(),$3,$4)',
                  [
                    id,
                    input.email,
                    JSON.stringify({ full_name: input.full_name }),
                    JSON.stringify({ provider: 'email', providers: ['email'] }),
                  ],
                );
              });
              return { id };
            } catch {
              return { error: 'creation_failed' };
            }
          },
        });
        const result = await handler(
          new Request(url, {
            method: request.method,
            headers: { Authorization: String(request.headers.authorization || '') },
            body: JSON.stringify(data),
          }),
        );
        json(response, result.status, await result.json());
        return;
      }
      if (url.pathname === '/auth/v1/token') {
        const data = await body(request);
        await db.exec('reset role');
        const id = (
          await db.query<{ id: string }>('select id from auth.users where email=$1', [data.email])
        ).rows[0]?.id;
        if (!id || data.password !== (accountPasswords.get(id) ?? 'FixturePassword123')) {
          json(response, 400, { error: 'invalid_grant', error_description: 'Invalid credentials' });
          return;
        }
        await db.query('update auth.users set last_sign_in_at=clock_timestamp() where id=$1', [id]);
        await db.query(`insert into auth.audit_log_entries(payload) values($1::json)`, [
          JSON.stringify({ action: 'login', actor_id: id }),
        ]);
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
        await db.exec('reset role');
        const account = (
          await db.query<{ email: string }>('select email from auth.users where id=$1', [id])
        ).rows[0];
        if (request.method === 'PUT') {
          const input = await body(request);
          if (input.password) {
            if (
              input.current_password &&
              input.current_password !== (accountPasswords.get(id) ?? 'FixturePassword123')
            ) {
              json(response, 400, { message: 'Incorrect current password' });
              return;
            }
            accountPasswords.set(id, input.password);
            await identity(db, id, 'supabase_auth_admin');
            await db.query('update auth.users set encrypted_password=$2 where id=$1', [
              id,
              'fixture-password-changed',
            ]);
          }
          if (input.email) pendingEmails.set(id, input.email);
        }
        json(response, 200, {
          ...user(id),
          email: account.email,
          new_email: pendingEmails.get(id),
        });
        return;
      }
      if (url.pathname === '/auth/v1/logout') {
        await db.query(`insert into auth.audit_log_entries(payload) values($1::json)`, [
          JSON.stringify({ action: 'logout', actor_id: uid(request) }),
        ]);
        response.writeHead(204);
        response.end();
        return;
      }
      if (url.pathname.startsWith('/storage/v1/object/')) {
        const id = uid(request);
        const route = decodeURIComponent(url.pathname.slice('/storage/v1/object/'.length));
        const downloading = route.startsWith('authenticated/');
        const key = downloading ? route.slice('authenticated/'.length) : route;
        const path = key.slice('evidence/'.length);
        if (!key.startsWith('evidence')) throw new Error('Unknown bucket');
        const chunks: Buffer[] = [];
        for await (const chunk of request) chunks.push(Buffer.from(chunk));
        const bytes = Buffer.concat(chunks);
        const result = await db.transaction(async (tx) => {
          await tx.query(`select set_config('request.jwt.claim.sub',$1,true)`, [id]);
          await tx.exec(id ? 'set local role authenticated' : 'set local role anon');
          if (request.method === 'GET') {
            const rows = await tx.query(
              `select name from storage.objects where bucket_id='evidence' and name=$1`,
              [path],
            );
            if (!rows.rows.length || !files.has(path)) throw new Error('File unavailable');
            return { kind: 'download', file: files.get(path)! };
          }
          if (request.method === 'DELETE') {
            const payload = JSON.parse(bytes.toString());
            for (const name of payload.prefixes) {
              const rows = await tx.query(
                `delete from storage.objects where bucket_id='evidence' and name=$1 returning name`,
                [name],
              );
              if (rows.rows.length) files.delete(name);
            }
            return { kind: 'json', value: [] };
          }
          if (request.method === 'POST') {
            const req = new Request('http://fixture/upload', {
              method: 'POST',
              headers: { 'Content-Type': String(request.headers['content-type']) },
              body: bytes,
            });
            const form = await req.formData();
            const file = [...form.values()].find((v) => v instanceof File) as File | undefined;
            if (!file || file.size < 1 || file.size > 10485760) throw new Error('Invalid file');

            if (!bucket.allowed_mime_types.includes(file.type)) throw new Error('Invalid MIME');
            await tx.query(
              `insert into storage.objects(bucket_id,name,metadata) values('evidence',$1,$2::jsonb)`,
              [path, JSON.stringify({ size: file.size, mimetype: file.type })],
            );
            files.set(path, { bytes: Buffer.from(await file.arrayBuffer()), mime: file.type });
            return { kind: 'json', value: { Key: `evidence/${path}`, Id: 'fixture' } };
          }
          throw new Error('Unsupported Storage method');
        });
        if (result.kind === 'download' && result.file) {
          response.writeHead(200, {
            'Content-Type': result.file.mime,
            'Access-Control-Allow-Origin': '*',
          });
          response.end(result.file.bytes);
        } else json(response, 200, result.value);
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
            args.map(([key, v]) =>
              fn === 'set_user_organizations' &&
              ['organizations', 'expected_organizations'].includes(key) &&
              Array.isArray(v)
                ? `{${v.join(',')}}`
                : typeof v === 'object' && v !== null
                  ? JSON.stringify(v)
                  : v,
            ),
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
          if (op === 'is' && match === 'null') filters.push(`${identifier(key)} is null`);
          else if (op === 'not' && match === 'is.null')
            filters.push(`${identifier(key)} is not null`);
          else if (op === 'eq') filters.push(`${identifier(key)}=${param(match)}`);
          else if (op === 'neq') filters.push(`${identifier(key)}<>${param(match)}`);
          else if (op === 'gte') filters.push(`${identifier(key)}>=${param(match)}`);
          else if (op === 'lte') filters.push(`${identifier(key)}<=${param(match)}`);
          else if (op === 'gt') filters.push(`${identifier(key)}>${param(match)}`);
          else if (op === 'lt') filters.push(`${identifier(key)}<${param(match)}`);
          else if (op === 'not' && rest[0] === 'in') {
            const entries = rest
              .slice(1)
              .join('.')
              .replace(/^\(|\)$/g, '')
              .split(',');
            filters.push(`${identifier(key)} not in (${entries.map((v) => param(v)).join(',')})`);
          } else if (op === 'ilike') filters.push(`${identifier(key)} ilike ${param(match)}`);
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
        code:
          typeof error === 'object' && error !== null && 'code' in error
            ? String(error.code)
            : 'FIXTURE_ERROR',
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
    findingId,
    taskId,
    hiddenTaskId,
    activityId,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.close();
    },
  };
}
