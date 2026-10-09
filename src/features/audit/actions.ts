'use server';
import { requireUser } from '@/features/auth/queries';
export async function purgeLog(input: unknown): Promise<{ error?: string; success?: string }> {
  void input; // Compatibility for previously rendered forms; never execute the former RPC.
  const { profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede borrar el log.' };
  return {
    error:
      'La purga discrecional del historial está deshabilitada por la política de conservación.',
  };
}
