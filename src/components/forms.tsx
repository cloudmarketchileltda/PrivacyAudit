'use client';
import { generalConfig } from '@/config/general';
import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
export type ActionState = { error?: string; success?: string; link?: string };
export type FormAction = (state: ActionState, data: FormData) => Promise<ActionState>;
export function ActionForm({
  action,
  children,
  label = 'Guardar',
  variant = generalConfig.buttons.formVariant,
}: {
  action: FormAction;
  children?: React.ReactNode;
  label?: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="success-message">
          {state.success}
        </p>
      )}
      {state.link && (
        <div className="rounded-md border border-slate-300 p-3">
          <p className="text-sm mb-2">Comparta este enlace con el cliente. Vence en siete días.</p>
          <input
            aria-label="Enlace de invitación"
            readOnly
            value={state.link}
            className="field"
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
      <Button variant={variant} disabled={pending}>
        {pending ? 'Procesando…' : label}
      </Button>
    </form>
  );
}
export function Field({
  label,
  name,
  type = 'text',
  defaultValue = '',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="form-label">
      {label}
      <input
        className="field"
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
    </label>
  );
}
