'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { reserveEvidence, finalizeEvidence } from './actions';
import { fileMime, MAX_FILE_SIZE, uploadFieldsSchema, type UploadContext } from './schemas';
export function UploadForm({ context }: { context: UploadContext }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<{ id: string; path: string } | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ description: string }>({
    resolver: zodResolver(uploadFieldsSchema),
    defaultValues: { description: '' },
  });
  async function submit(v: { description: string }) {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      let current = reservation;
      if (!current) {
        const file = selectedFile;
        if (!file || file.size < 1 || file.size > MAX_FILE_SIZE) {
          setError('Seleccione un archivo de hasta 10 MB, con contenido.');
          return;
        }
        const mime = fileMime(file.name);
        if (!mime || (file.type && file.type !== mime)) {
          setError('Use PDF, PNG, JPG, DOCX, XLSX o TXT. El tipo debe coincidir con la extensión.');
          return;
        }
        const result = await reserveEvidence({
          ...context,
          control_id: context.control_id || '',
          finding_id: context.finding_id || '',
          task_id: context.task_id || '',
          previous_evidence_id: context.previous_evidence_id || '',
          description: v.description,
          original_filename: file.name,
          mime_type: mime,
          file_size: file.size,
        });
        if ('error' in result) {
          setError(result.error || 'No se pudo iniciar la entrega.');
          return;
        }
        current = { id: result.id, path: result.path };
        setReservation(current);
        const { error: uploadError } = await createClient()
          .storage.from('evidence')
          .upload(current.path, file, { contentType: mime, upsert: false });
        if (uploadError) {
          setError(
            'La carga no se confirmó. Abra la entrega para confirmar si el archivo llegó o descartar la carga incompleta.',
          );
          return;
        }
        setUploaded(true);
      }
      const form = new FormData();
      form.set('id', current.id);
      const result = await finalizeEvidence({}, form);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/evidence/${current.id}`);
      router.refresh();
    } catch {
      setError('No se pudo completar la entrega. Revise su conexión y vuelva a intentarlo.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <label className="form-label">
        Descripción
        <textarea
          className="field"
          rows={4}
          maxLength={10000}
          {...register('description')}
          readOnly={busy || !!reservation}
        />
      </label>
      {errors.description && (
        <p role="alert" className="error-message">
          Escriba una descripción de 2 a 10.000 caracteres.
        </p>
      )}
      <label className="form-label">
        Archivo
        <input
          onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          className="field"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt"
          disabled={busy || !!reservation}
        />
      </label>
      <p className="muted">
        PDF, PNG, JPG, DOCX, XLSX o TXT. Máximo 10 MB. Cada entrega conserva su archivo y su
        revisión.
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {reservation && (
        <a className="text-sm underline block" href={`/evidence/${reservation.id}`}>
          Abrir entrega para confirmar o descartar la carga
        </a>
      )}
      <Button disabled={busy}>
        {busy
          ? 'Cargando y confirmando…'
          : uploaded || reservation
            ? 'Reintentar confirmación'
            : 'Subir evidencia'}
      </Button>
    </form>
  );
}
