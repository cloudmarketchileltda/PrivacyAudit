'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ExportOrganizationButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  return (
    <div>
      <Button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError('');
          try {
            const response = await fetch(`/api/administration/organizations/${id}/export`, {
              cache: 'no-store',
            });
          if (!response.ok) throw new Error(await response.text());
          if (!response.headers.get('content-type')?.startsWith('application/zip'))
            throw new Error('La sesión no está disponible. Inicie sesión y reintente la exportación.');
            const url = URL.createObjectURL(await response.blob());
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `privacyaudit-${id}.zip`;
            anchor.click();
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'No se pudo exportar.');
          } finally {
            setPending(false);
          }
        }}
      >
        <Download size={16} aria-hidden="true" />
        {pending ? 'Preparando exportación…' : 'Exportar datos y archivos'}
      </Button>
      {pending && (
        <p role="status" className="muted mt-2">
          Preparando y verificando el paquete completo…
        </p>
      )}
      {error && (
        <p role="alert" className="error-message mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
