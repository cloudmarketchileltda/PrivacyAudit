'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ListChecks,
  ClipboardList,
  FolderOpen,
  Users,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
export function Navigation({ admin }: { admin: boolean }) {
  const path = usePathname();
  const items = [
    ['/dashboard', 'Dashboard', LayoutDashboard],
    ['/organizations', 'Organizaciones', Building2],
    ['/assessments', 'Evaluaciones', ClipboardList],
    ['/processing', 'Tratamientos', FolderOpen],
    ['/controls', 'Catálogo de controles', ListChecks],
    ...(admin ? [['/users', 'Usuarios', Users] as const] : []),
    ['/account', 'Mi cuenta', UserRound],
  ] as const;
  return (
    <nav
      aria-label="Navegación principal"
      className="flex overflow-x-auto gap-1 lg:flex-col lg:overflow-visible"
    >
      {items.map(([href, label, Icon]) => (
        <Link
          key={href}
          href={href}
          aria-current={path.startsWith(href) ? 'page' : undefined}
          className={cn(
            'flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white',
            path.startsWith(href) && 'bg-white/10 text-white',
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
