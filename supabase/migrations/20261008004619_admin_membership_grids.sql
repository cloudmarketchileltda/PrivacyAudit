-- One CLIENT membership per account, including direct RPC/invitation paths.
-- Do not discard existing memberships to manufacture compliance with this invariant.
do $$ begin
 if exists(select 1 from public.organization_members where role='CLIENT' group by user_id having count(*)>1)
 or exists(select 1 from public.organization_members m join public.profiles p on p.id=m.user_id where p.role<>m.role and p.role<>'SUPER_ADMIN') then
  raise exception 'Revise las membresías existentes antes de aplicar esta migración';
 end if;
end $$;
create unique index members_one_client_organization on public.organization_members(user_id) where role='CLIENT';

create function private.guard_member_role() returns trigger language plpgsql security definer set search_path='' as $$
declare global_role public.app_role;
begin
 select role into global_role from public.profiles where id=new.user_id for update;
 if global_role is null or (global_role<>new.role and global_role<>'SUPER_ADMIN') then
  raise exception 'Rol de membresía incompatible' using errcode='23514';
 end if;
 return new;
end $$;
revoke all on function private.guard_member_role() from public,anon,authenticated;
create trigger guard_member_role before insert or update on public.organization_members for each row execute function private.guard_member_role();

create or replace function private.set_user_role(target uuid,new_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() or target=auth.uid() then raise exception 'No autorizado' using errcode='42501'; end if;
 perform 1 from public.profiles where id=target for update;
 if not found then raise exception 'Usuario no encontrado'; end if;
 if new_role in ('CLIENT','CONSULTANT') and exists(select 1 from public.organization_members where user_id=target and role<>new_role) then
  raise exception 'Retire primero las membresías incompatibles' using errcode='23514';
 end if;
 update public.profiles set role=new_role,consultant_enrollment_allowed=false where id=target;
end $$;

-- Invitation acceptance must reject a different organization explicitly: the legacy
-- ON CONFLICT DO NOTHING would silently skip the new unique-index conflict.
create or replace function private.accept_invitation(token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.organization_invitations; email_value text; target_role public.app_role;
begin
 select lower(email) into email_value from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if email_value is null then raise exception 'Email confirmado requerido' using errcode='42501'; end if;
 select role into target_role from public.profiles where id=auth.uid() for update;
 if target_role is distinct from 'CLIENT'::public.app_role then raise exception 'La invitación requiere una cuenta cliente' using errcode='42501'; end if;
 select * into invitation from public.organization_invitations where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and email=email_value and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if invitation.id is null or not exists(select 1 from public.organizations where id=invitation.organization_id and status='ACTIVE') then raise exception 'Invitación inválida o vencida' using errcode='42501'; end if;
 if exists(select 1 from public.organization_members where user_id=auth.uid() and organization_id<>invitation.organization_id) then raise exception 'Cliente ya asignado a otra organización' using errcode='23514'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),'CLIENT') on conflict(organization_id,user_id) do nothing;
 update public.profiles set consultant_enrollment_allowed=false where id=auth.uid();
 update public.organization_invitations set accepted_at=now() where id=invitation.id;
 return invitation.organization_id;
end $$;

create function private.set_user_organizations(target uuid,expected_role public.app_role,organizations uuid[],expected_organizations uuid[]) returns void language plpgsql security definer set search_path='' as $$
declare target_role public.app_role; current_orgs uuid[]; wanted uuid[]; expected uuid[]; org_id uuid; org_status public.organization_status;
begin
 if not private.is_admin() then raise exception 'Asignación exclusiva de administrador' using errcode='42501'; end if;
 if expected_role is null or expected_role not in ('CLIENT','CONSULTANT') or organizations is null or expected_organizations is null
 or array_position(organizations,null) is not null or array_position(expected_organizations,null) is not null then raise exception 'Datos inválidos' using errcode='22023'; end if;
 select role into target_role from public.profiles where id=target for update;
 if not found or target_role<>expected_role then raise exception 'El rol del usuario cambió. Actualice la página' using errcode='40001'; end if;
 if exists(select 1 from public.organization_members where user_id=target and role<>target_role) then raise exception 'Membresías incompatibles' using errcode='23514'; end if;
 select coalesce(array_agg(organization_id order by organization_id),'{}'::uuid[]) into current_orgs from public.organization_members where user_id=target;
 select coalesce(array_agg(x order by x),'{}'::uuid[]) into wanted from (select distinct unnest(organizations) x) s;
 select coalesce(array_agg(x order by x),'{}'::uuid[]) into expected from (select distinct unnest(expected_organizations) x) s;
 if cardinality(wanted)<>cardinality(organizations) or cardinality(expected)<>cardinality(expected_organizations) then raise exception 'Organizaciones duplicadas' using errcode='22023'; end if;
 if current_orgs<>expected then raise exception 'Las membresías cambiaron. Actualice la página antes de guardar' using errcode='40001'; end if;
 if target_role='CLIENT' and cardinality(wanted)>1 then raise exception 'Un cliente solo puede pertenecer a una organización' using errcode='23514'; end if;
 foreach org_id in array wanted loop
  select status into org_status from public.organizations where id=org_id for share;
  if not found then raise exception 'Organización no encontrada' using errcode='23503'; end if;
  if org_status='ARCHIVED' and not (org_id=any(current_orgs)) then raise exception 'No se permiten nuevas asignaciones a organizaciones archivadas' using errcode='23514'; end if;
 end loop;
 -- Remove and add only changed relationships; their existing audit triggers record the actor.
 delete from public.organization_members where user_id=target and not (organization_id=any(wanted));
 insert into public.organization_members(organization_id,user_id,role)
 select x,target,target_role from unnest(wanted) x where not (x=any(current_orgs));
end $$;
create function public.set_user_organizations(target uuid,expected_role public.app_role,organizations uuid[],expected_organizations uuid[]) returns void language sql security invoker set search_path='' as $$ select private.set_user_organizations(target,expected_role,organizations,expected_organizations) $$;

create function private.admin_membership_users(member_role public.app_role,term text,page_number integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; total bigint; needle text=lower(left(trim(coalesce(term,'')),100));
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 if member_role is null or member_role not in ('CLIENT','CONSULTANT') or page_number is null or page_number<1 or page_number>10000 then raise exception 'Filtro inválido' using errcode='22023'; end if;
 select count(*) into total from public.profiles p join auth.users u on u.id=p.id where p.role=member_role and (needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0);
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'full_name',p.full_name,'email',coalesce(p.email,''),'organizations',coalesce((select jsonb_agg(m.organization_id order by m.organization_id) from public.organization_members m where m.user_id=p.id),'[]'::jsonb)) order by p.full_name,p.id),'[]'::jsonb) into result
 from (select p.id,p.full_name,u.email from public.profiles p join auth.users u on u.id=p.id where p.role=member_role and (needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0) order by p.full_name,p.id offset (page_number-1)*20 limit 20) p;
 return jsonb_build_object('users',result,'count',total);
end $$;
create function public.admin_membership_users(member_role public.app_role,term text,page_number integer) returns jsonb language sql stable security invoker set search_path='' as $$ select private.admin_membership_users(member_role,term,page_number) $$;
create function private.admin_membership_organizations() returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'legal_name',legal_name,'rut',rut,'status',status) order by legal_name,id),'[]'::jsonb) into result from public.organizations;
 return result;
end $$;
create function public.admin_membership_organizations() returns jsonb language sql stable security invoker set search_path='' as $$ select private.admin_membership_organizations() $$;
revoke all on function private.set_user_organizations(uuid,public.app_role,uuid[],uuid[]),public.set_user_organizations(uuid,public.app_role,uuid[],uuid[]),private.admin_membership_users(public.app_role,text,integer),public.admin_membership_users(public.app_role,text,integer),private.admin_membership_organizations(),public.admin_membership_organizations() from public,anon;
grant execute on function private.set_user_organizations(uuid,public.app_role,uuid[],uuid[]),public.set_user_organizations(uuid,public.app_role,uuid[],uuid[]),private.admin_membership_users(public.app_role,text,integer),public.admin_membership_users(public.app_role,text,integer),private.admin_membership_organizations(),public.admin_membership_organizations() to authenticated;
