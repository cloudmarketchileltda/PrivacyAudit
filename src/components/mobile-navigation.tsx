'use client';
import { useRef } from 'react';
import { Menu, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';

export function MobileNavigation({ admin }: { admin: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        title="Abrir menú"
        aria-label="Abrir menú"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu size={21} />
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby="mobile-menu-title"
        className="mobile-menu brand-sidebar text-white"
      >
        <div className="mb-7 flex items-center justify-between gap-3">
          <h2 id="mobile-menu-title" className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={22} className="text-blue-300" />
            PrivacyAudit
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            aria-label="Cerrar menú"
            title="Cerrar menú"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </Button>
        </div>
        <Navigation admin={admin} onNavigate={() => dialog.current?.close()} />
      </dialog>
    </div>
  );
}
