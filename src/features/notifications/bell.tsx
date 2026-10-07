'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
export function NotificationBell({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  useEffect(() => {
    let active = true;
    async function refresh() {
      if (document.visibilityState !== 'visible') return;
      try {
        const response = await fetch('/api/notifications/unread', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (active) setCount(data.count);
        }
      } catch {
        /* Keep the last known count when offline. */
      }
    }
    const timer = setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return (
    <Link
      href="/notifications"
      aria-label={`Notificaciones: ${count} sin leer`}
      title="Notificaciones internas"
      className="relative shrink-0 p-2 rounded-md hover:bg-slate-100"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 rounded-full bg-teal-800 text-white text-[10px] min-w-4 px-1 text-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
