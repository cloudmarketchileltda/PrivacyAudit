-- Administrative CRUD and resumable deletion. Storage blobs are removed by the API first.
revoke delete on public.organizations from authenticated;
drop policy org_delete on public.organizations;
alter policy org_update on public.organizations using(private.is_admin()) with check(private.is_admin());
create or replace function private.create_organization(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 insert into public.organizations(legal_name,rut,created_by) values(payload->>'legal_name',payload->>'rut',auth.uid()) returning id into org;
 update public.organizations set trade_name=coalesce(payload->>'trade_name',''),industry=coalesce(payload->>'industry',''),website=coalesce(payload->>'website',''),address=coalesce(payload->>'address',''),contact_name=coalesce(payload->>'contact_name',''),contact_email=coalesce(payload->>'contact_email',''),contact_phone=coalesce(payload->>'contact_phone',''),privacy_officer=coalesce(payload->>'privacy_officer',''),employee_count=nullif(payload->>'employee_count','')::integer,status=coalesce(payload->>'status','ACTIVE')::public.organization_status,treats_clients=coalesce((payload->>'treats_clients')::boolean,false),treats_employees=coalesce((payload->>'treats_employees')::boolean,false),treats_suppliers=coalesce((payload->>'treats_suppliers')::boolean,false),uses_cameras=coalesce((payload->>'uses_cameras')::boolean,false),marketing=coalesce((payload->>'marketing')::boolean,false),external_providers=coalesce((payload->>'external_providers')::boolean,false),has_website=coalesce((payload->>'has_website')::boolean,false),web_forms=coalesce((payload->>'web_forms')::boolean,false),sensitive_data=coalesce(payload->>'sensitive_data','UNKNOWN'),international_transfers=coalesce(payload->>'international_transfers','UNKNOWN') where id=org;
 return org;
end $$;

create table private.organization_deletions (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 finalizing boolean not null default false, started_at timestamptz not null default now()
);
alter table private.organization_deletions enable row level security;
revoke all on private.organization_deletions from public,anon,authenticated;

-- All organization writes serialize with preparation. No client-controlled GUC bypass.
create function private.guard_organization_deletion() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid; blocked boolean; finishing boolean; rowdata jsonb;
begin
 rowdata=case when TG_OP='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 org=case when TG_TABLE_NAME='organizations' then (rowdata->>'id')::uuid else (rowdata->>'organization_id')::uuid end;
 perform 1 from public.organizations where id=org for share;
 select true,finalizing into blocked,finishing from private.organization_deletions where organization_id=org;
 if blocked and not (finishing and private.is_admin() and TG_OP='DELETE') then
  raise exception 'Organización en proceso de eliminación. Reintente el borrado desde Administración.' using errcode='42501';
 end if;
 return case when TG_OP='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['organizations','organization_members','organization_invitations','assessments','assessment_controls','processing_activities','findings','tasks','evidence','comments','notifications'] loop
 execute format('create trigger aa_guard_organization_deletion before insert or update or delete on public.%I for each row execute function private.guard_organization_deletion()',t);
 end loop;
end $$;

-- Storage writes also lock the organization; API deletion remains available to the service client.
create function private.guard_organization_file_write() returns trigger language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if new.bucket_id='evidence' then
  select organization_id into org from public.evidence where file_path=new.name;
  if org is not null then
   perform 1 from public.organizations where id=org for share;
   if exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Organización en eliminación' using errcode='42501'; end if;
  end if;
 end if;
 return new;
end $$;
create trigger aa_guard_organization_file_write before insert or update on storage.objects for each row execute function private.guard_organization_file_write();

create function private.prepare_organization_deletion(org uuid,confirmation text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Solo SUPER_ADMIN' using errcode='42501'; end if;
 if confirmation is distinct from 'ELIMINAR ORGANIZACION' then raise exception 'Confirmación requerida'; end if;
 perform 1 from public.organizations where id=org for update;
 if not found then raise exception 'Organización inexistente'; end if;
 insert into private.organization_deletions(organization_id) values(org) on conflict do nothing;
end $$;
create function private.organization_deletion_files(org uuid) returns text[] language plpgsql security definer set search_path='' as $$
declare files text[];
begin
 if not private.is_admin() or not exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'No autorizado' using errcode='42501'; end if;
 select coalesce(array_agg(name),'{}'::text[]) into files from (select name from storage.objects where bucket_id='evidence' and starts_with(name,org::text||'/') order by name limit 100) objects;
 return files;
end $$;
create or replace function private.guard_evidence_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if private.is_admin() and exists(select 1 from private.organization_deletions where organization_id=old.organization_id and finalizing) then return old; end if;
 if auth.uid() is null or old.uploaded_by<>auth.uid() or old.uploaded_at is not null or exists(select 1 from storage.objects where bucket_id='evidence' and name=old.file_path) then raise exception 'Solo puede descartar una reserva propia sin archivo' using errcode='42501'; end if;
 return old;
end $$;
create function private.finish_organization_deletion(org uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Solo SUPER_ADMIN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org for update;
 if not found then return; end if;
 if not exists(select 1 from private.organization_deletions where organization_id=org) then raise exception 'Preparación requerida'; end if;
 if exists(select 1 from storage.objects where bucket_id='evidence' and starts_with(name,org::text||'/')) then raise exception 'Debe borrar los archivos mediante Storage API'; end if;
 update private.organization_deletions set finalizing=true where organization_id=org;
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
create function public.prepare_organization_deletion(org uuid,confirmation text) returns void language sql security invoker set search_path='' as $$ select private.prepare_organization_deletion(org,confirmation) $$;
create function public.organization_deletion_files(org uuid) returns text[] language sql security invoker set search_path='' as $$ select private.organization_deletion_files(org) $$;
create function public.finish_organization_deletion(org uuid) returns void language sql security invoker set search_path='' as $$ select private.finish_organization_deletion(org) $$;
revoke all on function private.guard_organization_deletion(),private.guard_organization_file_write(),private.prepare_organization_deletion(uuid,text),private.organization_deletion_files(uuid),private.finish_organization_deletion(uuid),public.prepare_organization_deletion(uuid,text),public.organization_deletion_files(uuid),public.finish_organization_deletion(uuid) from public,anon,authenticated;
grant execute on function private.prepare_organization_deletion(uuid,text),private.organization_deletion_files(uuid),private.finish_organization_deletion(uuid),public.prepare_organization_deletion(uuid,text),public.organization_deletion_files(uuid),public.finish_organization_deletion(uuid) to authenticated;
