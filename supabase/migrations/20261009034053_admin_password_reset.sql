-- No password or hash is accepted by SQL RPCs. Auth hashes the new password.
-- This private receipt binds the Auth transaction to an authorized administrator.
create table private.password_resets (
 id uuid primary key default gen_random_uuid(),
 target uuid not null unique references public.profiles(id) on delete cascade,
 actor uuid not null references public.profiles(id) on delete cascade,
 expires_at timestamptz not null default now()+interval '1 minute',
 completed_at timestamptz,
 password_changed_transaction bigint
);
alter table private.password_resets enable row level security;
revoke all on private.password_resets from public,anon,authenticated;

create function private.reserve_password_reset(target uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare receipt uuid;
begin
 if not private.is_admin() or target=auth.uid() then raise exception 'Restablecimiento no autorizado' using errcode='42501'; end if;
 perform 1 from public.profiles p where p.id=target for update;
 if not found then raise exception 'Cuenta no encontrada'; end if;
 delete from private.password_resets r where r.expires_at<now();
 insert into private.password_resets(target,actor) values(target,auth.uid()) returning id into receipt;
 return receipt;
end $$;
create function public.reserve_password_reset(target uuid) returns uuid
language sql security invoker set search_path='' as $$ select private.reserve_password_reset(target) $$;

create function private.apply_password_reset() returns trigger
language plpgsql security definer set search_path='' as $$
declare receipt private.password_resets; previous_sub text;
begin
 -- GoTrue writes password before app_metadata, as separate UPDATEs in one transaction.
 -- Bind both steps by transaction ID; a concurrent self-change cannot consume the receipt.
 if new.encrypted_password is distinct from old.encrypted_password then
  update private.password_resets r set password_changed_transaction=txid_current()
  where r.target=old.id and r.completed_at is null and r.expires_at>now();
 end if;
 select r.* into receipt from private.password_resets r
 where r.target=old.id and r.completed_at is null and r.expires_at>now()
 and r.password_changed_transaction=txid_current()
 and r.id::text=new.raw_app_meta_data->>'password_reset_receipt' for update;
 if receipt.id is null then return new; end if;
 -- Recheck the role in the Auth transaction, including concurrent role changes.
 perform 1 from public.profiles p where p.id=receipt.actor and p.role='SUPER_ADMIN' for share;
 if not found or receipt.actor=old.id then raise exception 'Administrador no autorizado' using errcode='42501'; end if;
 previous_sub=current_setting('request.jwt.claim.sub',true);
 perform set_config('request.jwt.claim.sub',receipt.actor::text,true);
 delete from auth.sessions where user_id=old.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(receipt.actor,'ADMIN_ACCOUNT_PASSWORD_RESET','profiles',old.id,'{}'::jsonb);
 update private.password_resets set completed_at=now() where id=receipt.id;
 perform set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 return new;
end $$;
create trigger apply_password_reset after update on auth.users
for each row execute function private.apply_password_reset();
revoke all on function private.apply_password_reset() from public,anon,authenticated;

create function private.password_reset_completed(receipt uuid) returns boolean
language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 return exists(select 1 from private.password_resets r where r.id=receipt and r.actor=auth.uid() and r.completed_at is not null);
end $$;
create function public.password_reset_completed(receipt uuid) returns boolean
language sql stable security invoker set search_path='' as $$ select private.password_reset_completed(receipt) $$;
create function private.cancel_password_reset(receipt uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 delete from private.password_resets r where r.id=receipt and r.actor=auth.uid();
end $$;
create function public.cancel_password_reset(receipt uuid) returns void
language sql security invoker set search_path='' as $$ select private.cancel_password_reset(receipt) $$;
revoke all on function private.reserve_password_reset(uuid),public.reserve_password_reset(uuid),private.password_reset_completed(uuid),public.password_reset_completed(uuid),private.cancel_password_reset(uuid),public.cancel_password_reset(uuid) from public,anon;
grant execute on function private.reserve_password_reset(uuid),public.reserve_password_reset(uuid),private.password_reset_completed(uuid),public.password_reset_completed(uuid),private.cancel_password_reset(uuid),public.cancel_password_reset(uuid) to authenticated;
