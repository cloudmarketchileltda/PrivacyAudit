'use client';
import Link from 'next/link';
import { useActionState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import { saveWorkflow } from './actions';
import {
  workflowSchema,
  type WorkflowInput,
  findingLabels,
  taskLabels,
  severityLabels,
} from './schemas';
const subscribe = () => () => {};
export type Choice = { id: string; label: string; assessment_id?: string };
export function WorkflowForm({
  initial,
  members,
  assessments = [],
  controls = [],
}: {
  initial: Partial<WorkflowInput> & Pick<WorkflowInput, 'kind' | 'organization_id'>;
  members: Choice[];
  assessments?: Choice[];
  controls?: Choice[];
}) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [state, action, pending] = useActionState(saveWorkflow, {} as ActionState);
  const {
    register,
    watch,
    getValues,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<WorkflowInput>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      id: '',
      assessment_id: '',
      control_id: '',
      finding_id: '',
      title: '',
      description: '',
      recommendation: '',
      area: '',
      priority: 'MEDIUM',
      status: initial.kind === 'finding' ? 'OPEN' : 'TODO',
      assigned_to: '',
      closure_note: '',
      reviewer_comment: '',
      ...initial,
      due_date: initial.due_date?.slice(0, 10) || '',
    },
  });
  const values = watch();
  const selected = values.assessment_id;
  const finding = initial.kind === 'finding';
  const immutable = Boolean(initial.id);
  function error(key: keyof WorkflowInput) {
    return (
      errors[key] && (
        <p role="alert" className="text-sm text-red-700">
          {errors[key]?.message}
        </p>
      )
    );
  }
  function text(key: keyof WorkflowInput, label: string, multiline = false) {
    return (
      <div>
        <label className="form-label" htmlFor={key}>
          {label}
        </label>
        {multiline ? (
          <textarea
            id={key}
            className="field"
            rows={4}
            maxLength={10000}
            {...register(key)}
            value={values[key]}
            aria-invalid={Boolean(errors[key])}
          />
        ) : (
          <input
            id={key}
            className="field"
            maxLength={200}
            {...register(key)}
            value={values[key]}
            aria-invalid={Boolean(errors[key])}
          />
        )}{' '}
        {error(key)}
      </div>
    );
  }
  function select(key: keyof WorkflowInput, label: string, options: Record<string, string>) {
    return (
      <div>
        <label className="form-label" htmlFor={key}>
          {label}
        </label>
        <select
          id={key}
          className="field"
          value={values[key]}
          {...register(key, {
            onChange: () => {
              if (key === 'assessment_id') setValue('control_id', '');
            },
          })}
          aria-invalid={Boolean(errors[key])}
        >
          {Object.entries(options).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
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
      className="space-y-6"
      onSubmit={(e) => {
        if (!workflowSchema.safeParse(getValues()).success) {
          e.preventDefault();
          void trigger();
        }
      }}
    >
      <fieldset disabled={!hydrated} className="space-y-6">
        {(['kind', 'organization_id', 'id', 'finding_id'] as const).map((key) => (
          <input key={key} type="hidden" {...register(key)} />
        ))}
        {(finding
          ? (['reviewer_comment'] as const)
          : (['recommendation', 'area', 'closure_note'] as const)
        ).map((key) => (
          <input key={key} type="hidden" {...register(key)} />
        ))}
        {finding && !immutable ? (
          <div className="form-grid">
            {select('assessment_id', 'Evaluación', {
              '': 'Seleccione una evaluación',
              ...Object.fromEntries(assessments.map((x) => [x.id, x.label])),
            })}
            {select('control_id', 'Control histórico (opcional)', {
              '': 'Sin control asociado',
              ...Object.fromEntries(
                controls.filter((x) => x.assessment_id === selected).map((x) => [x.id, x.label]),
              ),
            })}
          </div>
        ) : (
          <>
            <input type="hidden" {...register('assessment_id')} />
            <input type="hidden" {...register('control_id')} />
          </>
        )}
        {text('title', finding ? 'Título del hallazgo' : 'Título de la tarea')}
        {text('description', 'Descripción', true)}
        {finding && text('recommendation', 'Recomendación', true)}
        <div className="form-grid">
          {select('priority', finding ? 'Severidad' : 'Prioridad', severityLabels)}
          {select(
            'status',
            'Estado',
            finding ? findingLabels : immutable ? taskLabels : { TODO: 'Por hacer' },
          )}
          {select('assigned_to', 'Responsable', {
            '': 'Sin asignar',
            ...Object.fromEntries(members.map((x) => [x.id, x.label])),
          })}
          <label className="form-label">
            Fecha objetivo
            <input
              type="date"
              className="field"
              {...register('due_date')}
              value={values.due_date}
            />
            {error('due_date')}
          </label>
          {finding && text('area', 'Área')}
        </div>
        {finding
          ? text('closure_note', 'Justificación de cierre o riesgo aceptado', true)
          : text('reviewer_comment', 'Observaciones del consultor', true)}
        {!finding && (
          <p className="muted">
            El cliente envía la tarea a revisión. El consultor aprueba o devuelve con observaciones.
            Para aprobar debe estar pendiente de revisión.
          </p>
        )}
        {state.error && (
          <p role="alert" className="error-message">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button disabled={pending}>
            {pending ? 'Guardando…' : finding ? 'Guardar hallazgo' : 'Guardar tarea'}
          </Button>
          <Button asChild variant="outline">
            <Link
              href={
                initial.id
                  ? `/${finding ? 'findings' : 'tasks'}/${initial.id}`
                  : finding
                    ? `/findings?organization=${initial.organization_id}`
                    : `/findings/${initial.finding_id}`
              }
            >
              Cancelar
            </Link>
          </Button>
        </div>
      </fieldset>
    </form>
  );
}
