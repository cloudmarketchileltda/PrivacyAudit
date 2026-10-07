import Link from 'next/link';
export function WorkflowNav({ org }: { org: string }) {
  return (
    <nav
      aria-label="Organización"
      className="flex flex-wrap gap-5 border-b border-slate-200 pb-3 text-sm"
    >
      {[
        ['Resumen', `/organizations/${org}`],
        ['Evaluaciones', `/assessments?organization=${org}`],
        ['Tratamientos', `/organizations/${org}/processing`],
        ['Hallazgos', `/findings?organization=${org}`],
        ['Plan de acción', `/action-plan?organization=${org}`],
        ['Evidencias', `/evidence?organization=${org}`],
        ['Tareas', `/tasks?organization=${org}`],
      ].map(([label, href]) => (
        <Link className="hover:underline" key={label} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
