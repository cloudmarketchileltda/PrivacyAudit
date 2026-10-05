import { ActionForm } from '@/components/forms';
import { saveResponse } from './actions';
import { controlStatuses, controlLabels, type ResponseControl } from './model';
export function ResponseForm({ response }: { response: ResponseControl }) {
  return (
    <ActionForm action={saveResponse} label="Guardar evaluación del control">
      <input type="hidden" name="id" value={response.id} />
      <label className="form-label">
        Estado del control
        <select className="field" name="status" defaultValue={response.status}>
          {controlStatuses.map((s) => (
            <option key={s} value={s}>
              {controlLabels[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="form-label">
        Comentario del consultor
        <textarea
          className="field"
          name="auditor_comment"
          defaultValue={response.auditor_comment}
          rows={4}
          maxLength={10000}
        />
      </label>
      <label className="form-label">
        Motivo de no aplicabilidad
        <textarea
          name="applicability_reason"
          className="field"
          defaultValue={response.applicability_reason}
          rows={2}
          maxLength={2000}
        />
        <span className="muted">Obligatorio si selecciona No aplica.</span>
      </label>
    </ActionForm>
  );
}
