
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;
create type public.app_role as enum ('SUPER_ADMIN','CONSULTANT','CLIENT');
create type public.organization_status as enum ('ACTIVE','ARCHIVED');
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '' check(length(full_name)<=160),
 role public.app_role not null default 'CLIENT', consultant_enrollment_allowed boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create function private.valid_rut(value text) returns boolean language plpgsql immutable strict set search_path='' as $$
declare body text; digit text; total integer=0; factor integer=2; remainder integer;
begin
 if value !~ '^[0-9]{7,8}-[0-9K]$' then return false; end if;
 body=split_part(value,'-',1);digit=split_part(value,'-',2);
 for i in reverse length(body)..1 loop total=total+substr(body,i,1)::integer*factor;factor=case when factor=7 then 2 else factor+1 end; end loop;
 remainder=11-(total%11);
 return digit=case when remainder=11 then '0' when remainder=10 then 'K' else remainder::text end;
end $$;

create table public.organizations (
 id uuid primary key default gen_random_uuid(), legal_name text not null check(length(trim(legal_name)) between 2 and 200),
 rut text not null unique check(private.valid_rut(rut)), trade_name text not null default '', industry text not null default '',
 employee_count integer check(employee_count>=0), website text not null default '', address text not null default '',
 contact_name text not null default '', contact_email text not null default '', contact_phone text not null default '',
 privacy_officer text not null default '', status public.organization_status not null default 'ACTIVE',
 treats_clients boolean not null default false, treats_employees boolean not null default false, treats_suppliers boolean not null default false,
 sensitive_data text not null default 'UNKNOWN' check(sensitive_data in ('YES','NO','UNKNOWN')),
 uses_cameras boolean not null default false, marketing boolean not null default false, external_providers boolean not null default false,
 international_transfers text not null default 'UNKNOWN' check(international_transfers in ('YES','NO','UNKNOWN')),
 has_website boolean not null default false, web_forms boolean not null default false,
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_members (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role public.app_role not null check(role in ('CONSULTANT','CLIENT')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create index members_user_idx on public.organization_members(user_id,organization_id);
create index organizations_creator_idx on public.organizations(created_by);
create table public.organization_invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 email text not null check(length(email)<=254 and email like '%@%'), token_hash text not null unique,
 created_by uuid not null references public.profiles(id), expires_at timestamptz not null default (now()+interval '7 days'),
 accepted_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index invitations_org_idx on public.organization_invitations(organization_id);
create index invitations_email_idx on public.organization_invitations(lower(email));
create index invitations_creator_idx on public.organization_invitations(created_by);
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
create function private.bootstrap_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,full_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),160)); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.bootstrap_profile();
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles where id=auth.uid() and role='SUPER_ADMIN')
$$;
create function private.can_read(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (private.is_admin() or exists(select 1 from public.organization_members where organization_id=org and user_id=auth.uid()))
$$;
create function private.can_manage(org uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and (private.is_admin() or exists(select 1 from public.organization_members m join public.profiles p on p.id=m.user_id where m.organization_id=org and m.user_id=auth.uid() and m.role='CONSULTANT' and p.role='CONSULTANT'))
$$;
create function private.is_consultant() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles where id=auth.uid() and role in ('CONSULTANT','SUPER_ADMIN'))
$$;
create function private.register_consultant() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null) then raise exception 'Email confirmado requerido' using errcode='42501'; end if;
 if exists(select 1 from public.organization_members where user_id=auth.uid()) or exists(select 1 from public.organization_invitations i join auth.users u on lower(u.email)=lower(i.email) where u.id=auth.uid()) then raise exception 'Cuenta vinculada a cliente' using errcode='42501'; end if;
 if not exists(select 1 from public.profiles where id=auth.uid() and consultant_enrollment_allowed and role='CLIENT') then raise exception 'Cuenta no elegible' using errcode='42501'; end if;
 update public.profiles set role='CONSULTANT' where id=auth.uid() and role='CLIENT';
end $$;
create function public.register_consultant() returns void language sql security invoker set search_path='' as $$ select private.register_consultant() $$;
create function private.create_organization(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare org uuid;
begin
 if not private.is_consultant() then raise exception 'No autorizado' using errcode='42501'; end if;
 insert into public.organizations(legal_name,rut,created_by) values(payload->>'legal_name',payload->>'rut',auth.uid()) returning id into org;
 update public.organizations set trade_name=coalesce(payload->>'trade_name',''),industry=coalesce(payload->>'industry',''),website=coalesce(payload->>'website',''),address=coalesce(payload->>'address',''),contact_name=coalesce(payload->>'contact_name',''),contact_email=coalesce(payload->>'contact_email',''),contact_phone=coalesce(payload->>'contact_phone',''),privacy_officer=coalesce(payload->>'privacy_officer',''),employee_count=nullif(payload->>'employee_count','')::integer,status=coalesce(payload->>'status','ACTIVE')::public.organization_status,treats_clients=coalesce((payload->>'treats_clients')::boolean,false),treats_employees=coalesce((payload->>'treats_employees')::boolean,false),treats_suppliers=coalesce((payload->>'treats_suppliers')::boolean,false),uses_cameras=coalesce((payload->>'uses_cameras')::boolean,false),marketing=coalesce((payload->>'marketing')::boolean,false),external_providers=coalesce((payload->>'external_providers')::boolean,false),has_website=coalesce((payload->>'has_website')::boolean,false),web_forms=coalesce((payload->>'web_forms')::boolean,false),sensitive_data=coalesce(payload->>'sensitive_data','UNKNOWN'),international_transfers=coalesce(payload->>'international_transfers','UNKNOWN') where id=org;
 insert into public.organization_members(organization_id,user_id,role) values(org,auth.uid(),'CONSULTANT');
 return org;
end $$;
create function public.create_organization(payload jsonb) returns uuid language sql security invoker set search_path='' as $$ select private.create_organization(payload) $$;
create function private.invite_client(org uuid, target_email text) returns text language plpgsql security definer set search_path='' as $$
declare token text;
begin
 if not private.can_manage(org) or not exists(select 1 from public.organizations where id=org and status='ACTIVE') then raise exception 'No autorizado' using errcode='42501'; end if;
 if length(target_email)>254 or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Email inválido'; end if;
 token=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 insert into public.organization_invitations(organization_id,email,token_hash,created_by) values(org,lower(trim(target_email)),encode(sha256(convert_to(token,'UTF8')),'hex'),auth.uid());
 return token;
end $$;
create function public.invite_client(org uuid,target_email text) returns text language sql security invoker set search_path='' as $$ select private.invite_client(org,target_email) $$;
create function private.accept_invitation(token text) returns uuid language plpgsql security definer set search_path='' as $$
declare invitation public.organization_invitations; email_value text;
begin
 select lower(email) into email_value from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if email_value is null then raise exception 'Email confirmado requerido' using errcode='42501'; end if;
 select * into invitation from public.organization_invitations where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') and email=email_value and accepted_at is null and revoked_at is null and expires_at>now() for update;
 if invitation.id is null or not exists(select 1 from public.organizations where id=invitation.organization_id and status='ACTIVE') then raise exception 'Invitación inválida o vencida' using errcode='42501'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),'CLIENT') on conflict do nothing;
 update public.profiles set consultant_enrollment_allowed=false where id=auth.uid();
 update public.organization_invitations set accepted_at=now() where id=invitation.id;
 return invitation.organization_id;
end $$;
create function public.accept_invitation(token text) returns uuid language sql security invoker set search_path='' as $$ select private.accept_invitation(token) $$;
create function private.manage_member(org uuid, target uuid, member_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.can_manage(org) or target=auth.uid() then raise exception 'No autorizado' using errcode='42501'; end if;
 if member_role is null then delete from public.organization_members where organization_id=org and user_id=target;
 elsif private.is_admin() and member_role in ('CONSULTANT','CLIENT') then
 if not exists(select 1 from public.profiles where id=target and (role=member_role or role='SUPER_ADMIN')) then raise exception 'Rol incompatible'; end if;
 insert into public.organization_members(organization_id,user_id,role) values(org,target,member_role) on conflict(organization_id,user_id) do update set role=excluded.role;
 if member_role='CLIENT' then update public.profiles set consultant_enrollment_allowed=false where id=target; end if;
 else raise exception 'Asignación exclusiva de administrador' using errcode='42501'; end if;
end $$;
create function public.manage_member(org uuid,target uuid,member_role public.app_role) returns void language sql security invoker set search_path='' as $$ select private.manage_member(org,target,member_role) $$;
create function private.set_user_role(target uuid,new_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() or target=auth.uid() then raise exception 'No autorizado' using errcode='42501'; end if;
 if new_role='CLIENT' and exists(select 1 from public.organization_members where user_id=target and role='CONSULTANT') then raise exception 'Retire primero membresías de consultor'; end if;
 update public.profiles set role=new_role,consultant_enrollment_allowed=false where id=target;
end $$;
create function public.set_user_role(target uuid,new_role public.app_role) returns void language sql security invoker set search_path='' as $$ select private.set_user_role(target,new_role) $$;
create function private.revoke_invitation(invitation_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.organization_invitations where id=invitation_id and private.can_manage(organization_id)) then raise exception 'No autorizado' using errcode='42501'; end if;
 update public.organization_invitations set revoked_at=now() where id=invitation_id and accepted_at is null;
end $$;
create function public.revoke_invitation(invitation_id uuid) returns void language sql security invoker set search_path='' as $$ select private.revoke_invitation(invitation_id) $$;
create function public.can_manage_organization(org uuid) returns boolean language sql security invoker set search_path='' as $$ select private.can_manage(org) $$;
create function private.protect_org_identity() returns trigger language plpgsql set search_path='' as $$
begin if new.id<>old.id or new.created_by<>old.created_by or new.created_at<>old.created_at then raise exception 'Identidad inmutable'; end if; return new; end $$;
create trigger protect_org before update on public.organizations for each row execute function private.protect_org_identity();
alter table public.profiles enable row level security;
revoke all on public.profiles from anon,authenticated;
create trigger touch_profiles before update on public.profiles for each row execute function private.touch_updated_at();
alter table public.organizations enable row level security;
revoke all on public.organizations from anon,authenticated;
create trigger touch_organizations before update on public.organizations for each row execute function private.touch_updated_at();
alter table public.organization_members enable row level security;
revoke all on public.organization_members from anon,authenticated;
create trigger touch_organization_members before update on public.organization_members for each row execute function private.touch_updated_at();
alter table public.organization_invitations enable row level security;
revoke all on public.organization_invitations from anon,authenticated;
create trigger touch_organization_invitations before update on public.organization_invitations for each row execute function private.touch_updated_at();

grant select on public.profiles,public.organizations,public.organization_members to authenticated;
grant update(full_name) on public.profiles to authenticated;
grant update(legal_name,rut,trade_name,industry,employee_count,website,address,contact_name,contact_email,contact_phone,privacy_officer,status,treats_clients,treats_employees,treats_suppliers,sensitive_data,uses_cameras,marketing,external_providers,international_transfers,has_website,web_forms) on public.organizations to authenticated;
grant delete on public.organizations to authenticated;
grant select(id,organization_id,email,created_by,expires_at,accepted_at,revoked_at,created_at,updated_at) on public.organization_invitations to authenticated;
create policy profiles_read on public.profiles for select to authenticated using(id=auth.uid() or private.is_admin() or exists(select 1 from public.organization_members m where m.user_id=profiles.id and private.can_manage(m.organization_id)));
create policy profiles_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy org_read on public.organizations for select to authenticated using(private.can_read(id));
create policy org_update on public.organizations for update to authenticated using(private.can_manage(id)) with check(private.can_manage(id));
create policy org_delete on public.organizations for delete to authenticated using(private.can_manage(id));
create policy members_read on public.organization_members for select to authenticated using(user_id=auth.uid() or private.can_manage(organization_id));
create policy invitations_read on public.organization_invitations for select to authenticated using(private.can_manage(organization_id));
revoke all on all functions in schema private from public,anon,authenticated;
grant execute on function private.valid_rut(text),private.is_admin(),private.is_consultant(),private.can_read(uuid),private.can_manage(uuid),private.register_consultant(),private.create_organization(jsonb),private.invite_client(uuid,text),private.accept_invitation(text),private.manage_member(uuid,uuid,public.app_role),private.set_user_role(uuid,public.app_role),private.revoke_invitation(uuid) to authenticated;
revoke all on function public.register_consultant(),public.create_organization(jsonb),public.invite_client(uuid,text),public.accept_invitation(text),public.manage_member(uuid,uuid,public.app_role),public.set_user_role(uuid,public.app_role),public.revoke_invitation(uuid),public.can_manage_organization(uuid) from public,anon;
grant execute on function public.register_consultant(),public.create_organization(jsonb),public.invite_client(uuid,text),public.accept_invitation(text),public.manage_member(uuid,uuid,public.app_role),public.set_user_role(uuid,public.app_role),public.revoke_invitation(uuid),public.can_manage_organization(uuid) to authenticated;

alter table public.organizations add constraint organization_text_limits check(length(trade_name)<=200 and length(industry)<=200 and length(website)<=2000 and length(address)<=500 and length(contact_name)<=200 and length(contact_email)<=254 and length(contact_phone)<=50 and length(privacy_officer)<=200 and (employee_count is null or employee_count<=10000000));
