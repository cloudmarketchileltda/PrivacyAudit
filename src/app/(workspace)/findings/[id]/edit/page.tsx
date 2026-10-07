import { notFound } from 'next/navigation';
import { findingScope, assignees } from '@/features/workflow/queries';
import { WorkflowForm } from '@/features/workflow/workflow-form';
import { WorkflowNav } from '@/features/workflow/nav';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { finding, organization, canEdit } = await findingScope(id);
  if (!canEdit) notFound();
  const members = await assignees(organization.id);
  return (
    <>
      <h1 className="page-title">Editar hallazgo</h1>
      <WorkflowNav org={organization.id} />
      <section className="panel">
        <WorkflowForm
          initial={{
            ...finding,
            kind: 'finding',
            control_id: finding.control_id || '',
            priority: finding.severity,
            assigned_to: finding.assigned_to || '',
            due_date: finding.due_date || '',
          }}
          members={members.map((m) => ({ id: m.id, label: m.full_name || m.id }))}
        />
      </section>
    </>
  );
}
