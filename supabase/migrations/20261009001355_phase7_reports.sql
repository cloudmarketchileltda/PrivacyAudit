-- Phase 7: published, immutable report snapshots; no client-supplied business data.
create table public.reports (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 assessment_id uuid not null,
 created_by uuid not null references public.profiles(id) on delete restrict,
 title text not null check(length(trim(title)) between 2 and 200),
 snapshot jsonb not null check(jsonb_typeof(snapshot)='object' and snapshot->>'version'='1'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(assessment_id,organization_id) references public.assessments(id,organization_id) on delete restrict
);
create index reports_org_time_idx on public.reports(organization_id,created_at desc,id);
create index reports_assessment_idx on public.reports(assessment_id,organization_id);
create index reports_creator_idx on public.reports(created_by);
alter table public.reports enable row level security;
revoke all on public.reports from public,anon,authenticated;
grant select on public.reports to authenticated;
-- A published report is shared with the whole organization, including its complete action plan.
create policy reports_read on public.reports for select to authenticated using(private.can_read(organization_id));
create trigger aa_guard_organization_deletion before insert or update or delete on public.reports
 for each row execute function private.guard_organization_deletion();
create function private.guard_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='DELETE' and private.is_admin() and exists(select 1 from private.organization_deletions where organization_id=old.organization_id and finalizing) then return old; end if;
 raise exception 'Informe publicado inmutable; genere una nueva versión' using errcode='42501';
end $$;
create trigger guard_report before update or delete on public.reports for each row execute function private.guard_report();

create function private.create_report(assessment uuid,report_title text,executive_summary text,report_scope text,conclusions text) returns uuid
language plpgsql security definer set search_path='' as $$
declare org uuid; result uuid; content jsonb;
begin
 select organization_id into org from public.assessments where id=assessment;
 if auth.uid() is null or org is null or not private.can_manage(org) then raise exception 'No autorizado' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org and status='ACTIVE' for share;
 if not found or exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Organización no disponible'; end if;
 if report_title is null or length(trim(report_title)) not between 2 and 200 or
 executive_summary is null or length(trim(executive_summary)) not between 10 and 5000 or
 report_scope is null or length(trim(report_scope)) not between 10 and 5000 or
 conclusions is null or length(trim(conclusions)) not between 10 and 5000 then raise exception 'Revise los textos del informe' using errcode='22023'; end if;
 -- A single SQL statement captures every section using the same MVCC snapshot; no REST row limit.
 select jsonb_build_object(
  'version',1,'captured_at',statement_timestamp(),
  'organization',jsonb_build_object('id',o.id,'legal_name',o.legal_name,'rut',o.rut),
  'assessment',jsonb_build_object('id',a.id,'name',a.name,'description',a.description,'status',a.status,'started_at',a.started_at,'completed_at',a.completed_at),
  'consultant',coalesce((select full_name from public.profiles where id=a.consultant_id),'Sin consultor registrado'),
  'author',(select full_name from public.profiles where id=auth.uid()),
  'executive_summary',trim(executive_summary),'scope',trim(report_scope),'conclusions',trim(conclusions),
  'controls',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'snapshot',c.snapshot,'status',c.status,'auditor_comment',c.auditor_comment,'applicability_reason',c.applicability_reason) order by (c.snapshot->>'sort_order')::integer,c.id) from public.assessment_controls c where c.assessment_id=a.id),'[]'),
  'findings',coalesce((select jsonb_agg(to_jsonb(f)||jsonb_build_object('assignee_name',coalesce(p.full_name,'Sin asignar')) order by f.severity desc,f.code) from public.findings f left join public.profiles p on p.id=f.assigned_to where f.assessment_id=a.id),'[]'),
  'tasks',coalesce((select jsonb_agg(to_jsonb(t)||jsonb_build_object('assignee_name',coalesce(p.full_name,'Sin asignar')) order by t.due_date nulls last,t.id) from public.tasks t join public.findings f on f.id=t.finding_id left join public.profiles p on p.id=t.assigned_to where f.assessment_id=a.id),'[]'),
  'processing',coalesce((select jsonb_agg(to_jsonb(pa) order by pa.name,pa.id) from public.processing_activities pa where pa.organization_id=org),'[]'),
  'evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'control_id',e.control_id,'finding_id',e.finding_id,'task_id',e.task_id,'previous_evidence_id',e.previous_evidence_id,'original_filename',e.original_filename,'description',e.description,'review_status',e.review_status,'reviewer_comment',e.reviewer_comment,'reviewed_at',e.reviewed_at,'reviewer_name',coalesce(p.full_name,'Sin revisor')) order by e.reviewed_at,e.id)
   from public.evidence e left join public.profiles p on p.id=e.reviewed_by
   where e.organization_id=org and e.uploaded_at is not null and e.reviewed_at is not null
   and (e.control_id in(select id from public.assessment_controls where assessment_id=a.id)
    or e.finding_id in(select id from public.findings where assessment_id=a.id)
    or (e.control_id is null and e.finding_id is null and e.task_id is null))),'[]')
 ) into content from public.assessments a join public.organizations o on o.id=a.organization_id where a.id=assessment;
 insert into public.reports(organization_id,assessment_id,created_by,title,snapshot) values(org,assessment,auth.uid(),trim(report_title),content) returning id into result;
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(org,auth.uid(),'REPORT_GENERATED','reports',result,jsonb_build_object('assessment_id',assessment,'snapshot_version',1));
 return result;
end $$;
create function public.create_report(assessment uuid,report_title text,executive_summary text,report_scope text,conclusions text) returns uuid
 language sql security invoker set search_path='' as $$ select private.create_report(assessment,report_title,executive_summary,report_scope,conclusions) $$;
create function private.record_report_download(report uuid) returns void language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 select organization_id into org from public.reports where id=report;
 if org is null or not private.can_read(org) then raise exception 'No autorizado' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org for share;
 if exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Organización no disponible'; end if;
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(org,auth.uid(),'REPORT_DOWNLOAD','reports',report,'{}');
end $$;
create function public.record_report_download(report uuid) returns void language sql security invoker set search_path='' as $$ select private.record_report_download(report) $$;
revoke all on function private.guard_report(),private.create_report(uuid,text,text,text,text),public.create_report(uuid,text,text,text,text),private.record_report_download(uuid),public.record_report_download(uuid) from public,anon,authenticated;
grant execute on function private.create_report(uuid,text,text,text,text),public.create_report(uuid,text,text,text,text),private.record_report_download(uuid),public.record_report_download(uuid) to authenticated;

-- ORG-04: remove reports before assessments, including immutable snapshots.
create or replace function private.finish_organization_deletion(org uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Solo SUPER_ADMIN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org for update;
 if not found then return; end if;
 if not exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Preparación requerida'; end if;
 if exists(select 1 from storage.objects where bucket_id='evidence' and starts_with(name,org::text||'/')) then raise exception 'Debe borrar los archivos mediante Storage API'; end if;
 update private.organization_deletions set finalizing=true where organization_id=org;
 delete from public.reports where organization_id=org;
 delete from public.notifications where organization_id=org;
 delete from public.comments where organization_id=org;
 delete from public.evidence where organization_id=org;
 delete from public.tasks where organization_id=org;
 delete from public.findings where organization_id=org;
 delete from public.assessment_controls where organization_id=org;
 delete from public.assessments where organization_id=org;
 delete from public.processing_activities where organization_id=org;
 delete from public.organization_invitations where organization_id=org;
 delete from public.organization_members where organization_id=org;
 delete from public.organizations where id=org;
 -- Also erase organization snapshots and deletion events generated by the above triggers.
 delete from public.audit_logs where organization_id=org or organization_ref=org or (entity_type='organizations' and entity_id=org) or position(org::text in metadata::text)>0;
 -- Global administrative receipt contains no organization identity or business data.
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'ADMIN_ORGANIZATION_DELETED','administration',gen_random_uuid(),'{}');
end $$;
