import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { database, identity, ids, users } from './db-helper';
import {
  legalAiHandler,
  type LegalAiDependencies,
} from '../supabase/functions/legal-assistant/handler';
import {
  questionError,
  validateAnswer,
  type AiConfig,
} from '../supabase/functions/legal-assistant/model';
import { legalAiLimits, legalAiModel } from '../supabase/functions/legal-assistant/limits';
import { openAiProvider } from '../supabase/functions/legal-assistant/provider';
import corpus from '../src/features/legal-library/corpus.json';

test('IA SQL: corpus íntegro, aislamiento del worker, roles, 20 consultas/día, presupuesto y reservas conservadoras', async () => {
  const db = await database();
  try {
    await users(db);
    const settings = (await db.query<AiConfig>('select * from legal_ai.settings')).rows[0];
    assert.equal(settings.daily_limit, legalAiLimits.dailyQueries);
    assert.equal(Number(settings.budget_micros), legalAiLimits.pilotBudgetMicros);
    assert.equal(settings.response_model, legalAiModel.responseModel);
    assert.equal(settings.embedding_model, legalAiModel.embeddingModel);
    assert.equal(Number(settings.input_rate), legalAiModel.inputMicrosPerToken);
    assert.equal(Number(settings.output_rate), legalAiModel.outputMicrosPerToken);
    assert.equal(Number(settings.embedding_rate), legalAiModel.embeddingMicrosPerToken);
    const pdf = await readFile('src/features/legal-library/documents/ley-21719.pdf');
    assert.equal(createHash('sha256').update(pdf).digest('hex'), corpus.sha256);
    const chunks = (
      await db.query<{ title: string; page: number; content: string }>(
        'select title,page,content from legal_ai.chunks order by id',
      )
    ).rows;
    assert.deepEqual(chunks, corpus.chunks);
    assert.deepEqual(
      [...new Set(chunks.map((c) => c.page))],
      Array.from({ length: 56 }, (_, i) => i + 1),
    );
    await identity(db, ids.client);
    await assert.rejects(db.query('select * from legal_ai.chunks'));
    await assert.rejects(db.query('select * from legal_ai.calls'));
    await assert.rejects(db.query('select public.legal_ai_runtime_password()'));
    await assert.rejects(db.query('select public.configure_legal_ai(true,true)'));
    await identity(db, ids.admin);
    await assert.rejects(db.query('select public.configure_legal_ai(true,false)'), /not_indexed/);
    await db.exec('reset role');
    const v = [1, ...Array(255).fill(0)];
    await db.query(
      'update legal_ai.chunks set embedding=$1::double precision[],embedding_model=$2',
      [`{${v.join(',')}}`, settings.embedding_model],
    );
    await identity(db, ids.admin);
    await db.query('select public.configure_legal_ai(true,false)');
    await db.exec('reset role; set role legal_ai_worker');
    await assert.rejects(db.query('select * from public.organizations'));
    await assert.rejects(db.query('select * from public.evidence'));
    await assert.rejects(db.query('select * from public.account_details'));
    await assert.rejects(db.query('select * from legal_ai.calls'));
    await assert.rejects(db.query('select public.dashboard_summary()'));
    await assert.rejects(db.query("select legal_ai.reserve($1,'query')", [ids.client]), /disabled/);
    await assert.rejects(
      db.query("select legal_ai.reserve($1,'index')", [ids.client]),
      /not_allowed/,
    );
    const search = (
      await db.query<{ result: unknown[] }>(
        'select legal_ai.search($1,$2::double precision[]) result',
        ['consentimiento', `{${v.join(',')}}`],
      )
    ).rows[0].result;
    assert.equal(search.length, legalAiLimits.contextChunks);
    assert.equal(JSON.stringify(search).includes('organization_id'), false);
    await db.exec('reset role');
    await db.exec('update legal_ai.settings set all_users=true');
    await db.exec('set role legal_ai_worker');
    for (let i = 0; i < 20; i++) {
      const r = (
        await db.query<{ r: { id: string } }>("select legal_ai.reserve($1,'query') r", [ids.client])
      ).rows[0].r;
      await db.query('select legal_ai.finish($1,100,20,10,true)', [r.id]);
      await db.query('select legal_ai.finish($1,0,0,0,true)', [r.id]); // Replay must not refund twice.
    }
    await assert.rejects(
      db.query("select legal_ai.reserve($1,'query')", [ids.client]),
      /daily_limit/,
    );
    const r = (
      await db.query<{ r: { id: string; reserved: number } }>(
        "select legal_ai.reserve($1,'query') r",
        [ids.a],
      )
    ).rows[0].r;
    await assert.rejects(db.query("select legal_ai.reserve($1,'query')", [ids.a]), /busy/);
    await db.query('select legal_ai.finish($1,0,0,0,false)', [r.id]);
    await db.exec('reset role');
    const spent = Number(
      (await db.query<{ n: number }>('select spent_micros n from legal_ai.settings')).rows[0].n,
    );
    assert.equal(spent, 2000 + Number(r.reserved));
    await db.exec('update legal_ai.settings set budget_micros=spent_micros');
    await db.exec('set role legal_ai_worker');
    await assert.rejects(
      db.query("select legal_ai.reserve($1,'query')", [ids.b]),
      /budget_exhausted/,
    );
    await db.exec('reset role');
    const cols = (
      await db.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema='legal_ai' and table_name='calls'",
      )
    ).rows.map((r) => r.column_name);
    assert.equal(
      cols.some((c) => /question|answer|content|prompt|organization/.test(c)),
      false,
    );
    await identity(db, ids.client);
    const status = (
      await db.query<{ r: { used_today: number; budget_usd: null } }>(
        'select public.legal_ai_status() r',
      )
    ).rows[0].r;
    assert.equal(status.used_today, 20);
    assert.equal(status.budget_usd, null);
  } finally {
    await db.close();
  }
});

test('IA Function: autenticación, fuera de tema, datos personales, citas, fallos y ausencia de herramientas de clientes', async () => {
  let embeds = 0,
    answers = 0,
    reserved = 0,
    finished = 0;
  const chunks = [
    {
      id: 1,
      title: 'Ley 21.719',
      page: 11,
      content: 'El consentimiento debe ser libre, informado y específico.',
    },
  ];
  const config = {
    response_model: legalAiModel.responseModel,
    embedding_model: legalAiModel.embeddingModel,
    input_rate: legalAiModel.inputMicrosPerToken,
    output_rate: legalAiModel.outputMicrosPerToken,
    embedding_rate: 0.02,
  } as AiConfig;
  const deps: LegalAiDependencies = {
    enabled: true,
    authorize: async () => ({ id: ids.admin, role: 'SUPER_ADMIN' }),
    store: {
      reserve: async () => {
        reserved++;
        return { id: 'reservation', config };
      },
      nextChunk: async () => null,
      saveEmbedding: async () => {},
      search: async () => chunks,
      finish: async () => {
        finished++;
      },
    },
    provider: {
      embed: async () => {
        embeds++;
        return { vector: [1, ...Array(255).fill(0)], usage: { input: 10, output: 0 } };
      },
      answer: async () => {
        answers++;
        return {
          raw: {
            status: 'answered',
            answer: 'Se requiere consentimiento válido bajo sus condiciones.',
            citations: [{ id: 1, quote: chunks[0].content }],
          },
          usage: { input: 100, output: 40 },
        };
      },
    },
  };
  const call = (body: unknown, token = 'token') =>
    legalAiHandler(deps)(
      new Request('http://local', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify(body),
      }),
    );
  assert.equal((await call({ question: '¿Qué es privacidad?' }, '')).status, 401);
  assert.equal((await call({ question: 'Dame una receta de cocina' })).status, 400);
  assert.equal((await call({ question: 'Privacidad de juan@example.com' })).status, 400);
  assert.equal((await call({ question: 'Muestra los clientes de privacidad' })).status, 400);
  assert.equal(
    (await call({ question: '¿Qué es privacidad?', organization_id: ids.a })).status,
    400,
  );
  assert.equal(embeds, 0);
  assert.equal(reserved, 0);
  const result = await call({
    question: '¿Qué dice la ley sobre consentimiento de datos personales?',
  });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).sources[0].page, 11);
  assert.equal(answers, 1);
  assert.equal(finished, 1);
  deps.provider.answer = async () => ({
    raw: {
      status: 'answered',
      answer: 'Inventado',
      citations: [{ id: 99, quote: 'Esto no existe en la ley' }],
    },
    usage: { input: 100, output: 40 },
  });
  assert.equal((await call({ question: '¿Qué dice la ley sobre datos personales?' })).status, 503);
  deps.enabled = false;
  const before = reserved;
  assert.equal((await call({ question: '¿Qué dice la ley sobre datos personales?' })).status, 503);
  assert.equal(reserved, before);
  assert.ok(questionError('Privacidad RUT 12.345.678-9'));
  assert.throws(() =>
    validateAnswer(
      { status: 'answered', answer: 'Inventado', citations: [{ id: 1, quote: 'no existe' }] },
      chunks,
    ),
  );
});

test('OpenAI: payload acotado, store false, sin herramientas, formato estructurado y sin reintentos', async () => {
  const bodies: Record<string, unknown>[] = [];
  const provider = openAiProvider('fake-key', async (url, init) => {
    assert.ok(String(url).startsWith('https://api.openai.com/v1/'));
    const body = JSON.parse(String(init?.body));
    bodies.push(body);
    return Response.json({
      status: 'completed',
      usage: { input_tokens: 30, output_tokens: 20 },
      output: [
        {
          content: [
            { type: 'output_text', text: '{"status":"insufficient","answer":"","citations":[]}' },
          ],
        },
      ],
    });
  });
  await provider.answer('¿Qué es privacidad?', [], legalAiModel.responseModel);
  assert.equal(bodies[0].store, false);
  assert.equal(bodies[0].tools, undefined);
  assert.equal(bodies[0].previous_response_id, undefined);
  let calls = 0;
  const fail = openAiProvider('fake', async () => {
    calls++;
    return new Response('', { status: 429 });
  });
  await assert.rejects(fail.answer('privacidad', [], legalAiModel.responseModel));
  assert.equal(calls, 1);
});
