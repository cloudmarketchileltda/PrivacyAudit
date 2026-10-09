import { notFound } from 'next/navigation';
import { z } from '@/lib/validation';
import { organizationScope, assignees } from '@/features/workflow/queries';
import { allResponses, allAssessments } from '@/features/assessments/queries';
import { WorkflowForm } from '@/features/workflow/workflow-form';
import { WorkflowNav } from '@/features/workflow/nav';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const selected = await searchParams;
  const scope = await organizationScope(id);
  if (!scope.canEdit) notFound();
  const [members, all, raw] = await Promise.all([
    assignees(id, true),
    allAssessments(scope.db),
    allResponses(scope.db),
  ]);
  const assessments = all.filter((a) => a.organization_id === id),
    controls = raw.filter((r) => r.organization_id === id);
  const response = selected.control ? controls.find((c) => c.id === selected.control) : null;
  if (selected.control && (!z.uuid().safeParse(selected.control).success || !response)) notFound();
  const assessment = response?.assessment_id || selected.assessment || '';
  if (assessment && !assessments.some((a) => a.id === assessment)) notFound();
  return (
    <>
      <div>
        <p className="muted">{scope.organization.legal_name}</p>
        <h1 className="page-title">Nuevo hallazgo</h1>
      </div>
      <WorkflowNav org={id} />
      <section className="panel">
        <WorkflowForm
          initial={{
            kind: 'finding',
            organization_id: id,
            assessment_id: assessment,
            control_id: response?.id || '',
            priority: response?.snapshot.severity_if_failed || 'MEDIUM',
          }}
          members={members.map((m) => ({ id: m.id, label: m.full_name || m.id }))}
          assessments={assessments.map((a) => ({ id: a.id, label: a.name }))}
          controls={controls.map((c) => ({
            id: c.id,
            assessment_id: c.assessment_id,
            label: `${c.snapshot.code} · ${c.snapshot.title}`,
          }))}
        />
      </section>
    </>
  );
}
