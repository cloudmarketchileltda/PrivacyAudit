'use server';
import { requireUser } from '@/features/auth/queries';
import { questionError, type AiResult } from '../../../supabase/functions/legal-assistant/model';
import { revalidatePath } from 'next/cache';
import { generalConfig } from '@/config/general';
export type LegalAiState = AiResult & { done?: boolean };
export async function askLegalAi(_: LegalAiState, form: FormData): Promise<LegalAiState> {
  const { db } = await requireUser();
  const question = form.get('question');
  const error = questionError(question);
  if (error) return { answer: '', sources: [], error };
  const { data, error: invokeError } = await db.functions.invoke('legal-assistant', {
    body: { operation: 'query', question },
  });
  revalidatePath(generalConfig.legalLibrary.href);
  if (invokeError) {
    let message = 'La IA no está disponible. Revise su habilitación, cuota o configuración.';
    try {
      const result = await invokeError.context?.json();
      if (typeof result?.error === 'string' && result.error.length < 300) message = result.error;
    } catch {
      /* No raw errors or credentials exposed. */
    }
    return { answer: '', sources: [], error: message };
  }
  if (!data || typeof data.answer !== 'string' || !Array.isArray(data.sources))
    return { answer: '', sources: [], error: 'Respuesta no disponible.' };
  return { answer: data.answer, sources: data.sources };
}
export async function configureLegalAi(form: FormData) {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN')
    return { error: 'Solo el administrador puede configurar el piloto.' };
  const { error } = await db.rpc('configure_legal_ai', {
    active: form.get('enabled') === 'on',
    everyone: form.get('all_users') === 'on',
  });
  revalidatePath(generalConfig.legalLibrary.href);
  return error
    ? { error: 'No se pudo guardar. Complete la indexación antes de habilitar.' }
    : { success: 'Configuración guardada.' };
}
export async function indexLegalAi(): Promise<{ error?: string; done?: boolean }> {
  const { db, profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') return { error: 'Solo el administrador puede indexar.' };
  const { data, error } = await db.functions.invoke('legal-assistant', {
    body: { operation: 'index' },
  });
  revalidatePath(generalConfig.legalLibrary.href);
  if (error)
    return {
      error:
        'No se pudo indexar. Revise los secretos de la Function, conexión y presupuesto. Puede reanudar después.',
    };
  return { done: data?.done === true };
}
