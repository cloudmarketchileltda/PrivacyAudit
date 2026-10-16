import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import postgres from 'npm:postgres@3.4.7';
import { legalAiHandler } from './handler.ts';
import { openAiProvider } from './provider.ts';
import type { AiConfig, LegalChunk } from './model.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const publicKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const connection = Deno.env.get('LEGAL_AI_DATABASE_URL');
const key = Deno.env.get('OPENAI_API_KEY') ?? '';
// Dedicated least-privilege LOGIN; never use postgres, service_role or Auth Admin here.
const sql = connection
  ? postgres(connection, {
      prepare: false,
      max: 1,
      ssl: 'require',
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
    })
  : null;
async function scalar<T>(query: string, args: (string | number | boolean)[] = []): Promise<T> {
  if (!sql) throw new Error('not_configured');
  const identity = await sql`select current_user as role`;
  if (identity[0]?.role !== 'legal_ai_worker') throw new Error('restricted_connection_required');
  const rows = await sql.unsafe(query, args);
  return rows[0]?.result as T;
}
Deno.serve(
  legalAiHandler({
    enabled: Deno.env.get('LEGAL_AI_ENABLED') === 'true' && Boolean(sql && key),
    async authorize(token) {
      const client = createClient(url, publicKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);
      if (error || !user) return null;
      const { data, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return profileError || !data ? null : { id: user.id, role: data.role };
    },
    store: {
      reserve: (actor, kind) =>
        scalar<{ id: string; config: AiConfig }>('select legal_ai.reserve($1::uuid,$2) result', [
          actor,
          kind,
        ]),
      nextChunk: () => scalar<LegalChunk | null>('select legal_ai.next_chunk() result'),
      async saveEmbedding(id, model, vector) {
        await scalar('select legal_ai.save_embedding($1,$2,$3::double precision[]) result', [
          id,
          model,
          `{${vector.join(',')}}`,
        ]);
      },
      search: (question, vector) =>
        scalar<LegalChunk[]>('select legal_ai.search($1,$2::double precision[]) result', [
          question,
          `{${vector.join(',')}}`,
        ]),
      async finish(id, cost, input, output, success) {
        await scalar('select legal_ai.finish($1::uuid,$2::bigint,$3,$4,$5) result', [
          id,
          cost,
          input,
          output,
          success,
        ]);
      },
    },
    provider: openAiProvider(key),
  }),
);
