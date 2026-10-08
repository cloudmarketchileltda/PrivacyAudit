'use client';
import { useActionState, useEffect, useId, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import { deleteControl } from './actions';
export function DeleteControlButton({
  id,
  code,
  title: controlTitle,
}: {
  id: string;
  code: string;
  title: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const router = useRouter();
  const [state, action, pending] = useActionState(deleteControl, {} as ActionState);
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
        title="Eliminar control"
        aria-label={`Eliminar control: ${code}`}
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
          Eliminar control
        </h2>
        <p className="font-semibold mb-3 break-words">
          {code} · {controlTitle}
        </p>
        <p id={description} className="text-sm mb-5">
          Esta operación elimina el control del catálogo. No se puede eliminar si está aplicado en
          alguna organización, aunque esté inactivo. Puede modificarlo o desactivarlo para nuevas
          evaluaciones.
        </p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="confirmation" value="ELIMINAR CONTROL" />
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
              Eliminando control…
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
