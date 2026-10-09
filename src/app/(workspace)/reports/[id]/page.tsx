import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Download } from 'lucide-react';
import { requireUser } from '@/features/auth/queries';
import { Button } from '@/components/ui/button';
import {
  reportSnapshotSchema,
  reportMetrics,
  reportDate,
  reportDisclaimer,
} from '@/features/reports/model';
import { assessmentLabels } from '@/features/assessments/model';
import { WorkflowNav } from '@/features/workflow/nav';
import { z } from '@/lib/validation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { db } = await requireUser();
  const { data: r, error } = await db.from('reports').select('*').eq('id', id).single();
  if (error || !r) notFound();
  const s = reportSnapshotSchema.parse(r.snapshot);
  const m = reportMetrics(s);
  return (
    <>
      <div>
        <Link href={`/reports?organization=${r.organization_id}`} className="muted underline">
          Informes de {s.organization.legal_name}
        </Link>
        <h1 className="page-title mt-2 break-words">{r.title}</h1>
        <p className="muted mt-2">
          Publicado por {s.author} · {reportDate(s.captured_at)}
        </p>
      </div>
      <WorkflowNav org={r.organization_id} />
      <section className="panel">
        <h2 className="section-title">Informe publicado</h2>
        <p className="muted mt-2">
          {s.assessment.name} · {assessmentLabels[s.assessment.status]} · Consultor: {s.consultant}
        </p>
        <p className="mt-3">
          Avance de evaluación: {m.progress}% ({m.evaluated} de {m.total} controles). Hallazgos:{' '}
          {s.findings.length}. Tareas: {s.tasks.length}. Tratamientos: {s.processing.length}.
          Evidencias revisadas: {s.evidence.length}.
        </p>
        <Button asChild className="mt-5">
          <a href={`/api/reports/${id}/download`}>
            <Download size={18} className="mr-2" />
            Descargar PDF
          </a>
        </Button>
        <p className="muted mt-3">
          La descarga utiliza esta versión guardada. Los cambios posteriores en la evaluación no
          modifican el informe.
        </p>
      </section>
      {(
        [
          ['Resumen ejecutivo', s.executive_summary],
          ['Alcance', s.scope],
          ['Conclusiones', s.conclusions],
        ] as const
      ).map(([title, text]) => (
        <section key={title} className="panel">
          <h2 className="section-title">{title}</h2>
          <p className="mt-3 whitespace-pre-wrap break-words">{text}</p>
        </section>
      ))}
      <p className="muted">{reportDisclaimer}</p>
    </>
  );
}
