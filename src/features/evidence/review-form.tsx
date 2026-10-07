'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { reviewSchema } from './schemas';
import { reviewEvidence } from './actions';
export function ReviewForm({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{
    id: string;
    review_status: 'ACCEPTED' | 'REJECTED' | 'CHANGES_REQUESTED';
    reviewer_comment: string;
  }>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { id, review_status: 'ACCEPTED', reviewer_comment: '' },
  });
  async function submit(values: {
    id: string;
    review_status: 'ACCEPTED' | 'REJECTED' | 'CHANGES_REQUESTED';
    reviewer_comment: string;
  }) {
    setError('');
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) form.set(key, value);
    try {
      const result = await reviewEvidence({}, form);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError('No se pudo registrar la revisión. Puede volver a intentarlo.');
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <input type="hidden" {...register('id')} />
      <label className="form-label">
        Resultado
        <select
          aria-label="Resultado"
          className="field"
          {...register('review_status')}
          disabled={isSubmitting}
        >
          <option value="ACCEPTED">Aceptar</option>
          <option value="REJECTED">Rechazar</option>
          <option value="CHANGES_REQUESTED">Solicitar cambios</option>
        </select>
      </label>
      <label className="form-label">
        Observaciones
        <textarea
          className="field"
          rows={4}
          maxLength={10000}
          {...register('reviewer_comment')}
          readOnly={isSubmitting}
        />
      </label>
      <p className="muted">
        Obligatorias para rechazar o solicitar cambios. La revisión registrada se conserva.
      </p>
      {(error || errors.reviewer_comment?.message) && (
        <p className="error-message" role="alert">
          {error || errors.reviewer_comment?.message}
        </p>
      )}
      <Button disabled={isSubmitting}>
        {isSubmitting ? 'Registrando…' : 'Registrar revisión'}
      </Button>
    </form>
  );
}
