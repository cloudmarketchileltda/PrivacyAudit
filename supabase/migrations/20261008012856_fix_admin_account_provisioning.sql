-- GoTrue inserts auth.users before applying app_metadata. Reserve the identity
-- through an authenticated admin RPC, then consume it atomically in BEFORE INSERT.
create table private.account_provisioning (
 id uuid primary key default gen_random_uuid(),
 email text not null,
 full_name text not null,
 account_role public.app_role not null check(account_role in ('CLIENT','CONSULTANT')),
 actor_id uuid not null references public.profiles(id),
 expires_at timestamptz not null default now()+interval '5 minutes'
);
alter table private.account_provisioning enable row level security;
revoke all on private.account_provisioning from public,anon,authenticated;

create function private.reserve_account_provisioning(account_email text,account_name text,account_role public.app_role) returns uuid
language plpgsql security definer set search_path='' as $$
declare reservation uuid;
begin
 if not private.is_admin() then raise exception 'Solo el administrador puede crear cuentas' using errcode='42501'; end if;
 if account_role is null or account_role not in ('CLIENT','CONSULTANT') or account_email is null
 or length(account_email)>254 or account_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or account_name is null or length(trim(account_name)) not between 2 and 160 then
  raise exception 'Datos de cuenta inválidos' using errcode='22023';
 end if;
 delete from private.account_provisioning where expires_at<=now();
 insert into private.account_provisioning(email,full_name,account_role,actor_id)
 values(lower(trim(account_email)),trim(account_name),account_role,auth.uid()) returning id into reservation;
 return reservation;
end $$;
create function private.cancel_account_provisioning(reservation_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'Solo el administrador puede crear cuentas' using errcode='42501'; end if;
 delete from private.account_provisioning where id=reservation_id and actor_id=auth.uid();
end $$;
create function public.reserve_account_provisioning(account_email text,account_name text,account_role public.app_role) returns uuid
language sql security invoker set search_path='' as $$ select private.reserve_account_provisioning(account_email,account_name,account_role); $$;
create function public.cancel_account_provisioning(reservation_id uuid) returns void
language sql security invoker set search_path='' as $$ select private.cancel_account_provisioning(reservation_id); $$;
revoke all on function private.reserve_account_provisioning(text,text,public.app_role),private.cancel_account_provisioning(uuid),public.reserve_account_provisioning(text,text,public.app_role),public.cancel_account_provisioning(uuid) from public,anon;
grant execute on function private.reserve_account_provisioning(text,text,public.app_role),private.cancel_account_provisioning(uuid),public.reserve_account_provisioning(text,text,public.app_role),public.cancel_account_provisioning(uuid) to authenticated;

create or replace function private.require_admin_provisioning() returns trigger
language plpgsql security definer set search_path='' as $$
declare reserved private.account_provisioning;
begin
 delete from private.account_provisioning p where p.id=new.id and p.email=lower(new.email)
 and p.expires_at>now() and exists(select 1 from public.profiles where id=p.actor_id and role='SUPER_ADMIN')
 returning p.* into reserved;
 if reserved.id is null then raise exception 'Solo el administrador puede crear cuentas' using errcode='42501'; end if;
 new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('provisioned_by',reserved.actor_id,'provisioned_role',reserved.account_role);
 new.raw_user_meta_data:=coalesce(new.raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('full_name',reserved.full_name);
 return new;
end $$;
