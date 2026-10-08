'use client';
import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import { membershipSchema, type MembershipInput } from './membership-schema';
import { saveMemberships } from './membership-actions';
export type MembershipOrganization = {
  id: string;
  legal_name: string;
  rut: string;
  status: 'ACTIVE' | 'ARCHIVED';
};
export function MembershipForm({
  target,
  role,
  current,
  organizations,
}: {
  target: string;
  role: 'CLIENT' | 'CONSULTANT';
  current: string[];
  organizations: MembershipOrganization[];
}) {
  const id = useId();
  const router = useRouter();
  const [message, setMessage] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MembershipInput>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      target,
      expected_role: role,
      organizations: current,
      expected_organizations: current,
    },
  });
  const selected = useWatch({ control, name: 'organizations' });
  return (
    <form
      className="space-y-3 min-w-64 max-w-lg"
      onSubmit={handleSubmit((input) => {
        setMessage({});
        startTransition(async () => {
          const result = await saveMemberships(input);
          setMessage(result);
          if (result.success) {
            reset({ ...input, expected_organizations: input.organizations });
            router.refresh();
          }
        });
      })}
    >
      <fieldset disabled={pending} className="space-y-3">
        {role === 'CLIENT' ? (
          <>
            <label htmlFor={id} className="form-label">
              Organización del cliente
            </label>
            <select
              id={id}
              className="field"
              value={selected[0] || ''}
              onChange={(event) =>
                setValue('organizations', event.target.value ? [event.target.value] : [], {
                  shouldValidate: true,
                })
              }
            >
              <option value="">Sin organización</option>
              {organizations.map((org) => (
                <option
                  key={org.id}
                  value={org.id}
                  disabled={org.status === 'ARCHIVED' && !current.includes(org.id)}
                >
                  {org.legal_name} · {org.rut}
                  {org.status === 'ARCHIVED' ? ' · Archivada' : ''}
                </option>
              ))}
            </select>
          </>
        ) : (
          <details className="rounded-md border border-slate-300 p-3">
            <summary className="cursor-pointer font-medium">
              Seleccionar organizaciones ({selected.length})
            </summary>
            <div className="mt-3 max-h-64 overflow-y-auto space-y-3">
              {organizations.map((org) => (
                <label key={org.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={org.id}
                    {...register('organizations')}
                    disabled={pending || (org.status === 'ARCHIVED' && !current.includes(org.id))}
                    className="mt-1 shrink-0"
                  />
                  <span className="break-words">
                    {org.legal_name}
                    <span className="block muted">
                      {org.rut}
                      {org.status === 'ARCHIVED' ? ' · Archivada' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </details>
        )}
        {organizations.length === 0 && <p className="muted">No hay organizaciones creadas.</p>}
        {errors.organizations?.message && (
          <p role="alert" className="error-message">
            {errors.organizations.message}
          </p>
        )}
        <Button type="submit" variant="outline">
          {pending
            ? 'Guardando…'
            : role === 'CLIENT'
              ? 'Guardar asignación'
              : 'Guardar organizaciones'}
        </Button>
      </fieldset>
      {message.error && (
        <p role="alert" className="error-message">
          {message.error}
        </p>
      )}
      {message.success && (
        <p role="status" className="success-message">
          {message.success}
        </p>
      )}
    </form>
  );
}
