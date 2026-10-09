import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { mutationHandler } from './handler.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const clientFor = (token: string) =>
  createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve(
  mutationHandler({
    async authorize(token) {
      const client = clientFor(token);
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);
      if (error || !user) return null;
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return profile ? { id: user.id, role: profile.role } : null;
    },
    async mutate(input, token) {
      const client = clientFor(token);
      if (input.operation === 'RESET_PASSWORD') {
        const { data: receipt, error } = await client.rpc('reserve_password_reset', {
          target: input.target,
        });
        if (error || typeof receipt !== 'string') return false;
        try {
          const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          const { error: resetError } = await admin.auth.admin.updateUserById(input.target, {
            password: input.password,
            app_metadata: { password_reset_receipt: receipt },
          });
          if (resetError) return false;
          const completed = await client.rpc('password_reset_completed', { receipt });
          return !completed.error && completed.data === true;
        } finally {
          await client.rpc('cancel_password_reset', { receipt });
        }
      }
      const { data: reservation, error } = await client.rpc(
        input.contact ? 'reserve_account_contact_mutation' : 'reserve_account_mutation',
        {
          target: input.target,
          operation: input.operation,
          account_email: input.email ?? null,
          account_name: input.full_name ?? null,
          ...(input.contact ? { contact: input.contact } : {}),
        },
      );
      if (error || typeof reservation !== 'string') return false;
      try {
        const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const result =
          input.operation === 'DELETE'
            ? await admin.auth.admin.deleteUser(input.target)
            : await admin.auth.admin.updateUserById(input.target, {
                email: input.email,
                email_confirm: true,
                user_metadata: { full_name: input.full_name },
              });
        if (result.error) return false;
        const completed = await client.rpc('account_mutation_completed', {
          reservation_id: reservation,
        });
        return !completed.error && completed.data === true;
      } finally {
        await client.rpc('cancel_account_mutation', { reservation_id: reservation });
      }
    },
  }),
);
