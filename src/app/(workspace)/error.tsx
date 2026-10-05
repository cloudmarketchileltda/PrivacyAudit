'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel">
      <h1 className="page-title mb-4">No fue posible cargar la información</h1>
      <p className="muted mb-5">
        Revise la conexión y que se hayan aplicado las migraciones de Supabase.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </section>
  );
}
