'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@/lib/validation';
import { purgeLog } from './actions';
import { Button } from '@/components/ui/button';
const formSchema = z.object({
  date: z.string().min(1),
  reason: z.string().trim().min(10).max(1000),
  confirmation: z.literal('BORRAR LOG'),
});
export function PurgeForm() {
  const [result, setResult] = useState<{ error?: string; success?: string }>({});
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });
  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        setResult(
          await purgeLog({
            before_time: new Date(v.date).toISOString(),
            reason: v.reason,
            confirmation: v.confirmation,
          }),
        );
      })}
    >
      <p className="muted">
        Elimina definitivamente los eventos de todas las organizaciones anteriores a la fecha
        indicada. Los filtros de consulta no limitan este borrado. Exporte primero los registros que
        necesite conservar. Las constancias de borrado se conservan.
      </p>
      <label className="form-label">
        Borrar eventos anteriores a (hora local)
        <input type="datetime-local" className="field max-w-sm" required {...register('date')} />
      </label>
      <label className="form-label">
        Motivo del borrado
        <textarea className="field" rows={2} {...register('reason')} />
      </label>
      <label className="form-label">
        Escriba BORRAR LOG
        <input className="field max-w-sm" autoComplete="off" {...register('confirmation')} />
      </label>
      {Object.values(errors).map((e, i) => (
        <p key={i} role="alert" className="error-message">
          {e.message}
        </p>
      ))}
      {result.error && (
        <p role="alert" className="error-message">
          {result.error}
        </p>
      )}
      {result.success && (
        <p role="status" className="success-message">
          {result.success}
        </p>
      )}
      <Button variant="destructive" disabled={isSubmitting}>
        {isSubmitting ? 'Borrando…' : 'Borrar eventos anteriores'}
      </Button>
    </form>
  );
}
