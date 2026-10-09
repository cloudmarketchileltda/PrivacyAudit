'use client';
import { useActionState, useEffect, useId, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ActionState } from '@/components/forms';
import { deleteOrganization } from './actions';
import Link from 'next/link';
import { generalConfig } from '@/config/general';
export function DeleteOrganizationButton({ id, name }: { id: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();
  const router = useRouter();
  const pathname = usePathname();
  const [state, action, pending] = useActionState(deleteOrganization, {} as ActionState);
  useEffect(() => {
    if (state.success) {
      dialog.current?.close();
      if (pathname === `/administration/organizations/${id}`)
        router.push('/administration/organizations');
      else router.refresh();
    }
  }, [state, router, pathname, id]);
  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        title="Eliminar organización"
        aria-label={`Eliminar organización: ${name}`}
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
          Eliminar organización
        </h2>
        <p className="font-semibold mb-3 break-words">{name}</p>
        <p id={description} className="text-sm mb-5">
          Al borrar esta organización, todos los datos relacionados con ella serán eliminados:
          evaluaciones, tratamientos, hallazgos, tareas, evidencias y sus archivos, comentarios,
          membresías, invitaciones, notificaciones y su historial de auditoría. Esta operación es
          permanente.
        </p>
        <p className="text-sm mb-3">
          Si desea conservar la información para consulta, archive la organización. Antes de
          eliminar, puede exportar sus datos, historial, informes y archivos desde el resumen.
        </p>
        <Link
          className="text-blue-800 underline text-sm"
          href={`/administration/organizations/${id}`}
        >
          Archivar o exportar antes de eliminar
        </Link>
        <p className="muted my-4">{generalConfig.retention.backups}</p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={id} />
          <label className="form-label">
            Escriba ELIMINAR ORGANIZACION
            <input
              name="confirmation"
              className="field"
              required
              pattern="ELIMINAR ORGANIZACION"
              autoComplete="off"
            />
          </label>
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
              Eliminando organización y sus datos…
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
