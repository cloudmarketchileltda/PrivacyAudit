'use client';
import { useActionState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import { assessmentDeletionConfirmation } from '../../../supabase/functions/_shared/assessment-deletion';
import { deleteAssessment } from './actions';
export function DeleteAssessmentButton({
  id,
  name,
  redirectAfterDelete = false,
}: {
  id: string;
  name: string;
  redirectAfterDelete?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteAssessment, {} as ActionState);
  useEffect(() => {
    if (state.success) {
      dialog.current?.close();
      router.refresh();
    }
  }, [state, router]);
  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        title="Eliminar evaluación"
        aria-label={`Eliminar evaluación: ${name}`}
        onClick={() => dialog.current?.showModal()}
      >
        <Trash2 size={18} aria-hidden="true" />
      </Button>
      <dialog
        ref={dialog}
        className="account-dialog"
        aria-labelledby={title}
        aria-describedby={description}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <h2 id={title} className="section-title mb-4">
          Eliminar evaluación
        </h2>
        <p className="font-semibold mb-3 break-words">{name}</p>
        <p id={description} className="text-sm mb-5">
          Se eliminarán permanentemente esta evaluación, sus controles evaluados, hallazgos, tareas,
          evidencias y todas sus versiones y archivos, comentarios, notificaciones, informes e
          historial relacionado. La organización y las otras evaluaciones se conservarán. Esta
          operación no se puede deshacer.
        </p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <input
            type="hidden"
            name="redirect_after_delete"
            value={redirectAfterDelete ? '1' : '0'}
          />
          <input type="hidden" name="confirmation" value={assessmentDeletionConfirmation} />
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              Eliminar
            </Button>
          </div>
          {pending && (
            <p role="status" className="muted">
              Eliminando evaluación y sus datos…
            </p>
          )}
          {state.error && (
            <p role="alert" className="error-message">
              {state.error}
            </p>
          )}
        </form>
      </dialog>
    </>
  );
}
