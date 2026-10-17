import Link from 'next/link';
import {
  ArrowRight,
  ClipboardList,
  FolderOpen,
  FileChartColumn,
  LayoutDashboard,
  Bell,
  BookOpen,
} from 'lucide-react';
import { requireUser } from '@/features/auth/queries';
import type { ClientDashboardSummary } from '@/features/dashboard/client-dashboard';
import { generalConfig } from '@/config/general';
import { Button } from '@/components/ui/button';
import { ResourceCarousel } from '@/components/resource-carousel';

export default async function HomePage() {
  const { db, profile } = await requireUser();
  const client = profile.role === 'CLIENT';
  const { data, error } = client
    ? await db.rpc('client_organization_dashboard')
    : await db.rpc('dashboard_summary', { search: '', org_status: '', attention: '', page: 1 });
  if (error) throw new Error('No se pudo cargar el resumen de inicio.');
  const summary = client ? (data as unknown as ClientDashboardSummary | null) : null;
  const metrics = !client ? (data as unknown as { metrics: Record<string, number> }).metrics : null;
  const indicators = client
    ? summary
      ? ([
          ['Mis tareas vencidas', summary.tasks.mine_overdue, '/tasks'],
          ['Hallazgos abiertos', summary.findings.open, '/findings'],
          ['Evidencias pendientes', summary.evidence.pending, '/evidence'],
        ] as const)
      : []
    : ([
        ['Tareas vencidas', metrics?.overdue_tasks ?? 0, '/tasks'],
        ['Hallazgos de alta prioridad', metrics?.high_findings ?? 0, '/findings'],
        ['Evidencias pendientes', metrics?.pending_evidence ?? 0, '/evidence'],
      ] as const);
  const library = generalConfig.legalLibrary;
  return (
    <>
      <section className="home-hero relative overflow-hidden rounded-3xl p-6 text-white md:p-9">
        <p className="text-xs font-medium uppercase tracking-[.18em] text-blue-200">
          PrivacyAudit · Su espacio de trabajo
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">
          Bienvenido{profile.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
          Una visión clara para continuar con sus evaluaciones, organizar acciones y mantener las
          evidencias al día.
        </p>
        {summary && (
          <p className="mt-4 text-sm font-medium text-blue-100">
            {summary.organization.name}
            {summary.organization.status === 'ARCHIVED' ? ' · Archivada · Solo consulta' : ''}
          </p>
        )}
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            Abrir dashboard <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </Button>
      </section>
      <section aria-labelledby="quick-links-title">
        <div className="mb-4">
          <p className="eyebrow">Continúe por aquí</p>
          <h2 id="quick-links-title" className="section-title mb-0">
            Accesos rápidos
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              ['/assessments', 'Evaluaciones', 'Diagnóstico y controles', ClipboardList],
              [
                '/tasks',
                client ? 'Mis tareas' : 'Tareas',
                'Acciones y seguimiento',
                LayoutDashboard,
              ],
              ['/evidence', 'Evidencias', 'Documentos y revisiones', FolderOpen],
              ['/reports', 'Informes', 'Resultados publicados', FileChartColumn],
            ] as const
          ).map(([href, title, description, Icon]) => {
            return (
              <Link key={href} href={href} className="resource-card panel flex items-center gap-4">
                <span className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      {indicators.length > 0 ? (
        <section aria-labelledby="attention-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 id="attention-title" className="section-title mb-0">
              Su resumen de atención
            </h2>
            <Link href="/dashboard" className="text-sm font-medium text-blue-700">
              Ver resumen completo →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {indicators.map(([label, value, href]) => (
              <Link key={label} href={href} className="resource-card panel">
                <p className="muted">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                <span className="mt-3 block text-xs text-blue-700">Abrir módulo →</span>
              </Link>
            ))}
          </div>
          {client && (
            <p className="muted mt-3">
              Hallazgos y evidencias: totales de su organización. El acceso al detalle mantiene sus
              permisos actuales.
            </p>
          )}
        </section>
      ) : (
        <p className="panel muted">
          No tiene una organización disponible. Solicite al administrador que revise su asignación.
          Puede consultar los recursos del Centro normativo.
        </p>
      )}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ResourceCarousel
          items={[
            {
              label: 'Biblioteca normativa',
              title: library.document.title,
              description:
                'Consulte la copia versionada, sus fechas y las referencias oficiales desde el Centro normativo.',
              href: `${library.href}#ley`,
            },
            {
              label: 'Orientación por tema',
              title: 'Preguntas frecuentes',
              description:
                'Encuentre orientación editorial y consulte el fundamento de cada respuesta. Contenido pendiente de revisión jurídica profesional.',
              href: `${library.href}#preguntas`,
            },
            {
              label: 'Guía de trabajo',
              title: 'Del hallazgo a la acción',
              description:
                'Revise los hallazgos y sus tareas asociadas en el Plan de acción. La ayuda del módulo explica cómo continuar el trabajo.',
              href: '/action-plan',
            },
          ]}
        />
        <section className="panel self-start" aria-labelledby="resources-title">
          <p className="eyebrow">A mano</p>
          <h2 id="resources-title" className="section-title">
            Recursos y avisos
          </h2>
          <Link href={library.href} className="flex gap-3 border-b border-slate-100 py-4">
            <BookOpen size={20} className="shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold">Centro normativo</h3>
              <p className="muted mt-1">Ley en PDF y preguntas frecuentes.</p>
              <p className="mt-2 text-xs text-slate-500">
                Actualización editorial: {library.faqUpdatedLabel}
              </p>
            </div>
          </Link>
          <Link href="/notifications" className="flex gap-3 py-4">
            <Bell size={20} className="shrink-0 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold">Notificaciones internas</h3>
              <p className="muted mt-1">Consulte los avisos de su actividad.</p>
            </div>
          </Link>
        </section>
      </div>
      <p className="muted">
        Los indicadores reflejan trabajo registrado y no constituyen una certificación de
        cumplimiento jurídico.
      </p>
    </>
  );
}
