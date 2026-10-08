begin;
select set_config('privacyaudit.test.admin',(select id::text from public.profiles where role='SUPER_ADMIN' limit 1),true);
-- Auth-role gate is checked separately through the real Auth API.
do $$
begin
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 values('90000000-0000-4000-8000-000000000099','temporary-admin-created@example.test','{"full_name":"Temporary consultant"}',jsonb_build_object('provisioned_by',current_setting('privacyaudit.test.admin'),'provisioned_role','CONSULTANT'));
end $$;
reset role;
do $$
begin
 if not exists(select 1 from public.profiles where id='90000000-0000-4000-8000-000000000099' and role='CONSULTANT' and not consultant_enrollment_allowed) then raise exception 'Initial role incorrect'; end if;
 if not exists(select 1 from public.audit_logs where entity_id='90000000-0000-4000-8000-000000000099' and action='ADMIN_ACCOUNT_CREATED' and actor_id::text=current_setting('privacyaudit.test.admin')) then raise exception 'Missing administrator actor';end if;
end $$;
select set_config('request.jwt.claim.sub','90000000-0000-4000-8000-000000000099',true);
set local role authenticated;
do $$ begin
 begin perform public.register_consultant(); raise exception 'Self enrollment allowed'; exception when insufficient_privilege then null;end;
 begin perform public.set_user_role(auth.uid(),'SUPER_ADMIN'); raise exception 'Role escalation allowed'; exception when insufficient_privilege then null;end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.test.admin'),true);
set local role authenticated;
select public.set_user_role('90000000-0000-4000-8000-000000000099','CLIENT');
reset role;
do $$ begin
 if not exists(select 1 from public.profiles where id='90000000-0000-4000-8000-000000000099' and role='CLIENT') then raise exception 'Admin role change failed';end if;
end $$;
rollback;
