-- Phase 4: findings linked to historical assessment controls, tasks and immutable activity.
create type public.finding_status as enum ('OPEN','IN_PROGRESS','UNDER_REVIEW','CLOSED','ACCEPTED_RISK');
create type public.task_status as enum ('TODO','IN_PROGRESS','WAITING_REVIEW','DONE');
alter table public.assessment_controls add constraint response_identity_unique unique(id,assessment_id,organization_id);
create table public.findings (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 assessment_id uuid not null,
 control_id uuid,
 code bigint generated always as identity unique,
 title text not null check(length(trim(title)) between 2 and 200),
 description text not null check(length(trim(description)) between 2 and 10000),
 recommendation text not null default '' check(length(recommendation)<=10000),
 area text not null default '' check(length(area)<=200),
 severity public.severity not null default 'MEDIUM',
 status public.finding_status not null default 'OPEN',
 assigned_to uuid references public.profiles(id) on delete restrict,
 due_date date,
 closure_note text not null default '' check(length(closure_note)<=10000),
 created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),closed_at timestamptz,
 unique(id,organization_id),
 foreign key(assessment_id,organization_id) references public.assessments(id,organization_id) on delete restrict,
 foreign key(control_id,assessment_id,organization_id) references public.assessment_controls(id,assessment_id,organization_id) on delete restrict,
 check(status not in ('CLOSED','ACCEPTED_RISK') or length(trim(closure_note))>0)
);
create index findings_assessment_idx on public.findings(assessment_id,organization_id);
create index findings_control_idx on public.findings(control_id,assessment_id,organization_id);
create index findings_org_status_idx on public.findings(organization_id,status);
create index findings_assignee_idx on public.findings(assigned_to);
create index findings_creator_idx on public.findings(created_by);
create table public.tasks (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 finding_id uuid not null,
 title text not null check(length(trim(title)) between 2 and 200),
 description text not null default '' check(length(description)<=10000),
 assigned_to uuid references public.profiles(id) on delete restrict,
 status public.task_status not null default 'TODO',priority public.severity not null default 'MEDIUM',due_date date,
 reviewer_comment text not null default '' check(length(reviewer_comment)<=10000),
 created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),completed_at timestamptz,
 foreign key(finding_id,organization_id) references public.findings(id,organization_id) on delete restrict
);
create index tasks_finding_idx on public.tasks(finding_id,organization_id);
create index tasks_org_status_idx on public.tasks(organization_id,status);
create index tasks_assignee_idx on public.tasks(assigned_to);
create index tasks_creator_idx on public.tasks(created_by);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete restrict,
 actor_id uuid references public.profiles(id) on delete restrict,action text not null,entity_type text not null,entity_id uuid not null,
 metadata jsonb not null default '{}',created_at timestamptz not null default now()
);
create index audit_logs_org_time_idx on public.audit_logs(organization_id,created_at);
create index audit_logs_actor_idx on public.audit_logs(actor_id);

create function private.guard_finding() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if auth.uid() is null then raise exception 'Autenticación requerida' using errcode='42501'; end if;
  new.created_by=auth.uid(); new.created_at=now(); new.updated_at=now();
 else
  if (new.id,new.organization_id,new.assessment_id,new.control_id,new.code,new.created_by,new.created_at) is distinct from (old.id,old.organization_id,old.assessment_id,old.control_id,old.code,old.created_by,old.created_at) then raise exception 'Identidad de hallazgo inmutable' using errcode='42501'; end if;
  new.updated_at=now();
 end if;
 if new.assigned_to is not null and (TG_OP='INSERT' or new.assigned_to is distinct from old.assigned_to) and not exists(select 1 from public.organization_members where organization_id=new.organization_id and user_id=new.assigned_to) then raise exception 'Responsable ajeno a la organización'; end if;
 if new.status='CLOSED' and exists(select 1 from public.tasks where finding_id=new.id and status<>'DONE') then raise exception 'Tareas pendientes de aprobación'; end if;
 if new.status in ('CLOSED','ACCEPTED_RISK') then
  new.closed_at=case when TG_OP='UPDATE' and old.status=new.status then old.closed_at else now() end;
 else new.closed_at=null; end if;
 return new;
end $$;
create trigger guard_finding before insert or update on public.findings for each row execute function private.guard_finding();

create function private.guard_task() returns trigger language plpgsql set search_path='' as $$
declare parent_status public.finding_status;
begin
 -- Serialize task writes with closure of their finding.
 select status into parent_status from public.findings where id=new.finding_id and organization_id=new.organization_id for update;
 if parent_status is null or parent_status in ('CLOSED','ACCEPTED_RISK') then raise exception 'Reabra el hallazgo antes de modificar tareas'; end if;
 if TG_OP='INSERT' then
  if auth.uid() is null then raise exception 'Autenticación requerida' using errcode='42501'; end if;
  if new.status<>'TODO' then raise exception 'Una tarea comienza por hacer'; end if;
  new.created_by=auth.uid();new.created_at=now();new.updated_at=now();new.completed_at=null;
 else
  if (new.id,new.organization_id,new.finding_id,new.created_by,new.created_at) is distinct from (old.id,old.organization_id,old.finding_id,old.created_by,old.created_at) then raise exception 'Identidad de tarea inmutable' using errcode='42501'; end if;
  if not private.can_manage(new.organization_id) then
   if auth.uid() is null or old.assigned_to is distinct from auth.uid() or not private.can_read(new.organization_id) or
    (to_jsonb(new)-'status'-'updated_at'-'completed_at') is distinct from (to_jsonb(old)-'status'-'updated_at'-'completed_at') or
    old.status not in ('TODO','IN_PROGRESS') or new.status not in ('IN_PROGRESS','WAITING_REVIEW') then raise exception 'Transición de cliente no autorizada' using errcode='42501'; end if;
  else
   if new.status='DONE' and old.status not in ('WAITING_REVIEW','DONE') then raise exception 'Envíe la tarea a revisión antes de aprobar'; end if;
   if old.status='WAITING_REVIEW' and new.status in ('TODO','IN_PROGRESS') and length(trim(new.reviewer_comment))=0 then raise exception 'Agregue observaciones para devolver la tarea'; end if;
  end if;
  new.completed_at=case when new.status='DONE' then coalesce(old.completed_at,now()) else null end;
  new.updated_at=now();
 end if;
 if new.assigned_to is not null and (TG_OP='INSERT' or new.assigned_to is distinct from old.assigned_to) and not exists(select 1 from public.organization_members where organization_id=new.organization_id and user_id=new.assigned_to) then raise exception 'Responsable ajeno a la organización'; end if;
 return new;
end $$;
create trigger guard_task before insert or update on public.tasks for each row execute function private.guard_task();

create function private.record_phase4_activity() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(new.organization_id,auth.uid(),case when TG_OP='INSERT' then 'CREATE' else 'UPDATE' end,TG_TABLE_NAME,new.id,
 jsonb_build_object('status',new.status,'assigned_to',new.assigned_to,'previous_status',case when TG_OP='UPDATE' then old.status::text else null end,
 'priority',case when TG_TABLE_NAME='findings' then to_jsonb(new)->>'severity' else to_jsonb(new)->>'priority' end,
 'previous_priority',case when TG_OP='UPDATE' then case when TG_TABLE_NAME='findings' then to_jsonb(old)->>'severity' else to_jsonb(old)->>'priority' end else null end,
 'previous_assigned_to',case when TG_OP='UPDATE' then old.assigned_to else null end,
 'reviewer_comment',to_jsonb(new)->>'reviewer_comment','closure_note',to_jsonb(new)->>'closure_note'));
 return new;
end $$;
create trigger record_finding_activity after insert or update on public.findings for each row execute function private.record_phase4_activity();
create trigger record_task_activity after insert or update on public.tasks for each row execute function private.record_phase4_activity();

alter table public.findings enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_logs enable row level security;
revoke all on public.findings,public.tasks,public.audit_logs from public,anon,authenticated;
grant select,insert,update on public.findings,public.tasks to authenticated;
grant select on public.audit_logs to authenticated;
grant usage on sequence public.findings_code_seq to authenticated;
create policy findings_read on public.findings for select to authenticated using(private.can_read(organization_id));
create policy findings_insert on public.findings for insert to authenticated with check(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE'));
create policy findings_update on public.findings for update to authenticated using(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE')) with check(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE'));
create policy tasks_read on public.tasks for select to authenticated using(private.can_manage(organization_id) or (assigned_to=(select auth.uid()) and private.can_read(organization_id)));
create policy tasks_insert on public.tasks for insert to authenticated with check(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE'));
create policy tasks_update on public.tasks for update to authenticated using(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE')) with check(private.can_manage(organization_id) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE'));
create policy audit_logs_read on public.audit_logs for select to authenticated using(private.can_manage(organization_id));

-- Only a narrow, checked function permits clients to update their assigned task status.
create function private.submit_task(task uuid,new_status public.task_status) returns void language plpgsql security definer set search_path='' as $$
declare row public.tasks;
begin
 select * into row from public.tasks where id=task for update;
 if auth.uid() is null or row.id is null or row.assigned_to is distinct from auth.uid() or not private.can_read(row.organization_id) or not exists(select 1 from public.organization_members where organization_id=row.organization_id and user_id=auth.uid() and role='CLIENT') or not exists(select 1 from public.organizations where id=row.organization_id and status='ACTIVE') then raise exception 'No autorizado' using errcode='42501'; end if;
 if row.status not in ('TODO','IN_PROGRESS') or new_status not in ('IN_PROGRESS','WAITING_REVIEW') then raise exception 'Transición inválida'; end if;
 update public.tasks set status=new_status where id=task;
end $$;
create function public.submit_task(task uuid,new_status public.task_status) returns void language sql security invoker set search_path='' as $$ select private.submit_task(task,new_status) $$;
-- Accurate progress for clients without exposing other users' tasks. Totals only.
create function private.finding_progress(finding uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare org uuid; total bigint; done bigint;
begin
 select organization_id into org from public.findings where id=finding;
 if org is null or not private.can_read(org) then raise exception 'No autorizado' using errcode='42501'; end if;
 select count(*),count(*) filter(where status='DONE') into total,done from public.tasks where finding_id=finding;
 return jsonb_build_object('total',total,'done',done);
end $$;
create function public.finding_progress(finding uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.finding_progress(finding) $$;
revoke all on function private.guard_finding(),private.guard_task(),private.record_phase4_activity() from public,anon,authenticated;
revoke all on function private.submit_task(uuid,public.task_status),private.finding_progress(uuid),public.submit_task(uuid,public.task_status),public.finding_progress(uuid) from public,anon,authenticated;
grant execute on function private.submit_task(uuid,public.task_status),private.finding_progress(uuid),public.submit_task(uuid,public.task_status),public.finding_progress(uuid) to authenticated;
