-- PrivacyAudit only. Temporary users, organization and evaluation subtree are rolled back.
-- No real account/data is modified. SQL verification does not simulate a real Storage API deletion.
begin;
select set_config('assessment_test.admin',gen_random_uuid()::text,true);
select set_config('assessment_test.consultant',gen_random_uuid()::text,true);
select set_config('assessment_test.client',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('assessment_test.'||actor)::uuid,current_setting('assessment_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary assessment deletion check"}'::jsonb
from unnest(array['admin','consultant','client']) actor;
update public.profiles set role='SUPER_ADMIN' where id=current_setting('assessment_test.admin')::uuid;
update public.profiles set role='CONSULTANT' where id=current_setting('assessment_test.consultant')::uuid;
select set_config('request.jwt.claim.sub',current_setting('assessment_test.admin'),true);
select set_config('assessment_test.rut',(select b::text||'-'||d from generate_series(77000000,77000999) b cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d where private.valid_rut(b::text||'-'||d) and not exists(select 1 from public.organizations where rut=b::text||'-'||d) limit 1),true);
set local role authenticated;
select set_config('assessment_test.org',public.create_organization(jsonb_build_object('legal_name','Temporary assessment deletion verification','rut',current_setting('assessment_test.rut')))::text,true);
select public.manage_member(current_setting('assessment_test.org')::uuid,current_setting('assessment_test.consultant')::uuid,'CONSULTANT');
select public.manage_member(current_setting('assessment_test.org')::uuid,current_setting('assessment_test.client')::uuid,'CLIENT');
select set_config('request.jwt.claim.sub',current_setting('assessment_test.consultant'),true);
select set_config('assessment_test.assessment',public.create_assessment(current_setting('assessment_test.org')::uuid,'Temporary removable assessment','SQL verification')::text,true);
select set_config('assessment_test.other',public.create_assessment(current_setting('assessment_test.org')::uuid,'Temporary preserved assessment','SQL verification')::text,true);
select set_config('assessment_test.finding',(inserted.id)::text,true) from (
 select gen_random_uuid() as id
) inserted;
insert into public.findings(id,organization_id,assessment_id,title,description)
values(current_setting('assessment_test.finding')::uuid,current_setting('assessment_test.org')::uuid,current_setting('assessment_test.assessment')::uuid,'Temporary finding','SQL verification');
select set_config('assessment_test.task',gen_random_uuid()::text,true);
insert into public.tasks(id,organization_id,finding_id,title)
values(current_setting('assessment_test.task')::uuid,current_setting('assessment_test.org')::uuid,current_setting('assessment_test.finding')::uuid,'Temporary task');
insert into public.comments(organization_id,task_id,body) values(current_setting('assessment_test.org')::uuid,current_setting('assessment_test.task')::uuid,'Temporary comment');
select public.create_report(current_setting('assessment_test.assessment')::uuid,'Temporary report','Summary for SQL verification','Scope for SQL verification','Conclusions for SQL verification');
update public.assessments set name='Edited temporary assessment' where id=current_setting('assessment_test.assessment')::uuid;
select set_config('request.jwt.claim.sub',current_setting('assessment_test.client'),true);
do $$ begin
 begin perform public.prepare_assessment_deletion(current_setting('assessment_test.assessment')::uuid,'ELIMINAR EVALUACION'); raise exception 'Client deletion allowed' using errcode='P0002'; exception when sqlstate '42501' then null; end;
 if exists(select 1 from public.assessments where id=current_setting('assessment_test.assessment')::uuid and deletion_pending) then raise exception 'Client prepared deletion'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('assessment_test.consultant'),true);
select public.prepare_assessment_deletion(current_setting('assessment_test.assessment')::uuid,'ELIMINAR EVALUACION');
do $$ begin
 begin update public.assessments set name='Blocked edit' where id=current_setting('assessment_test.assessment')::uuid; raise exception 'Pending evaluation editable' using errcode='P0002'; exception when sqlstate '42501' then null; end;
 if cardinality(public.assessment_deletion_files(current_setting('assessment_test.assessment')::uuid))<>0 then raise exception 'Unexpected files'; end if;
end $$;
reset role;
do $$ begin
 if private.emit_notification(current_setting('assessment_test.org')::uuid,'TASK_OVERDUE','Pending task','Pending task','pending-check',current_setting('assessment_test.task')::uuid,current_setting('assessment_test.finding')::uuid,null,current_setting('assessment_test.consultant')::uuid,true,false)<>0 then raise exception 'Notice emitted into pending evaluation'; end if;
end $$;
set local role authenticated;
select public.finish_assessment_deletion(current_setting('assessment_test.assessment')::uuid);
reset role;
do $$ begin
 if exists(select 1 from public.assessments where id=current_setting('assessment_test.assessment')::uuid)
 or exists(select 1 from public.assessment_controls where assessment_id=current_setting('assessment_test.assessment')::uuid)
 or exists(select 1 from public.findings where id=current_setting('assessment_test.finding')::uuid)
 or exists(select 1 from public.tasks where id=current_setting('assessment_test.task')::uuid)
 or exists(select 1 from public.comments where task_id=current_setting('assessment_test.task')::uuid)
 or exists(select 1 from public.reports where assessment_id=current_setting('assessment_test.assessment')::uuid)
 or exists(select 1 from public.audit_logs where entity_id in(current_setting('assessment_test.assessment')::uuid,current_setting('assessment_test.finding')::uuid,current_setting('assessment_test.task')::uuid) or position(current_setting('assessment_test.assessment') in metadata::text)>0) then raise exception 'Related data retained'; end if;
 if not exists(select 1 from public.assessments where id=current_setting('assessment_test.other')::uuid) then raise exception 'Other evaluation deleted'; end if;
 if not exists(select 1 from public.audit_logs where action='ASSESSMENT_DELETED' and actor_id=current_setting('assessment_test.consultant')::uuid) then raise exception 'Missing receipt'; end if;
end $$;
select 'Assessment deletion SQL verification passed; rolling back all fixtures' as result;
rollback;
