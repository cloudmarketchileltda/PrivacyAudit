'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@/lib/validation';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import type { Database } from '@/types/database';
import { saveProcessing } from './actions';
import {
  processingSchema,
  subjectLabels,
  dataLabels,
  statusLabels,
  basisLabels,
  tristateLabels,
} from './schemas';
export type ProcessingActivity = Database['public']['Tables']['processing_activities']['Row'];
export function ProcessingForm({
  organizationId,
  activity,
}: {
  organizationId: string;
  activity?: ProcessingActivity;
}) {
  const [state, action, pending] = useActionState(saveProcessing, {} as ActionState);
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<z.input<typeof processingSchema>, unknown, z.output<typeof processingSchema>>({
    resolver: zodResolver(processingSchema),
    defaultValues: {
      name: '',
      area: '',
      owner: '',
      purpose: '',
      data_subject_categories: [],
      personal_data_categories: [],
      sensitive_data: 'UNKNOWN',
      source: '',
      legal_basis: 'UNDETERMINED',
      legal_basis_details: '',
      systems: '',
      recipients: '',
      processors: '',
      international_transfer: 'UNKNOWN',
      international_transfer_details: '',
      retention_period: '',
      retention_criteria: '',
      security_measures: '',
      notes: '',
      status: 'DRAFT',
      ...(activity
        ? {
            ...activity,
            data_subject_categories: activity.data_subject_categories as z.input<
              typeof processingSchema
            >['data_subject_categories'],
            personal_data_categories: activity.personal_data_categories as z.input<
              typeof processingSchema
            >['personal_data_categories'],
            legal_basis: activity.legal_basis as keyof typeof basisLabels,
          }
        : {}),
    },
  });
  type Key = keyof z.input<typeof processingSchema>;
  function error(key: Key) {
    return (
      errors[key] && (
        <p role="alert" id={`error-${key}`} className="mt-1 text-sm text-red-700">
          {errors[key]?.message}
        </p>
      )
    );
  }
  function textarea(key: Key, label: string, rows = 3) {
    return (
      <div key={key}>
        <label className="form-label" htmlFor={key}>
          {label}
        </label>
        <textarea
          id={key}
          className="field"
          rows={rows}
          maxLength={key === 'notes' ? 10000 : 5000}
          {...register(key)}
          aria-invalid={Boolean(errors[key])}
          aria-describedby={errors[key] ? `error-${key}` : undefined}
        />
        {error(key)}
      </div>
    );
  }
  function select(key: Key, label: string, options: Record<string, string>) {
    return (
      <div>
        <label className="form-label" htmlFor={key}>
          {label}
        </label>
        <select id={key} className="field" {...register(key)} aria-invalid={Boolean(errors[key])}>
          {Object.entries(options).map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
        {error(key)}
      </div>
    );
  }
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!processingSchema.safeParse(getValues()).success) {
          e.preventDefault();
          void trigger();
        }
      }}
      className="space-y-8"
    >
      <input type="hidden" name="organization_id" value={organizationId} />
      {activity && <input type="hidden" name="id" value={activity.id} />}
      <section>
        <h2 className="section-title">Actividad y responsables</h2>
        <div className="form-grid">
          {(
            [
              ['name', 'Nombre del tratamiento'],
              ['area', 'Área'],
              ['owner', 'Responsable interno (nombre o cargo)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="form-label" htmlFor={key}>
                {label}
              </label>
              <input
                id={key}
                className="field"
                maxLength={200}
                required={key === 'name'}
                {...register(key)}
                aria-invalid={Boolean(errors[key])}
                aria-describedby={errors[key] ? `error-${key}` : undefined}
              />
              {error(key)}
            </div>
          ))}
          {select('status', 'Estado', statusLabels)}
        </div>
        <div className="mt-5">{textarea('purpose', 'Finalidad del tratamiento')}</div>
      </section>
      <section>
        <h2 className="section-title">Titulares y datos</h2>
        <div className="form-grid">
          {(
            [
              ['data_subject_categories', 'Tipos de titulares', subjectLabels],
              ['personal_data_categories', 'Categorías de datos', dataLabels],
            ] as const
          ).map(([key, label, options]) => (
            <fieldset key={key} aria-describedby={errors[key] ? `error-${key}` : undefined}>
              <legend className="form-label mb-3">{label}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(options).map(([value, text]) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" value={value} {...register(key)} />
                    {text}
                  </label>
                ))}
              </div>
              {error(key)}
            </fieldset>
          ))}
          {select('sensitive_data', '¿Trata datos sensibles?', tristateLabels)}
          {textarea('source', 'Origen de los datos')}
        </div>
      </section>
      <section>
        <h2 className="section-title">Base de licitud y sistemas</h2>
        <p className="muted mb-4">
          Registre la base propuesta y su explicación. Su selección requiere revisión profesional y
          no confirma por sí sola su validez jurídica.
        </p>
        <div className="form-grid">
          {select('legal_basis', 'Base de licitud propuesta', basisLabels)}
          {textarea('legal_basis_details', 'Explicación de la base de licitud')}
          {textarea('systems', 'Sistemas utilizados')}
          {textarea('recipients', 'Destinatarios de los datos')}
          {textarea('processors', 'Encargados y proveedores')}
        </div>
      </section>
      <section>
        <h2 className="section-title">Transferencias y conservación</h2>
        <div className="form-grid">
          {select(
            'international_transfer',
            '¿Realiza transferencias internacionales?',
            tristateLabels,
          )}
          {textarea('international_transfer_details', 'Detalle de transferencias internacionales')}
          {textarea('retention_period', 'Plazo de conservación')}
          {textarea('retention_criteria', 'Criterios de conservación y eliminación')}
        </div>
      </section>
      <section>
        <h2 className="section-title">Seguridad y observaciones</h2>
        <div className="form-grid">
          {textarea('security_measures', 'Medidas de seguridad')}
          {textarea('notes', 'Observaciones')}
        </div>
      </section>
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending}>{pending ? 'Guardando…' : 'Guardar tratamiento'}</Button>
        <Button variant="outline" asChild>
          <Link
            href={
              activity
                ? `/organizations/${organizationId}/processing/${activity.id}`
                : `/organizations/${organizationId}/processing`
            }
          >
            Cancelar
          </Link>
        </Button>
      </div>
    </form>
  );
}
