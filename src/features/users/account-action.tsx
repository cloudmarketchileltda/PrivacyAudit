'use client';
import { useActionState, useEffect, useId, useRef } from 'react';
import { Pencil, ShieldCheck, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, type ActionState } from '@/components/forms';
import { manageAccount } from './actions';
import { setRole } from '@/features/organizations/actions';
import { ContactFields, type AccountContact } from '@/features/account/contact-fields';
export type Account = {
  id: string;
  full_name: string;
  email: string;
  role: 'CLIENT' | 'CONSULTANT' | 'SUPER_ADMIN';
} & AccountContact;
export function AccountAction({
  account,
  kind,
  self,
}: {
  account: Account;
  kind: 'role' | 'edit' | 'delete';
  self: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();
  const [state, action, pending] = useActionState(
    kind === 'role' ? setRole : manageAccount,
    {} as ActionState,
  );
  const label =
    kind === 'role' ? 'Cambiar rol' : kind === 'edit' ? 'Modificar cuenta' : 'Eliminar cuenta';
  const variant = kind === 'delete' ? 'destructive' : kind;
  const Icon = kind === 'role' ? ShieldCheck : kind === 'edit' ? Pencil : Trash2;
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
        variant={variant}
        size="icon"
        aria-label={`${label}: ${account.full_name}`}
        title={label}
        disabled={
          (kind === 'role' && self) ||
          (kind === 'delete' && (self || account.role === 'SUPER_ADMIN'))
        }
        onClick={() => dialog.current?.showModal()}
      >
        <Icon size={18} aria-hidden="true" />
      </Button>
      <dialog
        ref={dialog}
        className="account-dialog"
        aria-labelledby={titleId}
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="flex justify-between items-start gap-3 mb-4">
          <h2 id={titleId} className="section-title">
            {label}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            disabled={pending}
            onClick={() => dialog.current?.close()}
          >
            <X size={18} />
          </Button>
        </div>
        <p className="muted mb-4 break-words">
          {account.full_name} · {account.email}
        </p>
        <form action={action} className="space-y-4">
          <input type="hidden" name="target" value={account.id} />
          <fieldset disabled={pending} className="space-y-4">
            {kind === 'role' ? (
              <label className="form-label">
                Rol
                <select name="new_role" className="field" defaultValue={account.role}>
                  <option value="CLIENT">Cliente</option>
                  <option value="CONSULTANT">Consultor</option>
                  <option value="SUPER_ADMIN">Administrador del sistema</option>
                </select>
              </label>
            ) : (
              <>
                <input
                  type="hidden"
                  name="operation"
                  value={kind === 'edit' ? 'UPDATE' : 'DELETE'}
                />
                {kind === 'edit' ? (
                  <>
                    <Field
                      label="Nombre completo"
                      name="full_name"
                      defaultValue={account.full_name}
                      required
                    />
                    <Field
                      label="Correo electrónico"
                      name="email"
                      type="email"
                      defaultValue={account.email}
                      required
                    />
                    <ContactFields contact={account} />
                    <p className="muted">
                      La contraseña se cambia desde Mi cuenta o mediante Recuperar acceso. La
                      contraseña actual nunca se muestra.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      Esta acción elimina la cuenta y su acceso. Las cuentas con registros
                      históricos asociados no se pueden eliminar. El log de auditoría se conserva.
                    </p>
                    <Field
                      label="Escriba ELIMINAR CUENTA para confirmar"
                      name="confirmation"
                      required
                    />
                  </>
                )}
              </>
            )}
            <div className="flex gap-3">
              <Button variant={variant} type="submit" size="icon" aria-label={label} title={label}>
                <Icon size={18} />
              </Button>
              <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>
                Cancelar
              </Button>
            </div>
          </fieldset>
          {pending && (
            <p role="status" className="muted">
              Procesando…
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
