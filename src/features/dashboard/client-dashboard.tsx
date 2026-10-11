import { generalConfig } from '@/config/general';
import Link from 'next/link';
import type { requireUser } from '@/features/auth/queries';
import { assessmentLabels, controlLabels, controlStatuses } from '@/features/assessments/model';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

export type ClientDashboardSummary = {
  organization: { id: string; name: string; status: string };
  assessment: { id: string; name: string; status: keyof typeof assessmentLabels } | null;
  latest_report: { id: string; title: string; created_at: string } | null;
  controls: { total: number; evaluated: number; counts: Record<string, number> };
  tasks: Record<
    | 'total'
    | 'done'
    | 'todo'
    | 'in_progress'
    | 'waiting_review'
    | 'overdue'
    | 'due_soon'
    | 'mine_total'
    | 'mine_done'
    | 'mine_waiting_review'
    | 'mine_overdue',
    number
  >;
  findings: Record<'open' | 'critical' | 'high' | 'closed' | 'accepted_risk', number>;
  evidence: { pending: number; accepted: number };
};
function Indicator({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="panel block transition-shadow hover:shadow-md">
      <p className="muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <span className="mt-3 block text-xs text-blue-700">Ver módulo relacionado →</span>
    </Link>
  );
}
function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  return (
    <>
      <p className="mt-3 text-2xl font-semibold">
        {total ? `${Math.round((done * 100) / total)}%` : 'Sin registros'}{' '}
        <span className="text-sm font-normal text-slate-500">
          · {done}/{total}
        </span>
      </p>
      <progress
        className="mt-3 w-full accent-blue-600"
        value={done}
        max={Math.max(total, 1)}
        aria-label={label}
      />
    </>
  );
}
export async function ClientDashboard({ db }: Awaited<ReturnType<typeof requireUser>>) {
  const { data, error } = await db.rpc('client_organization_dashboard');
  if (error) throw new Error('No se pudo cargar el resumen de su organización.');
  if (!data)
    return (
      <section className="panel">
        <h1 className="page-title">Mi organización</h1>
        <p className="muted mt-4">
          No tiene una organización disponible. Solicite al administrador que revise su asignación.
        </p>
      </section>
    );
  const s = data as unknown as ClientDashboardSummary;
  const org = s.organization.id;
  const plan = `/action-plan?organization=${org}`;
  const findings = `/findings?organization=${org}`;
  return (
    <>
      <div>
        <p className="muted mb-1">Visión global de mi organización</p>
        <h1 className="page-title break-words">{s.organization.name}</h1>
        <p className="muted mt-2">Diagnóstico, plan de mejora y prioridades de su organización.</p>
      </div>
      {s.organization.status === 'ARCHIVED' && (
        <p className="panel text-sm">
          Organización archivada: la información se conserva para consulta y no admite trabajo
          operativo.
        </p>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <h2 className="section-title">Avance del diagnóstico</h2>
          {s.assessment ? (
            <>
              <Link
                className="text-sm font-semibold text-blue-700 hover:underline"
                href={`/assessments/${s.assessment.id}`}
              >
                {s.assessment.name}
              </Link>
              <p className="muted">{assessmentLabels[s.assessment.status]}</p>
              <Progress
                done={s.controls.evaluated}
                total={s.controls.total}
                label="Controles evaluados de la última evaluación"
              />
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {controlStatuses.map((status) => (
                  <div key={status}>
                    <dt className="muted">{controlLabels[status]}</dt>
                    <dd className="font-semibold">{s.controls.counts[status] || 0}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="muted">Todavía no hay evaluaciones disponibles.</p>
          )}
          <p className="muted mt-4">
            Última evaluación creada. Evaluar un control no significa que su brecha esté resuelta.
          </p>
        </section>
        <section className="panel">
          <h2 className="section-title">Avance del plan de acción</h2>
          <p className="muted">
            Todas las tareas de los hallazgos de la organización, de todas sus evaluaciones
            disponibles.
          </p>
          <Progress
            done={s.tasks.done}
            total={s.tasks.total}
            label="Tareas aprobadas del plan completo"
          />
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Pendientes', s.tasks.todo],
              ['En ejecución', s.tasks.in_progress],
              ['En revisión', s.tasks.waiting_review],
              ['Aprobadas', s.tasks.done],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <Button asChild variant="outline" className="mt-5">
            <Link href={plan}>Consultar plan de acción</Link>
          </Button>
        </section>
      </div>
      <section>
        <h2 className="section-title">Requiere atención en la organización</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Indicator
            label="Hallazgos críticos abiertos"
            value={s.findings.critical}
            href={`${findings}&severity=CRITICAL&open=yes`}
          />
          <Indicator
            label="Tareas vencidas de la organización"
            value={s.tasks.overdue}
            href={plan}
          />
          <Indicator
            label={`Tareas por vencer en ${generalConfig.dashboard.upcomingDays} días`}
            value={s.tasks.due_soon}
            href={plan}
          />
          <Indicator
            label="Tareas pendientes de revisión"
            value={s.tasks.waiting_review}
            href={plan}
          />
        </div>
        <p className="muted mt-3">
          Vencimientos: tareas sin aprobar de hallazgos abiertos. Próximos vencimientos incluye hoy
          y los {generalConfig.dashboard.upcomingDays} días siguientes, según hora de Chile. Los
          enlaces abren el módulo relacionado; el detalle de tareas ajenas sigue restringido.
        </p>
      </section>
      <section>
        <h2 className="section-title">Estado general</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <Indicator
            label="Hallazgos abiertos"
            value={s.findings.open}
            href={`${findings}&open=yes`}
          />
          <Indicator
            label="Hallazgos de severidad alta abiertos"
            value={s.findings.high}
            href={`${findings}&severity=HIGH&open=yes`}
          />
          <Indicator
            label="Hallazgos cerrados"
            value={s.findings.closed}
            href={`${findings}&status=CLOSED`}
          />
          <Indicator
            label="Riesgos aceptados"
            value={s.findings.accepted_risk}
            href={`${findings}&status=ACCEPTED_RISK`}
          />
          <Indicator
            label="Evidencias pendientes de revisión"
            value={s.evidence.pending}
            href={`/evidence?organization=${org}`}
          />
          <Indicator
            label="Evidencias aceptadas"
            value={s.evidence.accepted}
            href={`/evidence?organization=${org}`}
          />
        </div>
        <p className="muted mt-3">
          Evidencias: última versión confirmada de cada cadena de la organización. Los totales
          globales no amplían el acceso a los archivos o tareas de otros responsables.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel">
          <h2 className="section-title">Mis tareas</h2>
          <p className="muted">Únicamente las tareas asignadas a su cuenta.</p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            {[
              ['Asignadas', s.tasks.mine_total],
              ['Aprobadas', s.tasks.mine_done],
              ['En revisión', s.tasks.mine_waiting_review],
              ['Vencidas', s.tasks.mine_overdue],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="muted">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <Button asChild className="mt-5">
            <Link href={`/tasks?organization=${org}`}>Ver mis tareas</Link>
          </Button>
        </section>
        <section className="panel">
          <h2 className="section-title">Último informe publicado</h2>
          {s.latest_report ? (
            <>
              <p className="font-semibold break-words">{s.latest_report.title}</p>
              <p className="muted mt-2">
                Publicado el {formatDate(s.latest_report.created_at)}. Refleja la información al
                momento de su publicación.
              </p>
              <Button asChild className="mt-5">
                <a href={`/api/reports/${s.latest_report.id}/download`}>Descargar informe PDF</a>
              </Button>
            </>
          ) : (
            <p className="muted">Todavía no hay informes publicados.</p>
          )}
          <Link
            className="mt-4 block text-sm text-blue-700 underline"
            href={`/reports?organization=${org}`}
          >
            Ver informes
          </Link>
        </section>
      </div>
      <nav
        aria-label="Información de la organización"
        className="flex flex-wrap gap-5 text-sm text-blue-700 underline"
      >
        <Link href={`/processing?organization=${org}`}>Tratamientos de datos</Link>
        <Link href={`/assessments?organization=${org}`}>Todas las evaluaciones</Link>
        <Link href={findings}>Hallazgos</Link>
      </nav>
      <p className="muted">
        Los totales excluyen evaluaciones en eliminación. El diagnóstico y el plan miden trabajo
        registrado, no certifican cumplimiento jurídico. La visión global está limitada a su
        membresía actual.
      </p>
    </>
  );
}
