-- PrivacyAudit only. All temporary identities, credentials and logs roll back.
-- Verifies SQL permissions and GoTrue's multi-UPDATE order, not an actual Auth login.
begin;
select set_config('password_test.admin',gen_random_uuid()::text,true);
select set_config('password_test.client',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('password_test.'||actor)::uuid,current_setting('password_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary password reset check"}'::jsonb
from unnest(array['admin','client']) actor;
update public.profiles set role='SUPER_ADMIN' where id=current_setting('password_test.admin')::uuid;
select set_config('request.jwt.claim.sub',current_setting('password_test.client'),true);
set local role authenticated;
do $$ begin
 begin perform public.reserve_password_reset(current_setting('password_test.admin')::uuid); raise exception 'Client reset allowed' using errcode='P0002'; exception when sqlstate '42501' then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('password_test.admin'),true);
do $$ begin
 begin perform public.reserve_password_reset(current_setting('password_test.admin')::uuid); raise exception 'Self reset allowed' using errcode='P0002'; exception when sqlstate '42501' then null; end;
end $$;
select set_config('password_test.receipt',public.reserve_password_reset(current_setting('password_test.client')::uuid)::text,true);
do $$ begin
 if public.password_reset_completed(current_setting('password_test.receipt')::uuid) then raise exception 'Premature completion'; end if;
end $$;
reset role;
insert into auth.sessions(id,user_id) values(gen_random_uuid(),current_setting('password_test.client')::uuid);
-- Hosted SQL connection cannot SET ROLE supabase_auth_admin.
-- Exercise the trigger as the SQL maintenance role; local tests cover the Auth role.
update auth.users set encrypted_password='temporary-sql-adapter-only' where id=current_setting('password_test.client')::uuid;
update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}')||jsonb_build_object('password_reset_receipt',current_setting('password_test.receipt')) where id=current_setting('password_test.client')::uuid;
reset role;
do $$ begin
 if exists(select 1 from auth.sessions where user_id=current_setting('password_test.client')::uuid) then raise exception 'Sessions retained'; end if;
 if (select count(*) from public.audit_logs where action='ADMIN_ACCOUNT_PASSWORD_RESET' and entity_id=current_setting('password_test.client')::uuid and actor_id=current_setting('password_test.admin')::uuid)<>1 then raise exception 'Missing or duplicate audit'; end if;
 if exists(select 1 from public.audit_logs where entity_id=current_setting('password_test.client')::uuid and metadata::text like '%temporary-sql-adapter-only%') then raise exception 'Credential exposed'; end if;
end $$;
set local role authenticated;
do $$ begin
 if not public.password_reset_completed(current_setting('password_test.receipt')::uuid) then raise exception 'Completion not confirmed'; end if;
end $$;
select public.cancel_password_reset(current_setting('password_test.receipt')::uuid);
do $$ begin
 if public.password_reset_completed(current_setting('password_test.receipt')::uuid) then raise exception 'Missing receipt reported complete'; end if;
end $$;
select 'password_reset_permissions_atomic_audit_sessions_ok_rolled_back' as verification;
rollback;
