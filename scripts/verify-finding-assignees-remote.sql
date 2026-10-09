-- PrivacyAudit only: temporary organization, accounts and findings; full rollback.
begin;
select set_config('finding_test.admin',gen_random_uuid()::text,true);
select set_config('finding_test.client',gen_random_uuid()::text,true);
select set_config('finding_test.consultant',gen_random_uuid()::text,true);
select set_config('finding_test.outsider',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('finding_test.'||actor)::uuid,current_setting('finding_test.'||actor)||'@example.test',now(),jsonb_build_object('full_name','Temporary finding check '||actor)
from unnest(array['admin','client','consultant','outsider']) actor;
update public.profiles set role='SUPER_ADMIN' where id=current_setting('finding_test.admin')::uuid;
update public.profiles set role='CONSULTANT' where id=current_setting('finding_test.consultant')::uuid;
select set_config('request.jwt.claim.sub',current_setting('finding_test.admin'),true);
set local role authenticated;
select set_config('finding_test.org',public.create_organization(jsonb_build_object('legal_name','Temporary finding assignment check','rut',(select n::text||'-'||d from generate_series(99008000,99008100) n cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1)))::text,true);
select public.manage_member(current_setting('finding_test.org')::uuid,current_setting('finding_test.client')::uuid,'CLIENT');
select public.manage_member(current_setting('finding_test.org')::uuid,current_setting('finding_test.consultant')::uuid,'CONSULTANT');
select set_config('finding_test.assessment',public.create_assessment(current_setting('finding_test.org')::uuid,'Temporary assessment')::text,true);
select set_config('request.jwt.claim.sub',current_setting('finding_test.consultant'),true);
with f as (insert into public.findings(organization_id,assessment_id,title,description,assigned_to) values(current_setting('finding_test.org')::uuid,current_setting('finding_test.assessment')::uuid,'Valid client assignment','Temporary finding description',current_setting('finding_test.client')::uuid) returning id)
select set_config('finding_test.finding',(select id::text from f),true);
do $$ declare candidate uuid; begin
 foreach candidate in array array[current_setting('finding_test.consultant')::uuid,current_setting('finding_test.admin')::uuid,current_setting('finding_test.outsider')::uuid] loop
  begin
   update public.findings set assigned_to=candidate where id=current_setting('finding_test.finding')::uuid;
   raise exception 'Invalid finding assignment accepted' using errcode='P0002';
  exception when sqlstate '23514' or sqlstate 'P0001' then null; end;
 end loop;
end $$;
update public.findings set assigned_to=null where id=current_setting('finding_test.finding')::uuid;
update public.findings set assigned_to=current_setting('finding_test.client')::uuid where id=current_setting('finding_test.finding')::uuid;
select 'finding_clients_only_and_unassigned_ok_rolled_back' as verification;
rollback;
