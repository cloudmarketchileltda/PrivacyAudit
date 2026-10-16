// Compartido por Next.js, Function, generación SQL y pruebas. Sin secretos.
export const legalAiLimits = {
  dailyQueries: 20,
  pilotBudgetMicros: 10_000_000,
  questionMaxLength: 1000,
  questionMaxBytes: 4000,
  chunkMaxLength: 1600,
  embeddingDimensions: 256,
  contextChunks: 5,
  outputTokens: 1200,
  responseMaxLength: 4000,
  requestMaxBytes: 6000,
  timeoutMs: 45000,
} as const;
export const legalAiModel = {
  provider: 'openai',
  responseModel: 'gpt-5-mini-2025-08-07',
  embeddingModel: 'text-embedding-3-small',
  // USD por millón de tokens = micro-USD por token. Revisadas 16-10-2026.
  inputMicrosPerToken: 0.25,
  outputMicrosPerToken: 2,
  embeddingMicrosPerToken: 0.02,
} as const;
