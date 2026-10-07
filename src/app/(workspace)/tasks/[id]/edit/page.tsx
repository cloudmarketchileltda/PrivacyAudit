import { notFound } from 'next/navigation';
import { taskScope, assignees } from '@/features/workflow/queries';
import { WorkflowForm } from '@/features/workflow/workflow-form';
import { WorkflowNav } from '@/features/workflow/nav';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { task, organization, canEdit } = await taskScope(id);
  if (!canEdit) notFound();
  const members = await assignees(organization.id);
  return (
    <>
      <h1 className="page-title">Editar tarea</h1>
      <WorkflowNav org={organization.id} />
      <section className="panel">
        <WorkflowForm
          initial={{
            ...task,
            kind: 'task',
            assigned_to: task.assigned_to || '',
            due_date: task.due_date || '',
          }}
          members={members.map((m) => ({ id: m.id, label: m.full_name || m.id }))}
        />
      </section>
    </>
  );
}
