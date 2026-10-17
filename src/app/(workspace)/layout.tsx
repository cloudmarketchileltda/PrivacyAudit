import { Breadcrumbs } from '@/components/breadcrumbs';
import { ShieldCheck, LogOut } from 'lucide-react';
import Link from 'next/link';
import { generalConfig } from '@/config/general';
import { requireUser } from '@/features/auth/queries';
import { logout } from '@/features/auth/actions';
import { NotificationBell } from '@/features/notifications/bell';
import { MobileNavigation } from '@/components/mobile-navigation';
import { Navigation } from '@/components/navigation';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const { profile, user, db } = await requireUser();
  const { count, error } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  if (error) throw error;
  return (
    <div className="flex-1 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="brand-sidebar hidden text-white p-5 lg:sticky lg:top-0 lg:h-dvh lg:flex flex-col overflow-y-auto">
        <Link
          href={generalConfig.site.workspaceHomeHref}
          aria-label="PrivacyAudit — Ir al inicio"
          title="Ir al inicio"
          className="flex gap-2 items-center rounded-md text-xl font-semibold mb-5 lg:mb-10"
        >
          <ShieldCheck aria-hidden="true" className="text-blue-300" />
          PrivacyAudit
        </Link>
        <Navigation admin={profile.role === 'SUPER_ADMIN'} />
        <div className="mt-5 lg:mt-auto text-xs text-slate-400 lg:pt-8">
          Gestión de protección de datos
          <br />
          <span className="block mt-2">Espacio de auditoría</span>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="workspace-header sticky top-0 z-20 border-b border-slate-200/80 px-4 md:px-9 py-3 flex justify-between items-center gap-2">
          <MobileNavigation admin={profile.role === 'SUPER_ADMIN'} />
          <p className="hidden sm:block text-xs uppercase tracking-[.14em] text-slate-500">
            PrivacyAudit · CloudMarket
          </p>
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell key={count || 0} initialCount={count || 0} />
            <div className="text-right">
              <p className="text-sm font-semibold truncate max-w-40">
                {profile.full_name || user.email}
              </p>
              <p className="text-xs text-slate-500">
                {profile.role === 'SUPER_ADMIN'
                  ? 'Administrador'
                  : profile.role === 'CONSULTANT'
                    ? 'Consultor'
                    : 'Cliente'}
              </p>
            </div>
            <form action={logout}>
              <button
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="p-2 rounded-md hover:bg-slate-100"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </header>
        <main id="main-content" className="px-4 py-6 md:p-9 max-w-[1600px] mx-auto space-y-7">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
