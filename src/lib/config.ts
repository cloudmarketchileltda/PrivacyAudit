// Utilidades de entorno y URL. La configuración pública compartida está en src/config/general.ts.
export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
export function appUrl() {
  return process.env.APP_URL || 'http://localhost:3000';
}
export function safeNext(value: string | null | undefined) {
  return value?.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    ![...value].some(
      (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
    ? value
    : '/dashboard';
}
