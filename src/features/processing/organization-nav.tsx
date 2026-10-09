import Link from 'next/link';
export function ProcessingNav({ id }: { id: string }) {
  return (
    <nav
      className="flex flex-wrap gap-5 border-b border-slate-200 pb-3 text-sm"
      aria-label="Organización"
    >
      <Link href={`/assessments?organization=${id}`} className="hover:underline">
        Evaluaciones
      </Link>
      <Link
        href={`/organizations/${id}/processing`}
        className="font-semibold text-teal-800"
        aria-current="page"
      >
        Tratamientos
      </Link>
      <Link href={`/findings?organization=${id}`} className="hover:underline">
        Hallazgos
      </Link>
      <Link href={`/action-plan?organization=${id}`} className="hover:underline">
        Plan de acción
      </Link>
      <Link href={`/tasks?organization=${id}`} className="hover:underline">
        Tareas
      </Link>
      <Link href={`/evidence?organization=${id}`} className="hover:underline">
        Evidencias
      </Link>
      <Link href={`/reports?organization=${id}`} className="hover:underline">
        Informes
      </Link>
    </nav>
  );
}
