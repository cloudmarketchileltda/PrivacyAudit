-- Only run against the identified PrivacyAudit project. All fixtures are rolled back.
begin;
select set_config('workflow_test.a',gen_random_uuid()::text,true);
select set_config('workflow_test.b',gen_random_uuid()::text,true);
select set_config('workflow_test.client',gen_random_uuid()::text,true);
select set_config('workflow_test.rut',(
 select n::text||'-'||d from generate_series(99001000,99001100) n
 cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d
 where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1
),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('workflow_test.'||actor)::uuid,current_setting('workflow_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary phase 4 check"}'::jsonb from unnest(array['a','b','client']) actor;
update public.profiles set role='CONSULTANT' where id in(current_setting('workflow_test.a')::uuid,current_setting('workflow_test.b')::uuid);
select set_config('request.jwt.claim.sub',current_setting('workflow_test.a'),true);
set local role authenticated;
select set_config('workflow_test.org',public.create_organization(jsonb_build_object('legal_name','Temporary phase 4 check','rut',current_setting('workflow_test.rut')))::text,true);
select set_config('workflow_test.assessment',public.create_assessment(current_setting('workflow_test.org')::uuid,'Temporary assessment')::text,true);
select set_config('workflow_test.control',(select id::text from public.assessment_controls where assessment_id=current_setting('workflow_test.assessment')::uuid limit 1),true);
select set_config('workflow_test.token',public.invite_client(current_setting('workflow_test.org')::uuid,current_setting('workflow_test.client')||'@example.test'),true);
select set_config('request.jwt.claim.sub',current_setting('workflow_test.client'),true);
select public.accept_invitation(current_setting('workflow_test.token'));
select set_config('request.jwt.claim.sub',current_setting('workflow_test.a'),true);
with inserted as(insert into public.findings(organization_id,assessment_id,control_id,title,description,assigned_to,created_by)
 values(current_setting('workflow_test.org')::uuid,current_setting('workflow_test.assessment')::uuid,current_setting('workflow_test.control')::uuid,'Temporary finding','Test isolated workflow',current_setting('workflow_test.client')::uuid,current_setting('workflow_test.b')::uuid) returning id)
select set_config('workflow_test.finding',(select id::text from inserted),true);
with inserted as(insert into public.tasks(organization_id,finding_id,title,assigned_to)
 values(current_setting('workflow_test.org')::uuid,current_setting('workflow_test.finding')::uuid,'Temporary task',current_setting('workflow_test.client')::uuid) returning id)
select set_config('workflow_test.task',(select id::text from inserted),true);
do $$ begin
 if not exists(select 1 from public.findings where id=current_setting('workflow_test.finding')::uuid and created_by=auth.uid()) then raise exception 'Author spoofing'; end if;
 begin
  update public.findings set assigned_to=current_setting('workflow_test.b')::uuid where id=current_setting('workflow_test.finding')::uuid;
  raise exception 'External assignee accepted' using errcode='P0002';
 exception when raise_exception then null;
 end;
 begin
  update public.findings set status='CLOSED',closure_note='Test close' where id=current_setting('workflow_test.finding')::uuid;
  raise exception 'Closure with pending task' using errcode='P0002';
 exception when raise_exception then null;
 end;
 begin
  update public.tasks set status='DONE' where id=current_setting('workflow_test.task')::uuid;
  raise exception 'Approval without review' using errcode='P0002';
 exception when raise_exception then null;
 end;
 begin
  update public.tasks set organization_id=gen_random_uuid() where id=current_setting('workflow_test.task')::uuid;
  raise exception 'Identity mutable' using errcode='P0002';
 exception when insufficient_privilege or raise_exception then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('workflow_test.b'),true);
do $$ begin
 if exists(select 1 from public.findings where id=current_setting('workflow_test.finding')::uuid) or exists(select 1 from public.tasks where id=current_setting('workflow_test.task')::uuid) then raise exception 'Cross tenant read'; end if;
 update public.tasks set title='Intrusion' where id=current_setting('workflow_test.task')::uuid;
 if found then raise exception 'Cross tenant update'; end if;
 begin
  perform public.submit_task(current_setting('workflow_test.task')::uuid,'WAITING_REVIEW');
  raise exception 'Cross tenant submit' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.finding_progress(current_setting('workflow_test.finding')::uuid);
  raise exception 'Cross tenant progress' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('workflow_test.client'),true);
do $$ begin
 if not exists(select 1 from public.tasks where id=current_setting('workflow_test.task')::uuid) then raise exception 'Client cannot read own task'; end if;
 update public.tasks set title='Client mutation' where id=current_setting('workflow_test.task')::uuid;
 if found then raise exception 'Client direct update'; end if;
 update public.findings set severity='LOW' where id=current_setting('workflow_test.finding')::uuid;
 if found then raise exception 'Client finding update'; end if;
 if exists(select 1 from public.audit_logs where organization_id=current_setting('workflow_test.org')::uuid) then raise exception 'Client audit read'; end if;
 begin
  perform public.submit_task(current_setting('workflow_test.task')::uuid,'DONE');
  raise exception 'Client self approval' using errcode='P0002';
 exception when raise_exception then null;
 end;
end $$;
select public.submit_task(current_setting('workflow_test.task')::uuid,'WAITING_REVIEW');
select set_config('request.jwt.claim.sub',current_setting('workflow_test.a'),true);
do $$ begin
 begin
  update public.tasks set status='TODO' where id=current_setting('workflow_test.task')::uuid;
  raise exception 'Returned without observations' using errcode='P0002';
 exception when raise_exception then null;
 end;
end $$;
update public.tasks set status='TODO',reviewer_comment='Add documented retention periods' where id=current_setting('workflow_test.task')::uuid;
select set_config('request.jwt.claim.sub',current_setting('workflow_test.client'),true);
select public.submit_task(current_setting('workflow_test.task')::uuid,'WAITING_REVIEW');
select set_config('request.jwt.claim.sub',current_setting('workflow_test.a'),true);
update public.tasks set status='DONE' where id=current_setting('workflow_test.task')::uuid;
update public.findings set status='CLOSED',closure_note='Reviewed and approved' where id=current_setting('workflow_test.finding')::uuid;
do $$ begin
 if not exists(select 1 from public.findings where id=current_setting('workflow_test.finding')::uuid and closed_at is not null) then raise exception 'Missing closure timestamp'; end if;
 if not exists(select 1 from public.tasks where id=current_setting('workflow_test.task')::uuid and completed_at is not null) then raise exception 'Missing approval timestamp'; end if;
 if public.finding_progress(current_setting('workflow_test.finding')::uuid) <> '{"total":1,"done":1}'::jsonb then raise exception 'Incorrect progress'; end if;
 if not exists(select 1 from public.audit_logs where organization_id=current_setting('workflow_test.org')::uuid and actor_id=current_setting('workflow_test.client')::uuid) then raise exception 'Missing client activity'; end if;
 begin
  update public.audit_logs set action='FAKE' where organization_id=current_setting('workflow_test.org')::uuid;
  raise exception 'Audit editable' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
end $$;
update public.findings set status='OPEN' where id=current_setting('workflow_test.finding')::uuid;
update public.organizations set status='ARCHIVED' where id=current_setting('workflow_test.org')::uuid;
select set_config('request.jwt.claim.sub',current_setting('workflow_test.client'),true);
do $$ begin
 begin
  perform public.submit_task(current_setting('workflow_test.task')::uuid,'IN_PROGRESS');
  raise exception 'Archived org submission' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform 1 from public.findings;
  raise exception 'Anonymous finding read' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.submit_task(current_setting('workflow_test.task')::uuid,'WAITING_REVIEW');
  raise exception 'Anonymous task update' using errcode='P0002';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
rollback;
select 'Phase 4 RLS and workflow checks passed; fixtures rolled back' as result;
