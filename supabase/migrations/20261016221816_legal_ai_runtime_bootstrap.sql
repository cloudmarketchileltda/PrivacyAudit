-- Credential remains in Vault. Only the hosted Function's reserved service identity can retrieve it.
-- PGlite does not implement Vault; provisioning is verified separately on hosted Supabase.
do $$
declare password_value text;
begin
 if exists(select 1 from pg_extension where extname='supabase_vault') then
  if not exists(select 1 from vault.secrets where name='legal_ai_worker_password') then
   password_value:=encode(extensions.gen_random_bytes(32),'hex');
   execute format('alter role legal_ai_worker password %L',password_value);
   perform vault.create_secret(password_value,'legal_ai_worker_password','Restricted normative AI runtime login');
  end if;
 end if;
end $$;
create function private.legal_ai_runtime_password() returns text language plpgsql security definer set search_path='' as $$
declare value text;
begin
 select decrypted_secret into value from vault.decrypted_secrets where name='legal_ai_worker_password';
 if value is null then raise exception 'runtime_not_provisioned'; end if;
 return value;
end $$;
create function public.legal_ai_runtime_password() returns text language sql security invoker set search_path='' as $$ select private.legal_ai_runtime_password(); $$;
revoke all on function private.legal_ai_runtime_password(),public.legal_ai_runtime_password() from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.legal_ai_runtime_password(),public.legal_ai_runtime_password() to service_role;
