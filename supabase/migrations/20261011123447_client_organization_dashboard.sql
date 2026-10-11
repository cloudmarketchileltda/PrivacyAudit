-- Organization-wide aggregates for CLIENT; never exposes other assignees' task details.
create function private.client_organization_dashboard() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare org uuid; result jsonb;
begin
 if auth.uid() is null or not exists(select 1 from public.profiles where id=auth.uid() and role='CLIENT') then
  raise exception 'No autorizado' using errcode='42501';
 end if;
 select m.organization_id into org from public.organization_members m
 where m.user_id=auth.uid() and m.role='CLIENT';
 if org is null then return null; end if;
 if exists(select 1 from private.organization_deletions where organization_id=org) then return null; end if;
 with assessments as (
  select a.* from public.assessments a where a.organization_id=org
  and not exists(select 1 from private.assessment_deletions d where d.assessment_id=a.id)
 ), latest as (select * from assessments order by created_at desc,id limit 1),
 controls as (select c.* from public.assessment_controls c join latest a on a.id=c.assessment_id),
 findings as (select f.* from public.findings f join assessments a on a.id=f.assessment_id where f.organization_id=org),
 tasks as (select t.*, f.status finding_status from public.tasks t join findings f on f.id=t.finding_id where t.organization_id=org),
 current_evidence as (
 select e.* from public.evidence e where e.organization_id=org and e.uploaded_at is not null
 and not exists(select 1 from public.evidence n where n.previous_evidence_id=e.id and n.uploaded_at is not null)
 and (e.control_id is null or exists(select 1 from public.assessment_controls c join assessments a on a.id=c.assessment_id where c.id=e.control_id))
 and (e.finding_id is null or exists(select 1 from findings f where f.id=e.finding_id))
 and (e.task_id is null or exists(select 1 from tasks t where t.id=e.task_id))
 )
 select jsonb_build_object(
 'organization',(select jsonb_build_object('id',id,'name',legal_name,'status',status) from public.organizations where id=org),
 'assessment',(select jsonb_build_object('id',id,'name',name,'status',status) from latest),
 'latest_report',(select jsonb_build_object('id',r.id,'title',r.title,'created_at',r.created_at) from public.reports r join assessments a on a.id=r.assessment_id where r.organization_id=org order by r.created_at desc,r.id limit 1),
 'controls',jsonb_build_object('total',(select count(*) from controls),'evaluated',(select count(*) from controls where status<>'PENDING'),
 'counts',coalesce((select jsonb_object_agg(status,n) from (select status,count(*) n from controls group by status) c),'{}')),
 'tasks',jsonb_build_object('total',(select count(*) from tasks),'done',(select count(*) from tasks where status='DONE'),
 'todo',(select count(*) from tasks where status='TODO'),'in_progress',(select count(*) from tasks where status='IN_PROGRESS'),
 'waiting_review',(select count(*) from tasks where status='WAITING_REVIEW'),
 'overdue',(select count(*) from tasks where status<>'DONE' and finding_status not in ('CLOSED','ACCEPTED_RISK') and due_date<(now() at time zone 'America/Santiago')::date),
 'due_soon',(select count(*) from tasks where status<>'DONE' and finding_status not in ('CLOSED','ACCEPTED_RISK') and due_date between (now() at time zone 'America/Santiago')::date and (now() at time zone 'America/Santiago')::date+7),
 'mine_total',(select count(*) from tasks where assigned_to=auth.uid()),'mine_done',(select count(*) from tasks where assigned_to=auth.uid() and status='DONE'),
 'mine_waiting_review',(select count(*) from tasks where assigned_to=auth.uid() and status='WAITING_REVIEW'),
 'mine_overdue',(select count(*) from tasks where assigned_to=auth.uid() and status<>'DONE' and finding_status not in ('CLOSED','ACCEPTED_RISK') and due_date<(now() at time zone 'America/Santiago')::date)),
 'findings',jsonb_build_object('open',(select count(*) from findings where status not in ('CLOSED','ACCEPTED_RISK')),
 'critical',(select count(*) from findings where severity='CRITICAL' and status not in ('CLOSED','ACCEPTED_RISK')),
 'high',(select count(*) from findings where severity='HIGH' and status not in ('CLOSED','ACCEPTED_RISK')),
 'closed',(select count(*) from findings where status='CLOSED'),'accepted_risk',(select count(*) from findings where status='ACCEPTED_RISK')),
 'evidence',jsonb_build_object('pending',(select count(*) from current_evidence where review_status='PENDING_REVIEW'),'accepted',(select count(*) from current_evidence where review_status='ACCEPTED'))
 ) into result;
 return result;
end $$;
create function public.client_organization_dashboard() returns jsonb
language sql stable security invoker set search_path='' as $$ select private.client_organization_dashboard() $$;
revoke all on function private.client_organization_dashboard(),public.client_organization_dashboard() from public,anon,authenticated;
grant execute on function private.client_organization_dashboard(),public.client_organization_dashboard() to authenticated;
