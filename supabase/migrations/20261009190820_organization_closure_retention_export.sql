-- Retention while an organization exists; ORG-04/EVA-05 deletion takes precedence.
create or replace function private.purge_audit_logs(before_time timestamptz,reason text,confirmation text) returns bigint language plpgsql security definer set search_path='' as $$
begin raise exception 'Purga discrecional deshabilitada. Se conserva el historial mientras exista la organización.' using errcode='42501'; end $$;
revoke all on function private.purge_audit_logs(timestamptz,text,text),public.purge_audit_logs(timestamptz,text,text) from public,anon,authenticated;

-- Admin-only export intentionally includes the complete organization, beyond operational RLS.
-- One statement captures a coherent MVCC snapshot. No Auth, account contacts, or invitation secrets.
create function private.organization_export_snapshot(org uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare content jsonb;
begin
 if not private.is_admin() then raise exception 'Solo SUPER_ADMIN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org and status='ARCHIVED' for share;
 if not found then raise exception 'Archive la organización antes de exportar'; end if;
 if exists(select 1 from private.organization_deletions where organization_id=org) or exists(select 1 from private.assessment_deletions d join public.assessments a on a.id=d.assessment_id where a.organization_id=org) then raise exception 'Eliminación pendiente; exportación completa no disponible'; end if;
 select jsonb_build_object('version',1,'captured_at',statement_timestamp(),'data',jsonb_build_object(
'organization',to_jsonb(o),
'assessments',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.assessments t where t.organization_id=o.id),
'assessment_controls',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.assessment_controls t where t.organization_id=o.id),
'processing_activities',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.processing_activities t where t.organization_id=o.id),
'findings',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.findings t where t.organization_id=o.id),
'tasks',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.tasks t where t.organization_id=o.id),
'evidence',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.evidence t where t.organization_id=o.id),
'comments',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.comments t where t.organization_id=o.id),
'notifications',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.notifications t where t.organization_id=o.id),
'reports',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.reports t where t.organization_id=o.id),
'organization_members',(select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.organization_members t where t.organization_id=o.id),
'invitations',(select coalesce(jsonb_agg(to_jsonb(t) - 'token_hash' order by t.id),'[]'::jsonb) from public.organization_invitations t where t.organization_id=o.id),
'members',(select coalesce(jsonb_agg(jsonb_build_object('user_id',p.id,'full_name',p.full_name,'role',m.role) order by p.id),'[]'::jsonb) from public.organization_members m join public.profiles p on p.id=m.user_id where m.organization_id=o.id),
'audit_logs',(select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at,t.id),'[]'::jsonb) from public.audit_logs t where t.organization_id=o.id or t.organization_ref=o.id or (t.entity_type='organizations' and t.entity_id=o.id) or position(o.id::text in t.metadata::text)>0),
'files',(select coalesce(jsonb_agg(jsonb_build_object('name',s.name,'metadata',s.metadata) order by s.name),'[]'::jsonb) from storage.objects s where s.bucket_id='evidence' and starts_with(s.name,o.id::text||'/')))) into content from public.organizations o where o.id=org;
 return content;
end $$;
create function public.organization_export_snapshot(org uuid) returns jsonb language sql security invoker set search_path='' as $$ select private.organization_export_snapshot(org) $$;
create function private.record_organization_export(org uuid,manifest_sha256 text) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Solo SUPER_ADMIN' using errcode='42501'; end if;
 perform 1 from public.organizations where id=org and status='ARCHIVED' for share;
 if not found or exists(select 1 from private.organization_deletions where organization_id=org) or exists(select 1 from private.assessment_deletions d join public.assessments a on a.id=d.assessment_id where a.organization_id=org) then raise exception 'Organización no disponible para exportación'; end if;
 if manifest_sha256 is null or manifest_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'Índice inválido'; end if;
 insert into public.audit_logs(organization_id,actor_id,action,entity_type,entity_id,metadata) values(org,auth.uid(),'ORGANIZATION_EXPORT_PREPARED','organizations',org,jsonb_build_object('manifest_sha256',manifest_sha256,'meaning','Paquete preparado; no acredita recepción ni conservación por el cliente'));
end $$;
create function public.record_organization_export(org uuid,manifest_sha256 text) returns void language sql security invoker set search_path='' as $$ select private.record_organization_export(org,manifest_sha256) $$;
revoke all on function private.organization_export_snapshot(uuid),public.organization_export_snapshot(uuid),private.record_organization_export(uuid,text),public.record_organization_export(uuid,text) from public,anon,authenticated;
grant execute on function private.organization_export_snapshot(uuid),public.organization_export_snapshot(uuid),private.record_organization_export(uuid,text),public.record_organization_export(uuid,text) to authenticated;
