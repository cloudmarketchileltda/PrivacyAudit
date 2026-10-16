import { legalAiLimits } from './limits.ts';
import { answerSchema, legalInstructions, type LegalChunk } from './model.ts';
export type Usage = { input: number; output: number };
export interface AiProvider {
  embed(text: string, model: string): Promise<{ vector: number[]; usage: Usage }>;
  answer(
    question: string,
    chunks: LegalChunk[],
    model: string,
  ): Promise<{ raw: unknown; usage: Usage }>;
}
export function openAiProvider(key: string, transport: typeof fetch = fetch): AiProvider {
  async function call(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
    const response = await transport(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(legalAiLimits.timeoutMs),
    });
    if (!response.ok) throw new Error('provider_unavailable');
    return response.json(); // Never log provider payloads or exceptions containing user text.
  }
  return {
    async embed(text, model) {
      const result = await call('embeddings', {
        model,
        input: text,
        dimensions: legalAiLimits.embeddingDimensions,
        encoding_format: 'float',
      });
      const data = result.data as { embedding: number[] }[];
      const vector = data?.[0]?.embedding;
      if (
        !Array.isArray(vector) ||
        vector.length !== legalAiLimits.embeddingDimensions ||
        vector.some((n) => !Number.isFinite(n))
      )
        throw new Error('invalid_embedding');
      const usage = result.usage as { total_tokens: number };
      if (!Number.isSafeInteger(usage?.total_tokens) || usage.total_tokens < 0)
        throw new Error('missing_usage');
      return { vector, usage: { input: usage.total_tokens, output: 0 } };
    },
    async answer(question, chunks, model) {
      const result = await call('responses', {
        model,
        store: false,
        instructions: legalInstructions,
        input: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          question,
          fragments: chunks,
        }),
        max_output_tokens: legalAiLimits.outputTokens,
        reasoning: { effort: 'minimal' },
        text: {
          format: { type: 'json_schema', name: 'legal_answer', strict: true, schema: answerSchema },
        },
      });
      const usage = result.usage as { input_tokens: number; output_tokens: number };
      if (
        ![usage?.input_tokens, usage?.output_tokens].every((n) => Number.isSafeInteger(n) && n >= 0)
      )
        throw new Error('missing_usage');
      if (result.status !== 'completed') throw new Error('incomplete_answer');
      const output = result.output as {
        type: string;
        content?: { type: string; text?: string }[];
      }[];
      const text = output
        ?.flatMap((item) => item.content ?? [])
        .filter((part) => part.type === 'output_text')
        .map((part) => part.text ?? '')
        .join('');
      return {
        raw: JSON.parse(text),
        usage: { input: usage.input_tokens, output: usage.output_tokens },
      };
    },
  };
}
