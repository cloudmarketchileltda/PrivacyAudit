import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { accountHandler } from './handler.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const publicKey = Deno.env.get('SUPABASE_ANON_KEY')!;
Deno.serve(
  accountHandler({
    async authorize(token) {
      const client = createClient(url, publicKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);
      if (error || !user) return null;
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      return profileError || !profile ? null : { id: user.id, role: profile.role };
    },
    async create(input, actor, token) {
      const client = createClient(url, publicKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: reservation, error: reservationError } = await client.rpc(
        'reserve_account_provisioning',
        {
          account_email: input.email,
          account_name: input.full_name,
          account_role: input.role,
        },
      );
      if (reservationError || typeof reservation !== 'string') return { error: 'creation_failed' };
      // Privileged credential stays exclusively in the Supabase function runtime.
      const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await admin.auth.admin.createUser({
        id: reservation,
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { full_name: input.full_name },
        app_metadata: { provisioned_by: actor, provisioned_role: input.role },
      });
      if (error) {
        await client.rpc('cancel_account_provisioning', { reservation_id: reservation });
        return { error: 'creation_failed' };
      }
      return { id: data.user.id };
    },
  }),
);
