-- EVA-04/05: managers may edit and permanently delete an assessment and its complete subtree.
-- Storage blobs are deleted by assessment-delete via Storage API before the SQL transaction finishes.
alter table public.assessments add column deletion_pending boolean not null default false;
create table private.assessment_deletions (
 assessment_id uuid primary key references public.assessments(id) on delete cascade,
 finalizing boolean not null default false,
 started_at timestamptz not null default now()
);
alter table private.assessment_deletions enable row level security;
revoke all on private.assessment_deletions from public,anon,authenticated;

-- Internal relation resolver: never exposed as an API and never accepts paths from the browser.
create function private.related_assessment(table_name text,row_data jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 if table_name='assessments' then return (row_data->>'id')::uuid; end if;
 if table_name in ('assessment_controls','findings','reports') then return (row_data->>'assessment_id')::uuid; end if;
 if table_name='tasks' then
  select assessment_id into result from public.findings where id=(row_data->>'finding_id')::uuid;
 else
  select coalesce(
   (select assessment_id from public.assessment_controls where id=(row_data->>'control_id')::uuid),
   (select assessment_id from public.findings where id=(row_data->>'finding_id')::uuid),
   (select f.assessment_id from public.tasks t join public.findings f on f.id=t.finding_id where t.id=(row_data->>'task_id')::uuid),
   (select coalesce(c.assessment_id,f.assessment_id,tf.assessment_id) from public.evidence e
    left join public.assessment_controls c on c.id=e.control_id left join public.findings f on f.id=e.finding_id
    left join public.tasks t on t.id=e.task_id left join public.findings tf on tf.id=t.finding_id where e.id=(row_data->>'evidence_id')::uuid)
  ) into result;
 end if;
 return result;
end $$;
create function private.assessment_finalizing(assessment uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from private.assessment_deletions d
 join public.assessments a on a.id=d.assessment_id
 where d.assessment_id=assessment and d.finalizing and private.can_manage(a.organization_id))
$$;
create function private.guard_assessment_deletion() returns trigger
language plpgsql security definer set search_path='' as $$
declare assessment uuid; org uuid; row_data jsonb;
begin
 row_data=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 org=(row_data->>'organization_id')::uuid;
 -- ORG-04 always has priority, including archived or partly deleted assessments.
 if TG_OP='DELETE' and private.is_admin() and exists(select 1 from private.organization_deletions where organization_id=org and finalizing) then return old; end if;
 if TG_TABLE_NAME='assessments' and TG_OP='UPDATE' and not exists(select 1 from public.organizations where id=org and status='ACTIVE') then raise exception 'Organización archivada' using errcode='42501'; end if;
 assessment=private.related_assessment(TG_TABLE_NAME,row_data);
 if assessment is not null then
  if exists(select 1 from private.assessment_deletions where assessment_id=assessment)
   and not (TG_OP='DELETE' and private.assessment_finalizing(assessment)) then
   raise exception 'Evaluación en eliminación. Reintente Eliminar para completar el borrado.' using errcode='42501';
  end if;
 end if;
 return case when TG_OP='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['assessments','assessment_controls','findings','tasks','evidence','comments','notifications','reports'] loop
  execute format('create trigger ab_guard_assessment_deletion before insert or update or delete on public.%I for each row execute function private.guard_assessment_deletion()',t);
 end loop;
end $$;

-- Every write already locks the organization through aa_guard_organization_deletion.
-- Preparing under an exclusive org lock waits for those writes; later writes see the committed marker.
create function private.authorize_assessment_management(assessment uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if auth.uid() is null then raise exception 'Sesión requerida' using errcode='42501'; end if;
 select organization_id into org from public.assessments where id=assessment;
 if org is null then raise exception 'Evaluación no disponible' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org and status='ACTIVE' for update;
 if not found or exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Organización no disponible' using errcode='42501'; end if;
 perform 1 from public.profiles where id=auth.uid() for share;
 perform 1 from public.organization_members where organization_id=org and user_id=auth.uid() for share;
 if not private.can_manage(org) then raise exception 'No autorizado' using errcode='42501'; end if;
 perform 1 from public.assessments where id=assessment and organization_id=org for update;
 if not found then raise exception 'Evaluación no disponible' using errcode='42501'; end if;
 return org;
end $$;
create function private.prepare_assessment_deletion(assessment uuid,confirmation text) returns void
language plpgsql security definer set search_path='' as $$
begin
 if confirmation is distinct from 'ELIMINAR EVALUACION' then raise exception 'Confirmación requerida' using errcode='22023'; end if;
 perform private.authorize_assessment_management(assessment);
 if not exists(select 1 from private.assessment_deletions where assessment_id=assessment) then
  update public.assessments set deletion_pending=true where id=assessment;
  insert into private.assessment_deletions(assessment_id) values(assessment);
 end if;
end $$;
create function private.assessment_deletion_files(assessment uuid) returns text[]
language plpgsql security definer set search_path='' as $$
declare org uuid; files text[];
begin
 org=private.authorize_assessment_management(assessment);
 if not exists(select 1 from private.assessment_deletions where assessment_id=assessment) then raise exception 'Preparación requerida'; end if;
 select coalesce(array_agg(name),'{}'::text[]) into files from (
  select o.name from storage.objects o join public.evidence e on e.file_path=o.name and e.organization_id=org
  where o.bucket_id='evidence' and private.related_assessment('evidence',to_jsonb(e))=assessment order by o.name limit 100
 ) batch;
 return files;
end $$;
create or replace function private.guard_organization_file_write() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid; assessment uuid;
begin
 if new.bucket_id='evidence' then
  select e.organization_id,private.related_assessment('evidence',to_jsonb(e)) into org,assessment from public.evidence e where e.file_path=new.name;
  if org is not null then
   perform 1 from public.organizations where id=org for share;
   if exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Organización en eliminación' using errcode='42501'; end if;
   if exists(select 1 from private.assessment_deletions where assessment_id=assessment) then raise exception 'Evaluación en eliminación' using errcode='42501'; end if;
  end if;
 end if;
 return new;
end $$;
create or replace function private.guard_evidence_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if private.is_admin() and exists(select 1 from private.organization_deletions where organization_id=old.organization_id and finalizing) then return old; end if;
 if private.assessment_finalizing(private.related_assessment('evidence',to_jsonb(old))) then return old; end if;
 if auth.uid() is null or old.uploaded_by<>auth.uid() or old.uploaded_at is not null or exists(select 1 from storage.objects where bucket_id='evidence' and name=old.file_path) then raise exception 'Solo puede descartar una reserva propia sin archivo' using errcode='42501'; end if;
 return old;
end $$;
create or replace function private.guard_report() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='DELETE' then
  if private.is_admin() and exists(select 1 from private.organization_deletions where organization_id=old.organization_id and finalizing) then return old; end if;
  if private.assessment_finalizing(old.assessment_id) then return old; end if;
 end if;
 raise exception 'Informe publicado inmutable; genere una nueva versión' using errcode='42501';
end $$;
create function private.finish_assessment_deletion(assessment uuid) returns void
language plpgsql security definer set search_path='' as $$
declare org uuid; entities uuid[]; evidence_ids uuid[]; task_ids uuid[]; finding_ids uuid[]; control_ids uuid[];
begin
 org=private.authorize_assessment_management(assessment);
 if not exists(select 1 from private.assessment_deletions where assessment_id=assessment) then raise exception 'Preparación requerida'; end if;
 if exists(select 1 from storage.objects o join public.evidence e on e.file_path=o.name and e.organization_id=org where o.bucket_id='evidence' and private.related_assessment('evidence',to_jsonb(e))=assessment) then raise exception 'Borre los archivos mediante Storage API antes de finalizar'; end if;
 select coalesce(array_agg(id),'{}') into control_ids from public.assessment_controls where assessment_id=assessment;
 select coalesce(array_agg(id),'{}') into finding_ids from public.findings where assessment_id=assessment;
 select coalesce(array_agg(id),'{}') into task_ids from public.tasks where finding_id=any(finding_ids);
 select coalesce(array_agg(id),'{}') into evidence_ids from public.evidence where control_id=any(control_ids) or finding_id=any(finding_ids) or task_id=any(task_ids);
 select array[assessment]||control_ids||finding_ids||task_ids||evidence_ids||
  coalesce((select array_agg(id) from public.comments where finding_id=any(finding_ids) or task_id=any(task_ids) or evidence_id=any(evidence_ids)),'{}')||
  coalesce((select array_agg(id) from public.notifications where finding_id=any(finding_ids) or task_id=any(task_ids) or evidence_id=any(evidence_ids)),'{}')||
  coalesce((select array_agg(id) from public.reports where assessment_id=assessment),'{}') into entities;
 update private.assessment_deletions set finalizing=true where assessment_id=assessment;
 delete from public.reports where assessment_id=assessment;
 delete from public.notifications where finding_id=any(finding_ids) or task_id=any(task_ids) or evidence_id=any(evidence_ids);
 delete from public.comments where finding_id=any(finding_ids) or task_id=any(task_ids) or evidence_id=any(evidence_ids);
 delete from public.evidence where id=any(evidence_ids);
 delete from public.tasks where id=any(task_ids);
 delete from public.findings where id=any(finding_ids);
 delete from public.assessment_controls where id=any(control_ids);
 delete from public.assessments where id=assessment;
 -- Remove all linked audit events, including safe snapshots mentioning deleted entity IDs.
 delete from public.audit_logs a where (a.organization_id=org or a.organization_ref=org)
  and (a.entity_id=any(entities) or exists(select 1 from unnest(entities) e where position(e::text in a.metadata::text)>0));
 -- Receipt contains no assessment identity/content and remains removable through ORG-04.
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata)
 values(org,auth.uid(),'ASSESSMENT_DELETED','assessment_deletion',gen_random_uuid(),jsonb_build_object('deleted_entities',cardinality(entities)));
end $$;
create function public.prepare_assessment_deletion(assessment uuid,confirmation text) returns void language sql security invoker set search_path='' as $$ select private.prepare_assessment_deletion(assessment,confirmation) $$;
create function public.assessment_deletion_files(assessment uuid) returns text[] language sql security invoker set search_path='' as $$ select private.assessment_deletion_files(assessment) $$;
create function public.finish_assessment_deletion(assessment uuid) returns void language sql security invoker set search_path='' as $$ select private.finish_assessment_deletion(assessment) $$;
revoke all on function private.related_assessment(text,jsonb),private.assessment_finalizing(uuid),private.guard_assessment_deletion(),private.authorize_assessment_management(uuid),private.prepare_assessment_deletion(uuid,text),private.assessment_deletion_files(uuid),private.finish_assessment_deletion(uuid),public.prepare_assessment_deletion(uuid,text),public.assessment_deletion_files(uuid),public.finish_assessment_deletion(uuid) from public,anon,authenticated;
grant execute on function private.prepare_assessment_deletion(uuid,text),private.assessment_deletion_files(uuid),private.finish_assessment_deletion(uuid),public.prepare_assessment_deletion(uuid,text),public.assessment_deletion_files(uuid),public.finish_assessment_deletion(uuid) to authenticated;
