-- Preserve organization identity even after an organization is deleted.
alter table public.audit_logs alter column organization_id drop not null;
alter table public.audit_logs drop constraint audit_logs_organization_id_fkey;
alter table public.audit_logs add constraint audit_logs_organization_id_fkey foreign key(organization_id) references public.organizations(id) on delete set null;
alter table public.audit_logs add column organization_ref uuid, add column organization_name text not null default '', add column actor_name text not null default '', add column actor_role text not null default '';
update public.audit_logs a set organization_ref=a.organization_id,organization_name=o.legal_name from public.organizations o where o.id=a.organization_id;
update public.audit_logs a set actor_name=p.full_name,actor_role=p.role::text from public.profiles p where p.id=a.actor_id;
create index audit_logs_time_id_idx on public.audit_logs(created_at desc,id);
create index audit_logs_ref_time_idx on public.audit_logs(organization_ref,created_at desc);
create index audit_logs_entity_idx on public.audit_logs(entity_type,entity_id);
alter policy audit_logs_read on public.audit_logs using((select private.is_admin()) or private.can_manage(organization_id) or (entity_type='evidence' and private.evidence_access(entity_id)));
create function private.audit_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.organization_ref=coalesce(new.organization_ref,new.organization_id);
 if new.organization_name='' then select coalesce(legal_name,'') into new.organization_name from public.organizations where id=new.organization_id; end if;
 new.organization_name=coalesce(new.organization_name,'');
 select full_name,role::text into new.actor_name,new.actor_role from public.profiles where id=new.actor_id;
 new.actor_name=coalesce(new.actor_name,'Sistema');new.actor_role=coalesce(new.actor_role,'SYSTEM');
 return new;
end $$;
create trigger audit_snapshot before insert on public.audit_logs for each row execute function private.audit_snapshot();
-- Changed field names and selected safe values; never invitation tokens, passwords or document bodies.
create function private.audit_business_change() returns trigger language plpgsql security definer set search_path='' as $$
declare n jsonb; o jsonb; rowdata jsonb; org uuid; entity uuid; fields jsonb; before_values jsonb; after_values jsonb;
begin
 n=case when TG_OP='DELETE' then '{}'::jsonb else to_jsonb(new) end;
 o=case when TG_OP='INSERT' then '{}'::jsonb else to_jsonb(old) end;
 rowdata=case when TG_OP='DELETE' then o else n end;
 select coalesce(jsonb_agg(k),'[]') into fields from jsonb_object_keys(n||o) k where n->k is distinct from o->k and k not in ('updated_at','token_hash');
 if TG_OP='UPDATE' and fields='[]'::jsonb then return new; end if;
 org=case when TG_TABLE_NAME='organizations' then (rowdata->>'id')::uuid else (rowdata->>'organization_id')::uuid end;
 entity=coalesce((rowdata->>'id')::uuid,(rowdata->>'user_id')::uuid);
 select coalesce(jsonb_object_agg(k,v),'{}') into before_values from jsonb_each(o) x(k,v) where k in ('status','role','assigned_to','severity','priority','due_date','legal_name','full_name','name','code','accepted_at','revoked_at','control_id','user_id','recipient_id','event_type','read_at');
 select coalesce(jsonb_object_agg(k,v),'{}') into after_values from jsonb_each(n) x(k,v) where k in ('status','role','assigned_to','severity','priority','due_date','legal_name','full_name','name','code','accepted_at','revoked_at','control_id','user_id','recipient_id','event_type','read_at');
 insert into public.audit_logs(organization_id,organization_ref,organization_name,actor_id,action,entity_type,entity_id,metadata)
 values(case when exists(select 1 from public.organizations where id=org) then org else null end,org,case when TG_TABLE_NAME='organizations' then rowdata->>'legal_name' else '' end,auth.uid(),case TG_OP when 'INSERT' then 'CREATE' when 'DELETE' then 'DELETE' else 'UPDATE' end,case when TG_TABLE_NAME='evidence' then 'evidence_reservations' else TG_TABLE_NAME end,entity,jsonb_build_object('changed_fields',fields,'before',before_values,'after',after_values));
 return coalesce(new,old);
end $$;
do $$ declare t text; begin
 foreach t in array array['organizations','organization_members','organization_invitations','profiles','controls','assessments','assessment_controls','processing_activities'] loop
 execute format('create trigger audit_business_change after insert or update or delete on public.%I for each row execute function private.audit_business_change()',t);
 end loop;
end $$;
-- The source is Supabase Auth's own audit stream, not a client supplied login assertion.
create function private.audit_auth_event() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid; event text=new.payload->>'action'; candidate text=coalesce(new.payload->>'actor_id',new.payload->>'user_id');
begin
 if event is null or event='token_refreshed' then return new; end if;
 if candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then select id into actor from public.profiles where id=candidate::uuid; end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(actor,'AUTH_'||upper(event),'authentication',new.id,jsonb_build_object('source','supabase_auth','auth_event',event,'subject_ref',candidate));
 return new;
end $$;
create trigger privacyaudit_auth_event after insert on auth.audit_log_entries for each row execute function private.audit_auth_event();

-- Narrow administration operations: no direct INSERT/UPDATE/DELETE grants on the log.
create function private.purge_audit_logs(before_time timestamptz,reason text,confirmation text) returns bigint language plpgsql security definer set search_path='' as $$
declare removed bigint;
begin
 if not private.is_admin() then raise exception 'Solo el administrador puede borrar el log' using errcode='42501'; end if;
 if confirmation is distinct from 'BORRAR LOG' or reason is null or length(trim(reason)) not between 10 and 1000 or before_time is null or before_time>now() then raise exception 'Indique fecha pasada, motivo y confirmación BORRAR LOG'; end if;
 -- Each purge leaves an auditable receipt; subsequent purges also retain these receipts.
 delete from public.audit_logs where created_at<before_time and action<>'AUDIT_PURGE';
 get diagnostics removed=row_count;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'AUDIT_PURGE','audit_logs',gen_random_uuid(),jsonb_build_object('before',before_time,'reason',trim(reason),'deleted_count',removed));
 return removed;
end $$;
create function public.purge_audit_logs(before_time timestamptz,reason text,confirmation text) returns bigint language sql security invoker set search_path='' as $$ select private.purge_audit_logs(before_time,reason,confirmation) $$;
create function private.record_audit_export(filters jsonb,record_count bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 if record_count is null or filters is null or record_count<0 or octet_length(filters::text)>4000 then raise exception 'Exportación inválida'; end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'AUDIT_EXPORT','audit_logs',gen_random_uuid(),jsonb_build_object('filters',filters,'record_count',record_count));
end $$;
create function public.record_audit_export(filters jsonb,record_count bigint) returns void language sql security invoker set search_path='' as $$ select private.record_audit_export(filters,record_count) $$;

create table public.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 task_id uuid references public.tasks(id) on delete cascade,finding_id uuid references public.findings(id) on delete cascade,evidence_id uuid references public.evidence(id) on delete cascade,
 event_type text not null check(event_type in ('TASK_ASSIGNED','TASK_REVIEW','TASK_RETURNED','TASK_APPROVED','TASK_OVERDUE','EVIDENCE_UPLOADED','EVIDENCE_ACCEPTED','EVIDENCE_REJECTED','EVIDENCE_CHANGES_REQUESTED','FINDING_REVIEW')),
 title text not null,message text not null, event_key text not null, read_at timestamptz,created_at timestamptz not null default now(),unique(recipient_id,event_key)
);
create index notifications_recipient_time_idx on public.notifications(recipient_id,created_at desc,id);
create index notifications_unread_idx on public.notifications(recipient_id) where read_at is null;
create index notifications_org_idx on public.notifications(organization_id);
create index notifications_task_idx on public.notifications(task_id);
create index notifications_finding_idx on public.notifications(finding_id);
create index notifications_evidence_idx on public.notifications(evidence_id);
create index tasks_overdue_idx on public.tasks(due_date,organization_id) where status<>'DONE';
alter table public.notifications enable row level security;
revoke all on public.notifications from public,anon,authenticated;
grant select on public.notifications to authenticated;
create function private.notification_access(org uuid,task uuid,evidence uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.can_read(org) and (task is null or exists(select 1 from public.tasks t where t.id=task and (private.can_manage(org) or t.assigned_to=auth.uid()))) and (evidence is null or private.evidence_access(evidence))
$$;
create policy notifications_read on public.notifications for select to authenticated using(recipient_id=(select auth.uid()) and private.notification_access(organization_id,task_id,evidence_id));
create function private.read_notifications(notification uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'No autorizado' using errcode='42501'; end if;
 update public.notifications set read_at=now() where recipient_id=auth.uid() and read_at is null and (notification is null or id=notification) and private.notification_access(organization_id,task_id,evidence_id);
end $$;
create function public.read_notifications(notification uuid default null) returns void language sql security invoker set search_path='' as $$ select private.read_notifications(notification) $$;
create function private.emit_notification(org uuid,event text,title text,message text,event_key text,task uuid default null,finding uuid default null,evidence uuid default null,target uuid default null,managers boolean default false,exclude_actor boolean default true) returns bigint language plpgsql security definer set search_path='' as $$
declare inserted bigint;
begin
 insert into public.notifications(recipient_id,organization_id,event_type,title,message,event_key,task_id,finding_id,evidence_id)
 select distinct m.user_id,org,event,title,message,event_key,task,finding,evidence from public.organization_members m join public.profiles p on p.id=m.user_id
 where m.organization_id=org and (m.user_id=target or (managers and m.role='CONSULTANT' and p.role in ('CONSULTANT','SUPER_ADMIN'))) and (not exclude_actor or m.user_id is distinct from auth.uid())
 on conflict on constraint notifications_recipient_id_event_key_key do nothing;
 get diagnostics inserted=row_count;return inserted;
end $$;
create function private.notify_business_change() returns trigger language plpgsql security definer set search_path='' as $$
declare event text; title text; target uuid; managers boolean=false; key text=gen_random_uuid()::text; task uuid; finding uuid; evidence uuid;
begin
 if TG_TABLE_NAME='tasks' then
 task=new.id;finding=new.finding_id;target=new.assigned_to;
 if new.assigned_to is not null and (TG_OP='INSERT' or new.assigned_to is distinct from old.assigned_to) then
 perform private.emit_notification(new.organization_id,'TASK_ASSIGNED','Nueva tarea asignada','Tiene una tarea para realizar.',key||'/assigned',task,finding,null,target);
 end if;
 if TG_OP='UPDATE' and new.status is distinct from old.status then
 if new.status='WAITING_REVIEW' then event='TASK_REVIEW';title='Tarea enviada a revisión';managers=true;target=null;
 elsif new.status='DONE' then event='TASK_APPROVED';title='Tarea aprobada';
 elsif old.status='WAITING_REVIEW' then event='TASK_RETURNED';title='Tarea devuelta con observaciones';end if;
 end if;
 elsif TG_TABLE_NAME='evidence' then
 if TG_OP='INSERT' or new.uploaded_at is null then return new; end if;
 task=new.task_id;finding=new.finding_id;evidence=new.id;
 if old.uploaded_at is null then event='EVIDENCE_UPLOADED';title='Nueva evidencia para revisar';managers=true;
 elsif new.review_status is distinct from old.review_status then
 target=new.uploaded_by;event='EVIDENCE_'||new.review_status::text;
 title=case new.review_status when 'ACCEPTED' then 'Evidencia aceptada' when 'REJECTED' then 'Evidencia rechazada' else 'Se solicitaron cambios en la evidencia' end;
 end if;
 elsif TG_TABLE_NAME='findings' and TG_OP='UPDATE' and new.status='UNDER_REVIEW' and new.status is distinct from old.status then
 event='FINDING_REVIEW';title='Hallazgo enviado a revisión';finding=new.id;managers=true;
 end if;
 if event is not null then perform private.emit_notification(new.organization_id,event,title,'Abra el registro para consultar el detalle.',key,task,finding,evidence,target,managers);end if;
 return new;
end $$;
create trigger notify_task after insert or update on public.tasks for each row execute function private.notify_business_change();
create trigger notify_evidence after insert or update on public.evidence for each row execute function private.notify_business_change();
create trigger notify_finding after update on public.findings for each row execute function private.notify_business_change();
create function private.run_due_notifications() returns bigint language plpgsql security definer set search_path='' as $$
declare t record; inserted bigint=0;
begin
 -- A database job runs even when no one has the application open. The event key deduplicates each deadline.
 perform pg_advisory_xact_lock(610706);
 for t in select due.* from public.tasks due join public.organizations o on o.id=due.organization_id join public.findings f on f.id=due.finding_id where o.status='ACTIVE' and due.status<>'DONE' and f.status not in ('CLOSED','ACCEPTED_RISK') and due.due_date<(now() at time zone 'America/Santiago')::date loop
 inserted=inserted+private.emit_notification(t.organization_id,'TASK_OVERDUE','Tarea vencida','Una tarea superó su fecha límite.', 'overdue/'||t.id||'/'||t.due_date||'/'||coalesce(t.assigned_to::text,'unassigned'),t.id,t.finding_id,null,t.assigned_to,true,false);
 end loop;
 return inserted;
end $$;
revoke all on function private.audit_snapshot(),private.audit_business_change(),private.audit_auth_event(),private.notify_business_change(),private.run_due_notifications(),private.emit_notification(uuid,text,text,text,text,uuid,uuid,uuid,uuid,boolean,boolean) from public,anon,authenticated;
revoke all on function private.notification_access(uuid,uuid,uuid),private.read_notifications(uuid),public.read_notifications(uuid),private.purge_audit_logs(timestamptz,text,text),public.purge_audit_logs(timestamptz,text,text),private.record_audit_export(jsonb,bigint),public.record_audit_export(jsonb,bigint) from public,anon,authenticated;
grant execute on function private.notification_access(uuid,uuid,uuid),private.read_notifications(uuid),public.read_notifications(uuid),private.purge_audit_logs(timestamptz,text,text),public.purge_audit_logs(timestamptz,text,text),private.record_audit_export(jsonb,bigint),public.record_audit_export(jsonb,bigint) to authenticated;
-- Invoker aggregation obeys the same RLS as every module; client task totals cover own tasks only.
create function public.dashboard_summary(search text default '',org_status text default '',attention text default '',page integer default 1) returns jsonb language sql stable security invoker set search_path='' as $$
 with organizations as (
 select o.* from public.organizations o where o.legal_name ilike '%'||left(search,100)||'%' and (org_status='' or o.status::text=org_status)
 ), latest as (
 select distinct on (a.organization_id) a.* from public.assessments a join organizations o on o.id=a.organization_id order by a.organization_id,a.created_at desc,a.id
 ), summaries as (
 select o.id,o.legal_name,o.rut,o.status,l.id assessment_id,l.name assessment_name,l.status assessment_status,
 (select count(*) from public.assessment_controls c where c.assessment_id=l.id) total_controls,
 (select count(*) from public.assessment_controls c where c.assessment_id=l.id and c.status<>'PENDING') evaluated_controls,
 (select count(*) from public.findings f where f.organization_id=o.id and f.status not in ('CLOSED','ACCEPTED_RISK')) open_findings,
 (select count(*) from public.findings f where f.organization_id=o.id and f.status not in ('CLOSED','ACCEPTED_RISK') and f.severity in ('HIGH','CRITICAL')) high_findings,
 (select count(*) from public.tasks t join public.findings f on f.id=t.finding_id where t.organization_id=o.id and t.status<>'DONE' and f.status not in ('CLOSED','ACCEPTED_RISK') and t.due_date<(now() at time zone 'America/Santiago')::date) overdue_tasks,
 (select count(*) from public.evidence e where e.organization_id=o.id and e.uploaded_at is not null and e.review_status='PENDING_REVIEW' and not exists(select 1 from public.evidence next where next.previous_evidence_id=e.id and next.uploaded_at is not null)) pending_evidence,
 greatest(o.updated_at,l.updated_at,(select max(a.created_at) from public.audit_logs a where a.organization_id=o.id)) last_activity
 from organizations o left join latest l on l.organization_id=o.id
 ), selected as (select * from summaries where attention='' or (attention='high' and high_findings>0) or (attention='overdue' and overdue_tasks>0) or (attention='evidence' and pending_evidence>0)),
 controls as (select c.* from public.assessment_controls c join selected s on s.assessment_id=c.assessment_id),
 findings as (select f.* from public.findings f join selected s on s.id=f.organization_id)
 select jsonb_build_object(
 'total',(select count(*) from selected),
 'rows',coalesce((select jsonb_agg(to_jsonb(s)) from (select * from selected order by legal_name,id limit 20 offset (greatest(1,least(page,10000))-1)*20) s),'[]'),
 'metrics',jsonb_build_object(
 'active_organizations',(select count(*) from selected where status='ACTIVE'),
 'assessments_in_progress',(select count(*) from public.assessments a join selected s on s.id=a.organization_id where a.status in ('IN_PROGRESS','REVIEW')),
 'open_findings',(select count(*) from findings where status not in ('CLOSED','ACCEPTED_RISK')),
 'closed_findings',(select count(*) from findings where status='CLOSED'),
 'accepted_risk',(select count(*) from findings where status='ACCEPTED_RISK'),
 'high_findings',coalesce((select sum(high_findings) from selected),0),
 'overdue_tasks',coalesce((select sum(overdue_tasks) from selected),0),
 'pending_evidence',coalesce((select sum(pending_evidence) from selected),0),
 'accepted_evidence',(select count(*) from public.evidence e join selected s on s.id=e.organization_id where e.review_status='ACCEPTED' and e.uploaded_at is not null and not exists(select 1 from public.evidence next where next.previous_evidence_id=e.id and next.uploaded_at is not null)),
 'evaluated',(select count(*) from controls where status<>'PENDING'),'controls_total',(select count(*) from controls)),
 'control_counts',coalesce((select jsonb_object_agg(status,n) from (select status,count(*) n from controls group by status) x),'{}'),
 'severity_counts',coalesce((select jsonb_object_agg(severity,n) from (select severity,count(*) n from findings where status not in ('CLOSED','ACCEPTED_RISK') group by severity) x),'{}'))
$$;
revoke all on function public.dashboard_summary(text,text,text,integer) from public,anon,authenticated;
grant execute on function public.dashboard_summary(text,text,text,integer) to authenticated;

create trigger audit_evidence_reservation after insert or delete on public.evidence for each row execute function private.audit_business_change();
create function private.record_evidence_download(evidence uuid) returns void language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if auth.uid() is null or not private.evidence_access(evidence) then raise exception 'No autorizado' using errcode='42501';end if;
 select e.organization_id into org from public.evidence e where e.id=record_evidence_download.evidence and e.uploaded_at is not null;
 if org is null then raise exception 'Archivo no disponible';end if;
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id) values(org,auth.uid(),'DOWNLOAD','evidence',evidence);
end $$;
create function public.record_evidence_download(evidence uuid) returns void language sql security invoker set search_path='' as $$ select private.record_evidence_download(evidence) $$;
revoke all on function private.record_evidence_download(uuid),public.record_evidence_download(uuid) from public,anon,authenticated;
grant execute on function private.record_evidence_download(uuid),public.record_evidence_download(uuid) to authenticated;
-- Preserve existing timeline metadata and record which business fields changed.
create or replace function private.record_phase4_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare n jsonb=to_jsonb(new);o jsonb=case when TG_OP='INSERT' then '{}'::jsonb else to_jsonb(old) end;fields jsonb;
begin
 select coalesce(jsonb_agg(k),'[]') into fields from jsonb_object_keys(n||o) k where n->k is distinct from o->k and k<>'updated_at';
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(new.organization_id,auth.uid(),case when TG_OP='INSERT' then 'CREATE' else 'UPDATE' end,TG_TABLE_NAME,new.id,
 jsonb_build_object('status',new.status,'assigned_to',new.assigned_to,'previous_status',o->>'status','priority',coalesce(n->>'severity',n->>'priority'),'previous_priority',coalesce(o->>'severity',o->>'priority'),'previous_assigned_to',o->>'assigned_to','reviewer_comment',n->>'reviewer_comment','closure_note',n->>'closure_note','changed_fields',fields,'due_date',n->>'due_date','previous_due_date',o->>'due_date'));
 return new;
end $$;
-- Successful sign-ins and password changes are captured even when optional Auth DB audit storage is disabled.
create function private.audit_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
declare event text;
begin
 if TG_OP='INSERT' then event='AUTH_ACCOUNT_CREATED';
 elsif new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null then event='AUTH_SIGN_IN';
 elsif new.encrypted_password is distinct from old.encrypted_password then event='AUTH_PASSWORD_CHANGED';
 end if;
 if event is not null then insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(new.id,event,'authentication',new.id,jsonb_build_object('source','auth.users'));end if;
 return new;
end $$;
create trigger privacyaudit_auth_user after insert or update on auth.users for each row execute function private.audit_auth_user();
create function private.audit_auth_session_end() returns trigger language plpgsql security definer set search_path='' as $$
declare actor uuid;
begin
 select id into actor from public.profiles where id=old.user_id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(actor,'AUTH_SESSION_ENDED','authentication',old.id,jsonb_build_object('source','auth.sessions','subject_ref',old.user_id));
 return old;
end $$;
create trigger privacyaudit_session_end after delete on auth.sessions for each row execute function private.audit_auth_session_end();
revoke all on function private.audit_auth_user(),private.audit_auth_session_end() from public,anon,authenticated;

create trigger audit_notification after insert or update or delete on public.notifications for each row execute function private.audit_business_change();
