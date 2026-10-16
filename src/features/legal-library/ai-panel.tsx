'use client';
import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { generalConfig } from '@/config/general';
import { askLegalAi, configureLegalAi, indexLegalAi } from './ai-actions';
export type LegalAiStatus = {
  enabled: boolean;
  allowed: boolean;
  all_users: boolean;
  daily_limit: number;
  used_today: number;
  indexed: number;
  total: number;
  budget_usd: number | null;
  spent_usd: number | null;
};
export function LegalAiPanel({ status, admin }: { status: LegalAiStatus | null; admin: boolean }) {
  const [state, action, pending] = useActionState(askLegalAi, { answer: '', sources: [] });
  const [message, setMessage] = useState('');
  const [working, startTransition] = useTransition();
  const router = useRouter();
  const limits = generalConfig.legalLibrary.ai;
  const ready =
    status?.allowed &&
    status.indexed === status.total &&
    status.total > 0 &&
    status.used_today < status.daily_limit;
  return (
    <section id="consultar-ia" aria-labelledby="ai-title" className="panel space-y-4">
      <div>
        <h2 id="ai-title" className="section-title">
          Consultar con IA · Piloto
        </h2>
        <p className="muted">
          Solo normativa chilena de protección de datos personales. Sin acceso a organizaciones,
          evaluaciones, evidencias ni información de clientes.
        </p>
      </div>
      <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-950">
        Formule preguntas generales, sin nombres, RUT, correos ni otros datos personales. La
        pregunta y los fragmentos normativos se envían a OpenAI. No guardamos historial de
        conversaciones en PrivacyAudit; cada consulta es independiente. El proveedor aplica su
        propia política de tratamiento.
      </p>
      <p className="muted">
        El corpus de este piloto es la reforma Ley 21.719, con vigencia del régimen reformado desde{' '}
        {generalConfig.legalLibrary.document.effectiveLabel}. No cubre por sí solo el régimen
        anterior.
      </p>
      <p role="status" className="text-sm text-slate-600">
        {!status
          ? 'Piloto pendiente de instalación. Biblioteca y FAQ siguen disponibles.'
          : `${status.used_today} de ${status.daily_limit} consultas hoy · Reinicio diario America/Santiago. ${status.allowed ? '' : 'Piloto desactivado para su perfil.'}`}
      </p>
      <form action={action} className="space-y-3">
        <label htmlFor="legal-question" className="form-label">
          Su pregunta sobre la ley de privacidad
        </label>
        <textarea
          id="legal-question"
          name="question"
          className="field min-h-28"
          required
          minLength={8}
          maxLength={limits.questionMaxLength}
          disabled={!ready || pending}
          placeholder="¿Qué establece la ley sobre el consentimiento para tratar datos personales?"
        />
        <p className="muted">
          Máximo {limits.questionMaxLength} caracteres. Las respuestas son orientación asistida y
          requieren revisión profesional.
        </p>
        <Button type="submit" disabled={!ready || pending}>
          {pending ? 'Consultando…' : 'Consultar con IA'}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="error-message">
          {state.error}
        </p>
      )}
      {state.answer && (
        <div aria-live="polite" className="space-y-3 rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold">Respuesta orientativa</h3>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{state.answer}</p>
          {state.sources.map((source, index) => (
            <div key={index} className="border-t pt-3 text-sm">
              <blockquote className="text-slate-600">«{source.excerpt}»</blockquote>
              <a
                className="text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
                href={`${generalConfig.legalLibrary.pdfHref}#page=${source.page}`}
              >
                {source.title} · página {source.page}
              </a>
            </div>
          ))}
        </div>
      )}
      {admin && status && (
        <details className="border-t pt-4">
          <summary className="cursor-pointer font-semibold">Administrar piloto IA</summary>
          <div className="mt-4 space-y-4">
            <p className="text-sm">
              Biblioteca indexada: {status.indexed}/{status.total}. Presupuesto total: USD{' '}
              {Number(status.budget_usd).toFixed(2)}. Consumo estimado y reservas: USD{' '}
              {Number(status.spent_usd).toFixed(4)}.
            </p>
            <p className="muted">
              Indexar consume API. Puede detener y reanudar el proceso; las reservas fallidas se
              mantienen por precaución. Configure los secretos antes de comenzar.
            </p>
            <Button
              disabled={working || status.indexed === status.total}
              onClick={() =>
                startTransition(async () => {
                  setMessage('Indexando la biblioteca…');
                  for (let i = 0; i <= status.total; i++) {
                    const result = await indexLegalAi();
                    if (result.error) {
                      setMessage(result.error);
                      break;
                    }
                    if (result.done) {
                      setMessage('Biblioteca preparada. Puede habilitar las pruebas.');
                      break;
                    }
                    setMessage(
                      `Fragmento procesado: ${i + 1}. Puede reanudar si cierra esta página.`,
                    );
                  }
                  router.refresh();
                })
              }
            >
              {working ? 'Procesando…' : 'Preparar biblioteca para IA'}
            </Button>
            <form
              action={(form) =>
                startTransition(async () => {
                  const result = await configureLegalAi(form);
                  setMessage(result.error ?? result.success ?? '');
                  router.refresh();
                })
              }
              className="space-y-3"
            >
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={status.enabled} />
                Habilitar piloto
              </label>
              <label className="flex gap-2 text-sm">
                <input type="checkbox" name="all_users" defaultChecked={status.all_users} />
                Permitir clientes y consultores (inicialmente solo administrador)
              </label>
              <Button variant="edit" type="submit" disabled={working}>
                Guardar configuración IA
              </Button>
            </form>
            {message && (
              <p role="status" className="text-sm">
                {message}
              </p>
            )}
          </div>
        </details>
      )}
    </section>
  );
}
