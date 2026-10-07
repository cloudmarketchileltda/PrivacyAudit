-- Phase 5: immutable deliveries, private files, review and chronological comments.
create type public.evidence_review_status as enum ('PENDING_REVIEW','ACCEPTED','REJECTED','CHANGES_REQUESTED');
alter table public.tasks add constraint task_org_identity unique(id,organization_id);
alter table public.assessment_controls add constraint control_org_identity unique(id,organization_id);
create table public.evidence (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 control_id uuid, finding_id uuid, task_id uuid,
 previous_evidence_id uuid unique,
 uploaded_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 file_path text not null unique,
 original_filename text not null check(length(trim(original_filename)) between 1 and 200 and original_filename !~ '[[:cntrl:]/\\]'),
 mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain')),
 file_size bigint not null check(file_size between 1 and 10485760),
 description text not null check(length(trim(description)) between 2 and 10000),
 review_status public.evidence_review_status not null default 'PENDING_REVIEW',
 reviewer_comment text not null default '' check(length(reviewer_comment)<=10000),
 reviewed_by uuid references public.profiles(id) on delete restrict, reviewed_at timestamptz,
 uploaded_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,organization_id),
 foreign key(control_id,organization_id) references public.assessment_controls(id,organization_id) on delete restrict,
 foreign key(finding_id,organization_id) references public.findings(id,organization_id) on delete restrict,
 foreign key(task_id,organization_id) references public.tasks(id,organization_id) on delete restrict,
 foreign key(previous_evidence_id,organization_id) references public.evidence(id,organization_id) on delete restrict,
 check(previous_evidence_id is distinct from id),
 check(file_path=organization_id::text||'/'||id::text||'/file'),
 check((review_status='PENDING_REVIEW' and reviewed_at is null and reviewed_by is null and reviewer_comment='') or (review_status<>'PENDING_REVIEW' and uploaded_at is not null and reviewed_at is not null and reviewed_by is not null)),
 check(review_status not in ('REJECTED','CHANGES_REQUESTED') or length(trim(reviewer_comment))>0)
);
create index evidence_org_status_idx on public.evidence(organization_id,review_status,created_at desc);
create index evidence_control_idx on public.evidence(control_id,organization_id);
create index evidence_finding_idx on public.evidence(finding_id,organization_id);
create index evidence_task_idx on public.evidence(task_id,organization_id);
create index evidence_uploader_idx on public.evidence(uploaded_by);
create index evidence_reviewer_idx on public.evidence(reviewed_by);

-- Authorization is independent of client-controlled file paths and applies to hidden tasks too.
create function private.attachment_access(org uuid,task uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and private.can_read(org) and (task is null or private.can_manage(org) or exists(select 1 from public.tasks t where t.id=task and t.organization_id=org and t.assigned_to=auth.uid()))
$$;
create function private.attachment_writable(org uuid,finding uuid,task uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.attachment_access(org,task) and exists(select 1 from public.organizations where id=org and status='ACTIVE')
 and (finding is null or exists(select 1 from public.findings where id=finding and organization_id=org and status not in ('CLOSED','ACCEPTED_RISK')))
 and (task is null or exists(select 1 from public.tasks t join public.findings f on f.id=t.finding_id where t.id=task and t.organization_id=org and t.status<>'DONE' and f.status not in ('CLOSED','ACCEPTED_RISK')))
$$;
create function private.evidence_access(item uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.evidence e where e.id=item and private.attachment_access(e.organization_id,e.task_id) and (e.uploaded_at is not null or e.uploaded_by=auth.uid() or private.can_manage(e.organization_id)))
$$;
create function private.guard_evidence() returns trigger language plpgsql security definer set search_path='' as $$
declare parent public.evidence; t public.tasks; f public.findings;
begin
 if not private.attachment_writable(new.organization_id,new.finding_id,new.task_id) then raise exception 'Evidencia sin permisos o relación cerrada' using errcode='42501'; end if;
 -- Serialize writes with task completion and finding closure.
 if new.task_id is not null then
  select * into t from public.tasks where id=new.task_id and organization_id=new.organization_id for update;
  if t.id is null or t.status='DONE' or (new.finding_id is not null and t.finding_id<>new.finding_id) then raise exception 'Tarea incompatible'; end if;
  if TG_OP='INSERT' then new.finding_id=t.finding_id; end if;
 end if;
 if new.finding_id is not null then
  select * into f from public.findings where id=new.finding_id and organization_id=new.organization_id for update;
  if f.id is null or f.status in ('CLOSED','ACCEPTED_RISK') then raise exception 'Hallazgo cerrado'; end if;
  if new.control_id is not null and not exists(select 1 from public.assessment_controls where id=new.control_id and assessment_id=f.assessment_id and organization_id=new.organization_id) then raise exception 'Control de otra evaluación'; end if;
 end if;
 if TG_OP='INSERT' then
  if new.uploaded_at is not null or new.review_status<>'PENDING_REVIEW' or new.reviewed_by is not null or new.reviewed_at is not null or new.reviewer_comment<>'' then raise exception 'Entrega comienza pendiente y sin archivo'; end if;
  new.uploaded_by=auth.uid();new.created_at=now();new.updated_at=now();
  if new.previous_evidence_id is not null then
   select * into parent from public.evidence where id=new.previous_evidence_id for update;
   if parent.id is null or not private.evidence_access(parent.id) or parent.uploaded_at is null or parent.review_status not in ('CHANGES_REQUESTED','REJECTED') or
    (parent.organization_id,parent.control_id,parent.finding_id,parent.task_id) is distinct from (new.organization_id,new.control_id,new.finding_id,new.task_id) then raise exception 'Entrega anterior incompatible'; end if;
  end if;
 else
  if (to_jsonb(new)-'uploaded_at'-'review_status'-'reviewer_comment'-'reviewed_by'-'reviewed_at'-'updated_at') is distinct from (to_jsonb(old)-'uploaded_at'-'review_status'-'reviewer_comment'-'reviewed_by'-'reviewed_at'-'updated_at') then raise exception 'Entrega inmutable' using errcode='42501'; end if;
  if old.uploaded_at is null then
   if old.uploaded_by<>auth.uid() or new.uploaded_at is null or new.review_status<>'PENDING_REVIEW' or (new.reviewer_comment,new.reviewed_by,new.reviewed_at) is distinct from (old.reviewer_comment,old.reviewed_by,old.reviewed_at) then raise exception 'Finalización no autorizada'; end if;
   if not exists(select 1 from storage.objects where bucket_id='evidence' and name=old.file_path and (metadata->>'size')::bigint=old.file_size and metadata->>'mimetype'=old.mime_type) then raise exception 'Archivo ausente o incompatible'; end if;
   new.uploaded_at=now();
  else
   if new.uploaded_at is distinct from old.uploaded_at or not private.can_manage(new.organization_id) or old.review_status<>'PENDING_REVIEW' or new.review_status='PENDING_REVIEW' then raise exception 'Revisión no autorizada' using errcode='42501'; end if;
   new.reviewed_by=auth.uid();new.reviewed_at=now();
  end if;
  new.updated_at=now();
 end if;
 return new;
end $$;
create trigger guard_evidence before insert or update on public.evidence for each row execute function private.guard_evidence();
alter table public.evidence enable row level security;
revoke all on public.evidence from public,anon,authenticated;
grant select,insert on public.evidence to authenticated;
grant update(review_status,reviewer_comment) on public.evidence to authenticated;
grant delete on public.evidence to authenticated;
create policy evidence_read on public.evidence for select to authenticated using(private.attachment_access(organization_id,task_id) and (uploaded_at is not null or uploaded_by=(select auth.uid()) or private.can_manage(organization_id)));
create policy evidence_insert on public.evidence for insert to authenticated with check(private.attachment_writable(organization_id,finding_id,task_id) and uploaded_by=(select auth.uid()));
create policy evidence_review on public.evidence for update to authenticated using(private.can_manage(organization_id) and uploaded_at is not null) with check(private.can_manage(organization_id));
create policy evidence_cancel on public.evidence for delete to authenticated using(uploaded_at is null and uploaded_by=(select auth.uid()) and private.attachment_access(organization_id,task_id) and not exists(select 1 from storage.objects where bucket_id='evidence' and name=file_path));
create function private.finalize_evidence(item uuid) returns void language plpgsql security definer set search_path='' as $$
declare e public.evidence;
begin
 select * into e from public.evidence where id=item for update;
 if auth.uid() is null or e.id is null or e.uploaded_by<>auth.uid() or not private.attachment_writable(e.organization_id,e.finding_id,e.task_id) then raise exception 'No autorizado' using errcode='42501'; end if;
 if e.uploaded_at is not null then return; end if;
 update public.evidence set uploaded_at=now() where id=item;
end $$;
create function public.finalize_evidence(item uuid) returns void language sql security invoker set search_path='' as $$ select private.finalize_evidence(item) $$;

create table public.comments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 finding_id uuid,task_id uuid,evidence_id uuid,
 body text not null check(length(trim(body)) between 1 and 10000),
 created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(num_nonnulls(finding_id,task_id,evidence_id)=1),
 foreign key(finding_id,organization_id) references public.findings(id,organization_id) on delete restrict,
 foreign key(task_id,organization_id) references public.tasks(id,organization_id) on delete restrict,
 foreign key(evidence_id,organization_id) references public.evidence(id,organization_id) on delete restrict
);
create index comments_finding_idx on public.comments(finding_id,organization_id,created_at);
create index comments_task_idx on public.comments(task_id,organization_id,created_at);
create index comments_evidence_idx on public.comments(evidence_id,organization_id,created_at);
create index comments_creator_idx on public.comments(created_by);
create function private.comment_access(org uuid,task uuid,evidence uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.attachment_access(org,task) and (evidence is null or private.evidence_access(evidence))
$$;
create function private.guard_comment() returns trigger language plpgsql set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Autenticación requerida'; end if;
 new.created_by=auth.uid();new.created_at=now();new.updated_at=now();return new;
end $$;
create trigger guard_comment before insert on public.comments for each row execute function private.guard_comment();
alter table public.comments enable row level security;
revoke all on public.comments from public,anon,authenticated;
grant select,insert on public.comments to authenticated;
create policy comments_read on public.comments for select to authenticated using(private.comment_access(organization_id,task_id,evidence_id));
create policy comments_insert on public.comments for insert to authenticated with check(private.comment_access(organization_id,task_id,evidence_id) and created_by=(select auth.uid()) and exists(select 1 from public.organizations where id=organization_id and status='ACTIVE'));

create function private.record_phase5_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare n jsonb=to_jsonb(new); o jsonb;
begin
 if TG_TABLE_NAME='evidence' then
  if TG_OP='INSERT' or n->>'uploaded_at' is null then return new; end if;
  o=to_jsonb(old);
 end if;
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(new.organization_id,auth.uid(),case when TG_TABLE_NAME='comments' then 'COMMENT' when o->>'uploaded_at' is null then 'UPLOAD' else 'REVIEW' end,TG_TABLE_NAME,new.id,
 case when TG_TABLE_NAME='comments' then jsonb_build_object('finding_id',n->>'finding_id','task_id',n->>'task_id','evidence_id',n->>'evidence_id') else jsonb_build_object('status',n->>'review_status','reviewer_comment',n->>'reviewer_comment','previous_evidence_id',n->>'previous_evidence_id') end);
 return new;
end $$;
create trigger record_evidence_activity after insert or update on public.evidence for each row execute function private.record_phase5_activity();
create trigger record_comment_activity after insert on public.comments for each row execute function private.record_phase5_activity();
alter policy audit_logs_read on public.audit_logs using(private.can_manage(organization_id) or (entity_type='evidence' and private.evidence_access(entity_id)));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,10485760,array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain']);
create function private.evidence_file_access(path text,writing boolean) returns boolean language plpgsql security definer set search_path='' as $$
declare e public.evidence;
begin
 if auth.uid() is null then return false; end if;
 if writing then
  -- Lock the reservation so deletion/upload cannot race with finalization.
  select * into e from public.evidence where file_path=path for update;
  return e.id is not null and e.uploaded_at is null and e.uploaded_by=auth.uid() and private.attachment_writable(e.organization_id,e.finding_id,e.task_id);
 end if;
 select * into e from public.evidence where file_path=path;
 return e.id is not null and private.evidence_access(e.id);
end $$;
create function private.guard_evidence_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or old.uploaded_by<>auth.uid() or old.uploaded_at is not null or exists(select 1 from storage.objects where bucket_id='evidence' and name=old.file_path) then raise exception 'Solo puede descartar una reserva propia sin archivo' using errcode='42501'; end if;
 return old;
end $$;
create trigger guard_evidence_delete before delete on public.evidence for each row execute function private.guard_evidence_delete();
revoke all on function private.guard_evidence_delete() from public,anon,authenticated;
-- Helpers are evaluated through RLS, including direct requests to the Storage API.
create policy evidence_file_read on storage.objects for select to authenticated using(bucket_id='evidence' and private.evidence_file_access(name,false));
create policy evidence_file_insert on storage.objects for insert to authenticated with check(bucket_id='evidence' and private.evidence_file_access(name,true));
-- No UPDATE/upsert policy: uploaded deliveries cannot be overwritten.
create policy evidence_file_cancel on storage.objects for delete to authenticated using(bucket_id='evidence' and private.evidence_file_access(name,true));
revoke all on function private.guard_evidence(),private.guard_comment(),private.record_phase5_activity() from public,anon,authenticated;
revoke all on function private.attachment_access(uuid,uuid),private.attachment_writable(uuid,uuid,uuid),private.evidence_access(uuid),private.comment_access(uuid,uuid,uuid),private.evidence_file_access(text,boolean),private.finalize_evidence(uuid),public.finalize_evidence(uuid) from public,anon,authenticated;
grant execute on function private.attachment_access(uuid,uuid),private.attachment_writable(uuid,uuid,uuid),private.evidence_access(uuid),private.comment_access(uuid,uuid,uuid),private.evidence_file_access(text,boolean),private.finalize_evidence(uuid),public.finalize_evidence(uuid) to authenticated;

-- Complete the review before approving tasks or closing findings that have deliveries.
create function private.guard_evidence_completion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if (TG_TABLE_NAME='tasks' and new.status::text='DONE') or (TG_TABLE_NAME='findings' and new.status::text='CLOSED') then
  if exists(select 1 from public.evidence e where e.organization_id=new.organization_id
   and case when TG_TABLE_NAME='tasks' then e.task_id=new.id else e.finding_id=new.id end
   and e.uploaded_at is not null and e.review_status<>'ACCEPTED'
   and not exists(select 1 from public.evidence next where next.previous_evidence_id=e.id and next.uploaded_at is not null)) then
   raise exception 'Revise y acepte las últimas entregas de evidencia antes de aprobar o cerrar';
  end if;
 end if;
 return new;
end $$;
create trigger guard_evidence_completion before update on public.tasks for each row execute function private.guard_evidence_completion();
create trigger guard_evidence_completion before update on public.findings for each row execute function private.guard_evidence_completion();
revoke all on function private.guard_evidence_completion() from public,anon,authenticated;
