import { legalAiLimits } from './limits.ts';
import { questionError, validateAnswer, type AiConfig, type LegalChunk } from './model.ts';
import type { AiProvider } from './provider.ts';
export interface LegalAiStore {
  reserve(actor: string, kind: 'query' | 'index'): Promise<{ id: string; config: AiConfig }>;
  nextChunk(): Promise<LegalChunk | null>;
  saveEmbedding(id: number, model: string, vector: number[]): Promise<void>;
  search(question: string, vector: number[]): Promise<LegalChunk[]>;
  finish(id: string, cost: number, input: number, output: number, success: boolean): Promise<void>;
}
export type LegalAiDependencies = {
  enabled: boolean;
  authorize(token: string): Promise<{ id: string; role: string } | null>;
  store: LegalAiStore;
  provider: AiProvider;
};
export function legalAiHandler(deps: LegalAiDependencies) {
  const json = (value: unknown, status = 200) =>
    Response.json(value, {
      status,
      headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return json({ error: 'Método no disponible.' }, 405);
    let reservation: string | undefined;
    try {
      const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
      if (!token) return json({ error: 'Debe iniciar sesión.' }, 401);
      const actor = await deps.authorize(token);
      if (!actor) return json({ error: 'Sesión no disponible.' }, 401);
      if (!deps.enabled)
        return json(
          {
            error:
              'La IA está desactivada o falta su configuración. Biblioteca y FAQ siguen disponibles.',
          },
          503,
        );
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'Solicitud inválida.' }, 400);
      let raw = '';
      let bytes = 0;
      const decoder = new TextDecoder();
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        bytes += part.value.byteLength;
        if (bytes > legalAiLimits.requestMaxBytes) {
          await reader.cancel();
          return json({ error: 'Solicitud demasiado extensa.' }, 413);
        }
        raw += decoder.decode(part.value, { stream: true });
      }
      raw += decoder.decode();
      const body = JSON.parse(raw) as Record<string, unknown>;
      if (!body || typeof body !== 'object' || Array.isArray(body))
        return json({ error: 'Solicitud inválida.' }, 400);
      const index = body.operation === 'index';
      if (
        Object.keys(body).some((k) => !['question', 'operation'].includes(k)) ||
        (body.operation !== undefined && !['query', 'index'].includes(String(body.operation)))
      )
        return json(
          { error: 'Solo se admiten consultas normativas, sin contexto de clientes.' },
          400,
        );
      if (index && actor.role !== 'SUPER_ADMIN')
        return json({ error: 'Solo el administrador puede preparar la biblioteca.' }, 403);
      const error = index ? null : questionError(body.question);
      if (error) return json({ error }, 400);
      // No spend for completed index. No business tables or external tools in this workflow.
      const next = index ? await deps.store.nextChunk() : null;
      if (index && !next) return json({ done: true });
      const reserved = await deps.store.reserve(actor.id, index ? 'index' : 'query');
      reservation = reserved.id;
      const config = reserved.config;
      const input = index ? next!.content : (body.question as string).trim();
      const embedded = await deps.provider.embed(input, config.embedding_model);
      let cost = embedded.usage.input * config.embedding_rate;
      let totalInput = embedded.usage.input;
      let outputTokens = 0;
      let result: unknown;
      if (index) {
        await deps.store.saveEmbedding(next!.id, config.embedding_model, embedded.vector);
        result = { done: false, indexedPage: next!.page };
      } else {
        const chunks = await deps.store.search(input, embedded.vector);
        if (!chunks.length)
          result = {
            answer: 'No encontré fundamento suficiente. Consulte el texto completo.',
            sources: [],
          };
        else {
          if (
            chunks.length > legalAiLimits.contextChunks ||
            chunks.some(
              (c) =>
                c.content.length > legalAiLimits.chunkMaxLength ||
                !Number.isInteger(c.page) ||
                c.page < 1 ||
                c.page > 56,
            )
          )
            throw new Error('invalid_corpus');
          const answer = await deps.provider.answer(input, chunks, config.response_model);
          totalInput += answer.usage.input;
          outputTokens = answer.usage.output;
          cost += answer.usage.input * config.input_rate + answer.usage.output * config.output_rate;
          result = validateAnswer(answer.raw, chunks);
        }
      }
      await deps.store.finish(reservation, Math.ceil(cost), totalInput, outputTokens, true);
      reservation = undefined;
      return json(result);
    } catch (error) {
      if (reservation) {
        try {
          await deps.store.finish(reservation, 0, 0, 0, false);
        } catch {
          /* Reservation remains charged on failure. */
        }
      }
      // Only known database codes become user text. Never leak SQL, questions, tokens or provider errors.
      const code = error instanceof Error ? error.message : '';
      const messages: Record<string, string> = {
        daily_limit: 'Alcanzó el límite diario. Vuelva a consultar mañana (America/Santiago).',
        budget_exhausted:
          'El presupuesto piloto está agotado. Biblioteca y FAQ siguen disponibles.',
        busy: 'Hay una consulta en curso. Espere antes de reintentar.',
        disabled: 'El piloto todavía no está habilitado para su perfil.',
        not_indexed: 'La biblioteca necesita completar su indexación.',
        not_allowed: 'No tiene autorización para esta operación.',
      };
      if (messages[code])
        return json({ error: messages[code] }, code === 'not_allowed' ? 403 : 429);
      if (error instanceof SyntaxError)
        return json({ error: 'Solicitud o respuesta inválida.' }, 400);
      return json(
        {
          error:
            'No se pudo responder de forma verificable. No hay reintento automático; puede consultar la biblioteca.',
        },
        503,
      );
    }
  };
}
