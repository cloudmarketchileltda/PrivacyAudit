import 'server-only';
import type { Database } from '@/types/database';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isConfigured } from '@/lib/config';
export async function createClient() {
  if (!isConfigured()) throw new Error('Configure Supabase antes de continuar.');
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(items) {
          try {
            items.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* Server Components: el proxy escribe las cookies. */
          }
        },
      },
    },
  );
}
