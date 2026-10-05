import { ActionForm, Field } from '@/components/forms';
import { saveControl } from './actions';
import type { ControlSnapshot } from '@/features/assessments/model';
export interface CatalogControl extends ControlSnapshot {
  id: string;
  active: boolean;
}
export function ControlForm({ control }: { control?: CatalogControl }) {
  return (
    <ActionForm action={saveControl}>
      {control && <input type="hidden" name="id" value={control.id} />}
      <div className="form-grid">
        <Field name="code" label="Código" defaultValue={control?.code} required />
        <Field name="title" label="Título" defaultValue={control?.title} required />
        <Field name="category" label="Categoría" defaultValue={control?.category} required />
        <Field
          name="sort_order"
          label="Orden"
          type="number"
          defaultValue={String(control?.sort_order || 0)}
        />
        <label className="form-label">
          Severidad orientativa
          <select
            name="severity_if_failed"
            className="field"
            defaultValue={control?.severity_if_failed || 'MEDIUM'}
          >
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </label>
        <label className="form-label">
          Revisión jurídica
          <select
            name="legal_review_status"
            className="field"
            defaultValue={control?.legal_review_status || 'PENDING'}
          >
            <option value="PENDING">Pendiente de revisión jurídica</option>
            <option value="REVIEWED">Revisada por profesional</option>
          </select>
        </label>
      </div>
      {[
        ['description', 'Descripción'],
        ['objective', 'Objetivo'],
        ['guidance', 'Orientación'],
        ['normative_reference', 'Referencia normativa editable'],
      ].map(([key, label]) => (
        <label key={key} className="form-label">
          {label}
          <textarea
            name={key}
            className="field"
            rows={3}
            defaultValue={
              control?.[key as 'description'] ||
              (key === 'normative_reference' ? 'Pendiente de revisión jurídica' : '')
            }
          />
        </label>
      ))}
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={control?.active ?? true} />
          Activo
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="requires_evidence"
            defaultChecked={control?.requires_evidence ?? true}
          />
          Requiere evidencia
        </label>
      </div>
      <p className="muted">
        Los cambios se aplican a nuevas evaluaciones. Las existentes conservan su copia histórica.
      </p>
    </ActionForm>
  );
}
