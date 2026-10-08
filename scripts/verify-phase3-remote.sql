-- Run only against the identified PrivacyAudit project after phase 3 migration.
-- All fixture data is rolled back. Tests DB roles/RLS, not Auth-issued JWTs or email.
begin;
select set_config('processing_test.a',gen_random_uuid()::text,true);
select set_config('processing_test.b',gen_random_uuid()::text,true);
select set_config('processing_test.client',gen_random_uuid()::text,true);
select set_config('processing_test.rut',(
 select n::text||'-'||d from generate_series(99000000,99000100) n
 cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d
 where private.valid_rut(n::text||'-'||d)
 and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1
),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('processing_test.'||actor)::uuid,
 current_setting('processing_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary phase 3 RLS check"}'::jsonb
from unnest(array['a','b','client']) actor;
update public.profiles set role='CONSULTANT' where id in(current_setting('processing_test.a')::uuid,current_setting('processing_test.b')::uuid);
update public.profiles set role='SUPER_ADMIN' where id=current_setting('processing_test.a')::uuid;
select set_config('request.jwt.claim.sub',current_setting('processing_test.a'),true);
set local role authenticated;
select set_config('processing_test.org',public.create_organization(jsonb_build_object('legal_name','Temporary phase 3 check','rut',current_setting('processing_test.rut')))::text,true);
reset role;
update public.profiles set role='CONSULTANT' where id=current_setting('processing_test.a')::uuid;
insert into public.organization_members(organization_id,user_id,role) values(current_setting('processing_test.org')::uuid,current_setting('processing_test.a')::uuid,'CONSULTANT');
set local role authenticated;
with inserted as (
 insert into public.processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories,created_by)
 values(current_setting('processing_test.org')::uuid,'Temporary processing','Test isolation',array['CLIENTS'],array['CONTACT'],current_setting('processing_test.b')::uuid) returning id
) select set_config('processing_test.activity',(select id::text from inserted),true);
do $$ begin
 if not exists(select 1 from public.processing_activities where id=current_setting('processing_test.activity')::uuid and created_by=auth.uid()) then raise exception 'Author spoofing'; end if;
 update public.processing_activities set status='ACTIVE' where id=current_setting('processing_test.activity')::uuid;
 if not found then raise exception 'Manager cannot update'; end if;
 begin
  update public.processing_activities set organization_id=gen_random_uuid() where id=current_setting('processing_test.activity')::uuid;
  raise exception 'Identity mutation allowed';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('processing_test.token',public.invite_client(current_setting('processing_test.org')::uuid,current_setting('processing_test.client')||'@example.test'),true);
select set_config('request.jwt.claim.sub',current_setting('processing_test.b'),true);
do $$ begin
 if exists(select 1 from public.processing_activities where id=current_setting('processing_test.activity')::uuid) then raise exception 'Cross-tenant read'; end if;
 update public.processing_activities set name='Intrusion' where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Cross-tenant update'; end if;
 delete from public.processing_activities where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Cross-tenant delete'; end if;
 begin
  insert into public.processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values(current_setting('processing_test.org')::uuid,'Intrusion','Cross tenant insertion',array['CLIENTS'],array['CONTACT']);
  raise exception 'Cross-tenant insert';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('processing_test.client'),true);
select public.accept_invitation(current_setting('processing_test.token'));
do $$ begin
 if not exists(select 1 from public.processing_activities where id=current_setting('processing_test.activity')::uuid) then raise exception 'Client cannot read'; end if;
 update public.processing_activities set name='Client intrusion' where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Client update'; end if;
 delete from public.processing_activities where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Client delete'; end if;
 begin
  insert into public.processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values(current_setting('processing_test.org')::uuid,'Client intrusion','Unauthorized creation',array['CLIENTS'],array['CONTACT']);
  raise exception 'Client insert';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('processing_test.a'),true);
reset role;
update public.organizations set status='ARCHIVED' where id=current_setting('processing_test.org')::uuid;
set local role authenticated;
do $$ begin
 update public.processing_activities set name='Archived edit' where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Archived organization update'; end if;
 delete from public.processing_activities where id=current_setting('processing_test.activity')::uuid;
 if found then raise exception 'Archived organization delete'; end if;
 begin
  insert into public.processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values(current_setting('processing_test.org')::uuid,'Archived creation','Unauthorized creation',array['CLIENTS'],array['CONTACT']);
  raise exception 'Archived organization insert';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform 1 from public.processing_activities;
  raise exception 'Anonymous read';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'Phase 3 RLS checks passed; fixture data rolled back' as result;
