-- Run only in the identified PrivacyAudit project. All fixtures are rolled back.
-- Tests DB permissions and full relational deletion, not Auth JWTs or real Storage blobs.
begin;
select set_config('org_crud.admin',gen_random_uuid()::text,true);
select set_config('org_crud.consultant',gen_random_uuid()::text,true);
select set_config('org_crud.rut',(select n::text||'-'||d from generate_series(99005000,99005100) n cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) select current_setting('org_crud.'||actor)::uuid,current_setting('org_crud.'||actor)||'@example.test',now(),'{"full_name":"Temporary organization CRUD check"}'::jsonb from unnest(array['admin','consultant']) actor;
update public.profiles set role='SUPER_ADMIN' where id=current_setting('org_crud.admin')::uuid;
update public.profiles set role='CONSULTANT' where id=current_setting('org_crud.consultant')::uuid;
select set_config('request.jwt.claim.sub',current_setting('org_crud.admin'),true);
set local role authenticated;
select set_config('org_crud.org',public.create_organization(jsonb_build_object('legal_name','Temporary organization CRUD','rut',current_setting('org_crud.rut')))::text,true);
select public.manage_member(current_setting('org_crud.org')::uuid,current_setting('org_crud.consultant')::uuid,'CONSULTANT');
update public.organizations set industry='CRUD check' where id=current_setting('org_crud.org')::uuid;
select set_config('request.jwt.claim.sub',current_setting('org_crud.consultant'),true);
do $$ begin
 begin perform public.create_organization('{}'); raise exception 'Consultant creation allowed' using errcode='P0002'; exception when insufficient_privilege then null; end;
 update public.organizations set industry='Unauthorized' where id=current_setting('org_crud.org')::uuid;
 if found then raise exception 'Consultant modification allowed'; end if;
 begin delete from public.organizations where id=current_setting('org_crud.org')::uuid; raise exception 'Direct deletion allowed' using errcode='P0002'; exception when insufficient_privilege then null; end;
 begin perform public.prepare_organization_deletion(current_setting('org_crud.org')::uuid,'ELIMINAR ORGANIZACION'); raise exception 'Consultant deletion allowed' using errcode='P0002'; exception when insufficient_privilege then null; end;
end $$;
select set_config('org_crud.assessment',public.create_assessment(current_setting('org_crud.org')::uuid,'Temporary CRUD assessment')::text,true);
with row as(insert into public.findings(organization_id,assessment_id,title,description) values(current_setting('org_crud.org')::uuid,current_setting('org_crud.assessment')::uuid,'Temporary finding','Deletion check') returning id) select set_config('org_crud.finding',(select id::text from row),true);
insert into public.tasks(organization_id,finding_id,title) values(current_setting('org_crud.org')::uuid,current_setting('org_crud.finding')::uuid,'Temporary task');
insert into public.comments(organization_id,finding_id,body) values(current_setting('org_crud.org')::uuid,current_setting('org_crud.finding')::uuid,'Temporary comment');
insert into public.processing_activities(organization_id,name,purpose,data_subject_categories,personal_data_categories) values(current_setting('org_crud.org')::uuid,'Temporary treatment','Deletion check',array['CLIENTS'],array['CONTACT']);
select set_config('request.jwt.claim.sub',current_setting('org_crud.admin'),true);
select public.prepare_organization_deletion(current_setting('org_crud.org')::uuid,'ELIMINAR ORGANIZACION');
do $$ begin
 begin update public.organizations set industry='Late write' where id=current_setting('org_crud.org')::uuid; raise exception 'Pending deletion mutation allowed' using errcode='P0002'; exception when insufficient_privilege then null; end;
end $$;
select public.organization_deletion_files(current_setting('org_crud.org')::uuid);
select public.finish_organization_deletion(current_setting('org_crud.org')::uuid);
do $$ declare t text; remaining bigint; begin
 if exists(select 1 from public.organizations where id=current_setting('org_crud.org')::uuid) then raise exception 'Organization retained'; end if;
 foreach t in array array['organization_members','organization_invitations','assessments','assessment_controls','processing_activities','findings','tasks','evidence','comments','notifications','audit_logs'] loop
 execute format('select count(*) from public.%I where organization_id=$1',t) into remaining using current_setting('org_crud.org')::uuid;
 if remaining<>0 then raise exception 'Related rows retained: %',t; end if;
 end loop;
 if exists(select 1 from public.audit_logs where organization_ref=current_setting('org_crud.org')::uuid) then raise exception 'Organization audit retained'; end if;
 if (select count(*) from public.profiles where id in(current_setting('org_crud.admin')::uuid,current_setting('org_crud.consultant')::uuid))<>2 then raise exception 'Accounts deleted'; end if;
end $$;
reset role;
do $$ begin if exists(select 1 from private.organization_deletions where organization_id=current_setting('org_crud.org')::uuid) then raise exception 'Pending state retained'; end if; end $$;
select 'organization_admin_crud_and_relational_deletion_ok_rolled_back' as verification;
rollback;
