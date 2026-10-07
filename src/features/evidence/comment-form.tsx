'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { commentFieldsSchema } from './schemas';
import { addComment } from './actions';
export function CommentForm({
  org,
  kind,
  item,
}: {
  org: string;
  kind: 'finding' | 'task' | 'evidence';
  item: string;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ body: string }>({
    resolver: zodResolver(commentFieldsSchema),
    defaultValues: { body: '' },
  });
  async function submit({ body }: { body: string }) {
    setError('');
    setSuccess(false);
    const form = new FormData();
    for (const [key, value] of Object.entries({ organization_id: org, kind, item, body }))
      form.set(key, value);
    try {
      const result = await addComment({}, form);
      if (result.error) setError(result.error);
      else {
        reset();
        setSuccess(true);
        router.refresh();
      }
    } catch {
      setError('No se pudo agregar el comentario. Puede volver a intentarlo.');
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <label className="form-label">
        Nuevo comentario
        <textarea
          className="field"
          rows={3}
          maxLength={10000}
          {...register('body')}
          readOnly={isSubmitting}
        />
      </label>
      {(error || errors.body) && (
        <p role="alert" className="error-message">
          {error || 'Escriba un comentario de hasta 10.000 caracteres.'}
        </p>
      )}
      {success && (
        <p role="status" className="success-message">
          Comentario agregado al historial.
        </p>
      )}
      <Button disabled={isSubmitting}>{isSubmitting ? 'Agregando…' : 'Agregar comentario'}</Button>
    </form>
  );
}
