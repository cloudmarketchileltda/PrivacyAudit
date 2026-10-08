-- Gate Auth account creation independently of public application routes.
-- Maintenance connections (postgres/supabase_admin) retain bootstrap/import capability.
create function private.require_admin_provisioning() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if coalesce(new.raw_app_meta_data->>'provisioned_role','') not in ('CLIENT','CONSULTANT')
 or not exists(select 1 from public.profiles where id::text=new.raw_app_meta_data->>'provisioned_by' and role='SUPER_ADMIN') then
  raise exception 'Solo el administrador puede crear cuentas' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.require_admin_provisioning() from public,anon,authenticated;
create trigger require_admin_provisioning before insert on auth.users for each row
 when (current_user not in ('postgres','supabase_admin')) execute function private.require_admin_provisioning();

create or replace function private.bootstrap_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare actor uuid; account_role public.app_role := 'CLIENT';
begin
 select id into actor from public.profiles where id::text=new.raw_app_meta_data->>'provisioned_by' and role='SUPER_ADMIN';
 if actor is not null and new.raw_app_meta_data->>'provisioned_role' in ('CLIENT','CONSULTANT') then
  account_role := (new.raw_app_meta_data->>'provisioned_role')::public.app_role;
 end if;
 insert into public.profiles(id,full_name,role,consultant_enrollment_allowed)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),160),account_role,false);
 if actor is not null then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(actor,'ADMIN_ACCOUNT_CREATED','profiles',new.id,jsonb_build_object('role',account_role));
 end if;
 return new;
end $$;
create or replace function private.register_consultant() returns void
language plpgsql security definer set search_path='' as $$
begin raise exception 'El rol debe asignarlo el administrador' using errcode='42501'; end $$;
revoke execute on function public.register_consultant(),private.register_consultant() from authenticated,anon,public;
alter table public.profiles alter column consultant_enrollment_allowed set default false;
update public.profiles set consultant_enrollment_allowed=false where consultant_enrollment_allowed;
