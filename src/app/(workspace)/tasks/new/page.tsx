import { notFound } from 'next/navigation';
import { findingScope, assignees } from '@/features/workflow/queries';
import { WorkflowForm } from '@/features/workflow/workflow-form';
import { WorkflowNav } from '@/features/workflow/nav';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { finding: id } = await searchParams;
  if (!id) notFound();
  const { finding, organization, canEdit } = await findingScope(id);
  if (!canEdit || ['CLOSED', 'ACCEPTED_RISK'].includes(finding.status)) notFound();
  const members = await assignees(organization.id);
  return (
    <>
      <div>
        <p className="muted">{finding.title}</p>
        <h1 className="page-title">Nueva tarea</h1>
      </div>
      <WorkflowNav org={organization.id} />
      <section className="panel">
        <WorkflowForm
          initial={{
            kind: 'task',
            organization_id: organization.id,
            finding_id: id,
            assigned_to: finding.assigned_to || '',
            priority: finding.severity,
            due_date: finding.due_date || '',
          }}
          members={members.map((m) => ({ id: m.id, label: m.full_name || m.id }))}
        />
      </section>
    </>
  );
}
