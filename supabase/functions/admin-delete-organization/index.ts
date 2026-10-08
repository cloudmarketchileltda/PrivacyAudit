import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { deletionHandler } from './handler.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const clientFor = (token: string) =>
  createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve(
  deletionHandler({
    async authorize(token) {
      const client = clientFor(token);
      const {
        data: { user },
        error,
      } = await client.auth.getUser(token);
      if (error || !user) return null;
      const { data } = await client.from('profiles').select('role').eq('id', user.id).single();
      return data;
    },
    async prepare(org, token) {
      const { error } = await clientFor(token).rpc('prepare_organization_deletion', {
        org,
        confirmation: 'ELIMINAR ORGANIZACION',
      });
      if (error) throw error;
    },
    async files(org, token) {
      const { data, error } = await clientFor(token).rpc('organization_deletion_files', { org });
      if (error || !Array.isArray(data)) throw error ?? new Error('Listado inválido');
      return data;
    },
    async remove(paths) {
      const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.storage.from('evidence').remove(paths);
      if (error) throw error;
    },
    async finish(org, token) {
      const { error } = await clientFor(token).rpc('finish_organization_deletion', { org });
      if (error) throw error;
    },
  }),
);
