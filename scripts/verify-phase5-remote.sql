-- SQL authorization verification only; it does not upload blobs or issue Auth sessions.
-- Execute only against the identified PrivacyAudit project. Everything rolls back.
begin;
select set_config('evidence_test.a',gen_random_uuid()::text,true);
select set_config('evidence_test.b',gen_random_uuid()::text,true);
select set_config('evidence_test.client',gen_random_uuid()::text,true);
select set_config('evidence_test.rut',(
 select n::text||'-'||d from generate_series(99002000,99002100) n
 cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d
 where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1
),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
select current_setting('evidence_test.'||actor)::uuid,current_setting('evidence_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary phase 5 check"}'::jsonb from unnest(array['a','b','client']) actor;
update public.profiles set role='CONSULTANT' where id in(current_setting('evidence_test.a')::uuid,current_setting('evidence_test.b')::uuid);
select set_config('request.jwt.claim.sub',current_setting('evidence_test.a'),true);
set local role authenticated;
select set_config('evidence_test.org',public.create_organization(jsonb_build_object('legal_name','Temporary phase 5 check','rut',current_setting('evidence_test.rut')))::text,true);
select set_config('evidence_test.assessment',public.create_assessment(current_setting('evidence_test.org')::uuid,'Temporary assessment')::text,true);
select set_config('evidence_test.control',(select id::text from public.assessment_controls where assessment_id=current_setting('evidence_test.assessment')::uuid limit 1),true);
select set_config('evidence_test.token',public.invite_client(current_setting('evidence_test.org')::uuid,current_setting('evidence_test.client')||'@example.test'),true);
select set_config('request.jwt.claim.sub',current_setting('evidence_test.client'),true);
select public.accept_invitation(current_setting('evidence_test.token'));
select set_config('request.jwt.claim.sub',current_setting('evidence_test.a'),true);
with inserted as(insert into public.findings(organization_id,assessment_id,control_id,title,description)
 values(current_setting('evidence_test.org')::uuid,current_setting('evidence_test.assessment')::uuid,current_setting('evidence_test.control')::uuid,'Temporary finding','Temporary check') returning id)
select set_config('evidence_test.finding',(select id::text from inserted),true);
with inserted as(insert into public.tasks(organization_id,finding_id,title,assigned_to)
 values(current_setting('evidence_test.org')::uuid,current_setting('evidence_test.finding')::uuid,'Temporary task',current_setting('evidence_test.client')::uuid) returning id)
select set_config('evidence_test.task',(select id::text from inserted),true);
select set_config('request.jwt.claim.sub',current_setting('evidence_test.client'),true);
select set_config('evidence_test.item',gen_random_uuid()::text,true);
insert into public.evidence(id,organization_id,task_id,control_id,file_path,original_filename,mime_type,file_size,description,uploaded_by)
values(current_setting('evidence_test.item')::uuid,current_setting('evidence_test.org')::uuid,current_setting('evidence_test.task')::uuid,current_setting('evidence_test.control')::uuid,current_setting('evidence_test.org')||'/'||current_setting('evidence_test.item')||'/file','Temporary.pdf','application/pdf',12,'Temporary evidence',current_setting('evidence_test.b')::uuid);
do $$ begin
 if not exists(select 1 from public.evidence where id=current_setting('evidence_test.item')::uuid and uploaded_by=auth.uid() and finding_id=current_setting('evidence_test.finding')::uuid) then raise exception 'Spoofed uploader or wrong finding'; end if;
 begin
  perform public.finalize_evidence(current_setting('evidence_test.item')::uuid);
  raise exception 'Confirmed missing file' using errcode='P0002';
 exception when raise_exception then null; end;
end $$;
-- Temporary Storage metadata exercises real policies. No blob is created; ROLLBACK removes it.
insert into storage.objects(bucket_id,name,metadata)
values('evidence',current_setting('evidence_test.org')||'/'||current_setting('evidence_test.item')||'/file','{"size":12,"mimetype":"application/pdf"}');
select public.finalize_evidence(current_setting('evidence_test.item')::uuid);
insert into public.comments(organization_id,evidence_id,body)
values(current_setting('evidence_test.org')::uuid,current_setting('evidence_test.item')::uuid,'Temporary comment');
do $$ begin
 update public.evidence set review_status='ACCEPTED' where id=current_setting('evidence_test.item')::uuid;
 if found then raise exception 'Client approved evidence'; end if;
 if private.evidence_file_access(current_setting('evidence_test.org')||'/'||current_setting('evidence_test.item')||'/file',true) then raise exception 'Confirmed file write authorized'; end if;
 update storage.objects set metadata='{}' where name=current_setting('evidence_test.org')||'/'||current_setting('evidence_test.item')||'/file';
 if found then raise exception 'Confirmed file overwritten'; end if;
 begin
  update public.comments set body='Fake'; raise exception 'Comment editable' using errcode='P0002';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('evidence_test.b'),true);
do $$ begin
 if exists(select 1 from public.evidence where id=current_setting('evidence_test.item')::uuid) or exists(select 1 from public.comments where organization_id=current_setting('evidence_test.org')::uuid) or exists(select 1 from storage.objects where name=current_setting('evidence_test.org')||'/'||current_setting('evidence_test.item')||'/file') then raise exception 'Cross tenant read'; end if;
 begin
  perform public.finalize_evidence(current_setting('evidence_test.item')::uuid); raise exception 'Cross tenant finalization' using errcode='P0002';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.comments(organization_id,evidence_id,body) values(current_setting('evidence_test.org')::uuid,current_setting('evidence_test.item')::uuid,'Intrusion'); raise exception 'Cross tenant comment' using errcode='P0002';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('evidence_test.a'),true);
do $$ begin
 begin
  update public.evidence set review_status='CHANGES_REQUESTED' where id=current_setting('evidence_test.item')::uuid;
  raise exception 'Missing review comment accepted' using errcode='P0002';
 exception when check_violation then null; end;
end $$;
update public.evidence set review_status='CHANGES_REQUESTED',reviewer_comment='Add responsible person' where id=current_setting('evidence_test.item')::uuid;
select set_config('request.jwt.claim.sub',current_setting('evidence_test.client'),true);
select set_config('evidence_test.corrected',gen_random_uuid()::text,true);
insert into public.evidence(id,organization_id,task_id,control_id,previous_evidence_id,file_path,original_filename,mime_type,file_size,description)
values(current_setting('evidence_test.corrected')::uuid,current_setting('evidence_test.org')::uuid,current_setting('evidence_test.task')::uuid,current_setting('evidence_test.control')::uuid,current_setting('evidence_test.item')::uuid,current_setting('evidence_test.org')||'/'||current_setting('evidence_test.corrected')||'/file','Temporary-v2.pdf','application/pdf',12,'Corrected evidence');
insert into storage.objects(bucket_id,name,metadata)
values('evidence',current_setting('evidence_test.org')||'/'||current_setting('evidence_test.corrected')||'/file','{"size":12,"mimetype":"application/pdf"}');
select public.finalize_evidence(current_setting('evidence_test.corrected')::uuid);
select public.submit_task(current_setting('evidence_test.task')::uuid,'WAITING_REVIEW');
select set_config('request.jwt.claim.sub',current_setting('evidence_test.a'),true);
do $$ begin
 begin
  update public.tasks set status='DONE' where id=current_setting('evidence_test.task')::uuid;
  raise exception 'Approved before evidence review' using errcode='P0002';
 exception when raise_exception then null; end;
end $$;
update public.evidence set review_status='ACCEPTED' where id=current_setting('evidence_test.corrected')::uuid;
update public.tasks set status='DONE' where id=current_setting('evidence_test.task')::uuid;
update public.findings set status='CLOSED',closure_note='Reviewed evidence and action' where id=current_setting('evidence_test.finding')::uuid;
do $$ begin
 if not exists(select 1 from public.evidence where id=current_setting('evidence_test.item')::uuid and review_status='CHANGES_REQUESTED') or not exists(select 1 from public.evidence where id=current_setting('evidence_test.corrected')::uuid and review_status='ACCEPTED' and reviewed_by=auth.uid()) then raise exception 'Lost historical review'; end if;
 if (select count(*) from public.audit_logs where entity_type='evidence' and organization_id=current_setting('evidence_test.org')::uuid) <> 4 then raise exception 'Wrong evidence audit count'; end if;
end $$;
set local role anon;
do $$ begin
 begin
  perform 1 from public.evidence; raise exception 'Anonymous read' using errcode='P0002';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'phase5 SQL and Storage RLS checks passed; no Auth/Storage API session test' as result;
rollback;
