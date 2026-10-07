// Generates the Supabase contract from the migrated local PostgreSQL schema, not an assumed remote database.
import { format } from 'prettier';
import { writeFile } from 'node:fs/promises';
import { database } from '../tests/db-helper';
const db = await database();
try {
  const { rows: enums } = await db.query<{ name: string; values: string[] }>(
    `select t.typname as name,array_agg(e.enumlabel order by e.enumsortorder) as values from pg_type t join pg_enum e on e.enumtypid=t.oid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' group by t.typname`,
  );
  const names = new Set(enums.map((e) => e.name));
  function type(name: string) {
    if (name === '_text') return 'string[]';
    if (names.has(name)) return `Database['public']['Enums']['${name}']`;
    if (['int2', 'int4', 'int8', 'numeric', 'float4', 'float8'].includes(name)) return 'number';
    if (name === 'bool') return 'boolean';
    if (name === 'jsonb' || name === 'json') return 'Json';
    if (name === 'void') return 'undefined';
    return 'string';
  }
  const { rows: columns } = await db.query<{
    table_name: string;
    column_name: string;
    udt_name: string;
    is_nullable: string;
    column_default: string | null;
  }>(
    `select table_name,column_name,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' order by table_name,ordinal_position`,
  );
  const tables = [...new Set(columns.map((c) => c.table_name))];
  let output = `// Generated from actual local migrations in PostgreSQL PGlite. Regenerate: npm run types:local.\nexport type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\nexport interface Database { public: { Tables: {\n`;
  for (const table of tables) {
    const cols = columns.filter((c) => c.table_name === table);
    const fields = (mode: string) =>
      cols
        .map(
          (c) =>
            `${c.column_name}${mode === 'Update' || (mode === 'Insert' && (c.column_default !== null || c.is_nullable === 'YES')) ? '?' : ''}: ${type(c.udt_name)}${c.is_nullable === 'YES' ? ' | null' : ''};`,
        )
        .join('\n');
    output += `${table}: { Row: {${fields('Row')}}; Insert: {${fields('Insert')}}; Update: {${fields('Update')}}; Relationships: [] };\n`;
  }
  output += '}; Views: Record<string, never>; Functions: {\n';
  const { rows: functions } = await db.query<{
    name: string;
    returns: string;
    defaults: number;
    args: { name: string; type: string }[];
  }>(
    `select p.proname as name,t.typname as returns,p.pronargdefaults as defaults,coalesce((select jsonb_agg(jsonb_build_object('name',p.proargnames[a.n],'type',at.typname) order by a.n) from unnest(p.proargtypes) with ordinality a(oid,n) join pg_type at on at.oid=a.oid),'[]') as args from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_type t on t.oid=p.prorettype where n.nspname='public' order by p.proname`,
  );
  for (const fn of functions)
    output += `${fn.name}: { Args: ${fn.args.length ? `{${fn.args.map((a, i) => `${a.name}${i >= fn.args.length - fn.defaults ? '?' : ''}: ${type(a.type)}${a.name === 'member_role' ? ' | null' : ''}`).join(';')}}` : 'Record<string, never>'}; Returns: ${type(fn.returns)} };\n`;
  output += '}; Enums: {\n';
  for (const e of enums)
    output += `${e.name}: ${e.values.map((v) => JSON.stringify(v)).join(' | ')};\n`;
  output += '}; CompositeTypes: Record<string, never>; } }\n';
  await writeFile(
    'src/types/database.ts',
    await format(output, { parser: 'typescript', singleQuote: true, printWidth: 100 }),
  );
  console.log('Generated src/types/database.ts from migrated local schema.');
} finally {
  await db.close();
}
