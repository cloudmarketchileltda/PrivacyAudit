import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { assessmentDeletionHandler } from './handler.ts';
import { assessmentDeletionConfirmation } from '../_shared/assessment-deletion.ts';
const url = Deno.env.get('SUPABASE_URL')!;
const clientFor = (token: string) =>
  createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
Deno.serve(
  assessmentDeletionHandler({
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
    async prepare(assessment, token) {
      const client = clientFor(token);
      const { data, error: readError } = await client
        .from('assessments')
        .select('organization_id')
        .eq('id', assessment)
        .single();
      if (readError || !data) throw readError ?? new Error('Evaluación no disponible');
      const { error } = await client.rpc('prepare_assessment_deletion', {
        assessment,
        confirmation: assessmentDeletionConfirmation,
      });
      if (error) throw error;
      return data.organization_id;
    },
    async files(assessment, token) {
      const { data, error } = await clientFor(token).rpc('assessment_deletion_files', {
        assessment,
      });
      if (error || !Array.isArray(data) || data.some((path) => typeof path !== 'string'))
        throw error ?? new Error('Listado inválido');
      return data;
    },
    async remove(paths) {
      const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.storage.from('evidence').remove(paths);
      if (error) throw error;
    },
    async finish(assessment, token) {
      const { error } = await clientFor(token).rpc('finish_assessment_deletion', { assessment });
      if (error) throw error;
    },
  }),
);
