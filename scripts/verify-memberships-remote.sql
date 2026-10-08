-- SQL authorization contexts only; does not issue JWTs or create GoTrue sessions.
begin;
select set_config('privacyaudit.members.admin',(select id::text from public.profiles where role='SUPER_ADMIN' limit 1),true);
do $$ begin
 if current_setting('privacyaudit.members.admin')='' then raise exception 'Administrador requerido'; end if;
 if exists(select 1 from auth.users where id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002') or email in ('membership-grid-client@example.test','membership-grid-consultant@example.test')) then raise exception 'Datos temporales ya existentes'; end if;
end $$;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data) values
('f0000000-0000-4000-8000-000000000001','membership-grid-client@example.test',now(),'{"full_name":"Cliente temporal grilla"}',jsonb_build_object('provisioned_by',current_setting('privacyaudit.members.admin'),'provisioned_role','CLIENT')),
('f0000000-0000-4000-8000-000000000002','membership-grid-consultant@example.test',now(),'{"full_name":"Consultor temporal grilla"}',jsonb_build_object('provisioned_by',current_setting('privacyaudit.members.admin'),'provisioned_role','CONSULTANT'));
select set_config('privacyaudit.members.rut1',(select body::text||'-'||dv from generate_series(90000000,90000099) body cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) dv where private.valid_rut(body::text||'-'||dv) and not exists(select 1 from public.organizations where rut=body::text||'-'||dv) order by body limit 1),true);
select set_config('privacyaudit.members.rut2',(select body::text||'-'||dv from generate_series(90000000,90000099) body cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) dv where private.valid_rut(body::text||'-'||dv) and body::text||'-'||dv<>current_setting('privacyaudit.members.rut1') and not exists(select 1 from public.organizations where rut=body::text||'-'||dv) order by body limit 1),true);
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.members.admin'),true);
set local role authenticated;
select set_config('privacyaudit.members.org1',public.create_organization(jsonb_build_object('legal_name','Grilla temporal 1','rut',current_setting('privacyaudit.members.rut1')))::text,true);
select set_config('privacyaudit.members.org2',public.create_organization(jsonb_build_object('legal_name','Grilla temporal 2','rut',current_setting('privacyaudit.members.rut2')))::text,true);
select public.set_user_organizations('f0000000-0000-4000-8000-000000000001','CLIENT',array[current_setting('privacyaudit.members.org1')::uuid],'{}'::uuid[]);
do $$ begin
 begin perform public.set_user_organizations('f0000000-0000-4000-8000-000000000001','CLIENT',array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid],array[current_setting('privacyaudit.members.org1')::uuid]);raise exception 'Segunda organización cliente permitida';exception when check_violation then null;end;
 begin perform public.set_user_organizations('f0000000-0000-4000-8000-000000000001','CLIENT',array[current_setting('privacyaudit.members.org2')::uuid],'{}'::uuid[]);raise exception 'Guardado obsoleto permitido';exception when serialization_failure then null;end;
 begin perform public.manage_member(current_setting('privacyaudit.members.org2')::uuid,'f0000000-0000-4000-8000-000000000001','CLIENT');raise exception 'RPC antigua permitió segunda organización';exception when unique_violation then null;end;
 begin perform public.set_user_role('f0000000-0000-4000-8000-000000000001','CONSULTANT');raise exception 'Cambio incompatible permitido';exception when check_violation then null;end;
end $$;
select public.set_user_organizations('f0000000-0000-4000-8000-000000000001','CLIENT',array[current_setting('privacyaudit.members.org2')::uuid],array[current_setting('privacyaudit.members.org1')::uuid]);
select set_config('privacyaudit.members.invite',public.invite_client(current_setting('privacyaudit.members.org1')::uuid,'membership-grid-client@example.test'),true);
select set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
do $$ begin
 if (select count(*) from public.organizations)<>1 or not exists(select 1 from public.organizations where id=current_setting('privacyaudit.members.org2')::uuid) then raise exception 'Transferencia no aislada';end if;
 begin perform public.accept_invitation(current_setting('privacyaudit.members.invite'));raise exception 'Invitación permitió segunda organización';exception when check_violation then null;end;
 begin perform public.admin_membership_users('CLIENT','',1);raise exception 'Cliente pudo leer grillas';exception when insufficient_privilege then null;end;
 begin perform public.set_user_organizations('f0000000-0000-4000-8000-000000000001','CLIENT','{}'::uuid[],'{}'::uuid[]);raise exception 'Cliente pudo asignar';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.members.admin'),true);
select public.set_user_organizations('f0000000-0000-4000-8000-000000000002','CONSULTANT',array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid],'{}'::uuid[]);
update public.organizations set status='ARCHIVED' where id=current_setting('privacyaudit.members.org1')::uuid;
select public.set_user_organizations('f0000000-0000-4000-8000-000000000002','CONSULTANT',array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid],array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid]);
select public.set_user_organizations('f0000000-0000-4000-8000-000000000002','CONSULTANT',array[current_setting('privacyaudit.members.org2')::uuid],array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid]);
do $$ begin
 begin perform public.set_user_organizations('f0000000-0000-4000-8000-000000000002','CONSULTANT',array[current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid],array[current_setting('privacyaudit.members.org2')::uuid]);raise exception 'Nueva asignación archivada permitida';exception when check_violation then null;end;
 if (public.admin_membership_users('CLIENT','membership-grid-client@example.test',1)->>'count')::int<>1 then raise exception 'Grilla/búsqueda incorrecta';end if;
 if not exists(select 1 from public.audit_logs where actor_id::text=current_setting('privacyaudit.members.admin') and entity_type='organization_members' and organization_id in (current_setting('privacyaudit.members.org1')::uuid,current_setting('privacyaudit.members.org2')::uuid)) then raise exception 'Auditoría ausente';end if;
end $$;
reset role;
rollback;
