'use client';

import { useId, useRef } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HelpDialog({ title, children }: { title: string; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label={`Ayuda: ${title}`}
        title={`Ayuda: ${title}`}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <CircleHelp size={18} aria-hidden="true" />
      </Button>
      <dialog
        ref={dialog}
        className="account-dialog bg-white text-slate-900"
        aria-labelledby={titleId}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="section-title mb-0">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cerrar ayuda"
            title="Cerrar ayuda"
            onClick={() => dialog.current?.close()}
          >
            <X size={18} aria-hidden="true" />
          </Button>
        </div>
        <div className="space-y-3 break-words">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="outline" onClick={() => dialog.current?.close()}>
            Cerrar
          </Button>
        </div>
      </dialog>
    </>
  );
}
