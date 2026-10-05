-- Isolated database permission check. Everything, including identities, is rolled back.
-- This tests PostgreSQL roles and RLS; it does not test Auth-issued sessions or email.
begin;
select set_config('privacy_test.a',gen_random_uuid()::text,true);
select set_config('privacy_test.b',gen_random_uuid()::text,true);
select set_config('privacy_test.client',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('privacy_test.'||actor)::uuid,actor||'@example.test',now(),'{"full_name":"Temporary RLS check","role":"SUPER_ADMIN"}'::jsonb
from unnest(array['a','b','client']) actor;
do $$ begin
 if exists(select 1 from public.profiles where id=current_setting('privacy_test.a')::uuid and role<>'CLIENT') then raise exception 'Metadata escalated role'; end if;
end $$;
update public.profiles set role='CONSULTANT' where id in(current_setting('privacy_test.a')::uuid,current_setting('privacy_test.b')::uuid);
select set_config('request.jwt.claim.sub',current_setting('privacy_test.a'),true);
set local role authenticated;
select set_config('privacy_test.org',public.create_organization('{"legal_name":"Temporary RLS check A","rut":"76123456-0"}')::text,true);
select set_config('privacy_test.assessment',public.create_assessment(current_setting('privacy_test.org')::uuid,'Temporary assessment','')::text,true);
do $$ begin
 if (select count(*) from public.assessment_controls where assessment_id=current_setting('privacy_test.assessment')::uuid)<>52 then raise exception 'Snapshot count mismatch'; end if;
 begin
  update public.assessments set status='COMPLETED' where id=current_setting('privacy_test.assessment')::uuid;
  raise exception 'Completion with pending controls allowed';
 exception when raise_exception then
  if sqlerrm <> 'Controles pendientes' then raise; end if;
 end;
 begin
  update public.profiles set role='SUPER_ADMIN' where id=auth.uid();
  raise exception 'Role escalation allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('privacy_test.token',public.invite_client(current_setting('privacy_test.org')::uuid,'client@example.test'),true);
select set_config('request.jwt.claim.sub',current_setting('privacy_test.b'),true);
do $$ begin
 if exists(select 1 from public.organizations where id=current_setting('privacy_test.org')::uuid) then raise exception 'Cross-tenant organization read'; end if;
 if exists(select 1 from public.assessment_controls where assessment_id=current_setting('privacy_test.assessment')::uuid) then raise exception 'Cross-tenant response read'; end if;
 update public.organizations set legal_name='Unauthorized' where id=current_setting('privacy_test.org')::uuid;
 if found then raise exception 'Cross-tenant write'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacy_test.client'),true);
select public.accept_invitation(current_setting('privacy_test.token'));
do $$ declare response uuid; begin
 if not exists(select 1 from public.organizations where id=current_setting('privacy_test.org')::uuid) then raise exception 'Invited client cannot read'; end if;
 select id into response from public.assessment_controls where assessment_id=current_setting('privacy_test.assessment')::uuid limit 1;
 perform public.update_client_comment(response,'Temporary client comment');
 if not exists(select 1 from public.assessment_controls where id=response and client_comment='Temporary client comment' and status='PENDING' and evaluated_by is null and evaluated_at is null) then raise exception 'Client comment corrupted evaluation'; end if;
 update public.assessment_controls set status='CONFORM' where id=response;
 if found then raise exception 'Client changed audit status'; end if;
 begin
  perform public.register_consultant();
  raise exception 'Invited client escalated';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform 1 from public.organizations;
  raise exception 'Anonymous data access';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
