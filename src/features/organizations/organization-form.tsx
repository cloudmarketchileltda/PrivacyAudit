'use client';
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from '@/lib/validation';
import { organizationSchema } from './schemas';
import { saveOrganization } from './actions';
import { Button } from '@/components/ui/button';
import type { Organization } from '@/types/domain';
import type { ActionState } from '@/components/forms';
const booleans = [
  ['treats_clients', 'Datos de clientes'],
  ['treats_employees', 'Datos de trabajadores'],
  ['treats_suppliers', 'Datos de proveedores'],
  ['uses_cameras', 'Cámaras de vigilancia'],
  ['marketing', 'Marketing'],
  ['external_providers', 'Proveedores externos'],
  ['has_website', 'Página web'],
  ['web_forms', 'Formularios web'],
] as const;
export function OrganizationForm({ organization }: { organization?: Organization }) {
  const [state, action, pending] = useActionState(saveOrganization, {} as ActionState);
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<z.input<typeof organizationSchema>, unknown, z.output<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      legal_name: '',
      rut: '',
      trade_name: '',
      industry: '',
      employee_count: '',
      website: '',
      address: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      privacy_officer: '',
      status: 'ACTIVE',
      sensitive_data: 'UNKNOWN',
      international_transfers: 'UNKNOWN',
      ...Object.fromEntries(booleans.map(([k]) => [k, false])),
      ...organization,
    },
  });
  const texts = [
    ['legal_name', 'Razón social'],
    ['rut', 'RUT'],
    ['trade_name', 'Nombre comercial'],
    ['industry', 'Industria'],
    ['employee_count', 'Cantidad aproximada de trabajadores'],
    ['website', 'Sitio web'],
    ['address', 'Dirección'],
    ['contact_name', 'Contacto'],
    ['contact_email', 'Email de contacto'],
    ['contact_phone', 'Teléfono'],
    ['privacy_officer', 'Responsable interno de privacidad'],
  ] as const;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!organizationSchema.safeParse(getValues()).success) {
          e.preventDefault();
          void trigger();
        }
      }}
      className="space-y-8"
    >
      {organization && <input type="hidden" name="id" value={organization.id} />}
      <div className="form-grid">
        {texts.map(([key, label]) => (
          <label key={key} className="form-label">
            {label}
            <input
              className="field"
              {...register(key)}
              type={
                key === 'employee_count' ? 'number' : key === 'contact_email' ? 'email' : 'text'
              }
              aria-invalid={Boolean(errors[key])}
            />
            {errors[key] && (
              <span className="text-red-700 text-xs">{errors[key]?.message?.toString()}</span>
            )}
          </label>
        ))}
        <label className="form-label">
          Estado
          <select className="field" {...register('status')}>
            <option value="ACTIVE">Activa</option>
            <option value="ARCHIVED">Archivada</option>
          </select>
        </label>
      </div>
      <section>
        <h2 className="section-title">Perfil de tratamiento</h2>
        <div className="form-grid">
          {booleans.map(([key, label]) => (
            <label key={key} className="flex gap-3 items-center text-sm">
              <input type="checkbox" {...register(key)} className="accent-teal-800 size-4" />
              {label}
            </label>
          ))}
          {[
            ['sensitive_data', 'Datos sensibles'],
            ['international_transfers', 'Transferencias internacionales'],
          ].map(([key, label]) => (
            <label key={key} className="form-label">
              {label}
              <select
                className="field"
                {...register(key as 'sensitive_data' | 'international_transfers')}
              >
                <option value="UNKNOWN">No determinado</option>
                <option value="YES">Sí</option>
                <option value="NO">No</option>
              </select>
            </label>
          ))}
        </div>
      </section>
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      <Button variant="edit" disabled={pending}>
        {pending ? 'Guardando…' : 'Guardar organización'}
      </Button>
    </form>
  );
}
