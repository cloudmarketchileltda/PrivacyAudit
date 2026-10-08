-- Account email is exposed only through an explicitly authorized administrative RPC.
create function private.admin_accounts(term text,page_number integer) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; total bigint; needle text=lower(left(trim(coalesce(term,'')),100));
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 if page_number is null or page_number<1 or page_number>10000 then raise exception 'Página inválida'; end if;
 select count(*) into total from public.profiles p join auth.users u on u.id=p.id where needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0;
 select coalesce(jsonb_agg(to_jsonb(p) order by p.full_name,p.id),'[]') into result from (
 select p.id,p.full_name,p.role,u.email from public.profiles p join auth.users u on u.id=p.id where needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0 order by p.full_name,p.id offset (page_number-1)*20 limit 20
 ) p;
 return jsonb_build_object('users',result,'count',total);
end $$;
create function public.admin_accounts(term text,page_number integer) returns jsonb language sql stable security invoker set search_path='' as $$ select private.admin_accounts(term,page_number) $$;

-- A one-use reservation binds the Auth Admin operation to its authorized actor and exact data.
create table private.account_mutations (
 id uuid primary key default gen_random_uuid(), target uuid not null unique references public.profiles(id) on delete cascade,
 actor uuid not null references public.profiles(id) on delete cascade,
 operation text not null check(operation in ('UPDATE','DELETE')), email text, full_name text,
 expires_at timestamptz not null default now()+interval '1 minute'
);
alter table private.account_mutations enable row level security;
revoke all on private.account_mutations from public,anon,authenticated;
create function private.reserve_account_mutation(target uuid,operation text,account_email text,account_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare reservation uuid;
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 if operation is null or operation not in ('UPDATE','DELETE') then raise exception 'Operación inválida'; end if;
 perform 1 from public.profiles p where p.id=target for update;
 if not found then raise exception 'Cuenta no encontrada'; end if;
 if operation='DELETE' and (target=auth.uid() or exists(select 1 from public.profiles p where p.id=target and p.role='SUPER_ADMIN')) then raise exception 'No se puede eliminar una cuenta administrativa' using errcode='42501'; end if;
 if operation='UPDATE' and (account_name is null or length(trim(account_name)) not between 2 and 160 or account_email is null or length(account_email)>254 or account_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Datos inválidos'; end if;
 delete from private.account_mutations m where m.expires_at<now();
 insert into private.account_mutations(target,actor,operation,email,full_name) values(target,auth.uid(),operation,lower(trim(account_email)),trim(account_name)) returning id into reservation;
 return reservation;
end $$;
create function public.reserve_account_mutation(target uuid,operation text,account_email text,account_name text) returns uuid language sql security invoker set search_path='' as $$ select private.reserve_account_mutation(target,operation,account_email,account_name) $$;
create function private.cancel_account_mutation(reservation_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 delete from private.account_mutations where id=reservation_id and actor=auth.uid();
end $$;
create function public.cancel_account_mutation(reservation_id uuid) returns void language sql security invoker set search_path='' as $$ select private.cancel_account_mutation(reservation_id) $$;

-- Normal user metadata updates never update the canonical administrative profile.
-- The reserved mutation and its audit receipt commit with Auth's own transaction.
create function private.apply_account_mutation() returns trigger language plpgsql security definer set search_path='' as $$
declare reservation private.account_mutations; previous_sub text; subject_name text;
begin
 select * into reservation from private.account_mutations where target=old.id and operation=TG_OP and expires_at>now() for update;
 if reservation.id is null then
  if TG_OP='DELETE' and coalesce(nullif(current_setting('role',true),'none'),session_user::text) not in ('postgres','supabase_admin') then raise exception 'Reserva administrativa requerida' using errcode='42501'; end if;
  return coalesce(new,old);
 end if;
 if not exists(select 1 from public.profiles where id=reservation.actor and role='SUPER_ADMIN') then raise exception 'Administrador no autorizado' using errcode='42501'; end if;
 if TG_OP='UPDATE' and (lower(new.email) is distinct from reservation.email or new.raw_user_meta_data->>'full_name' is distinct from reservation.full_name) then
  -- GoTrue may update other Auth fields before applying the requested attributes.
  return new;
 end if;
 if TG_OP='DELETE' and (old.id=reservation.actor or exists(select 1 from public.profiles where id=old.id and role='SUPER_ADMIN')) then raise exception 'Cuenta administrativa protegida' using errcode='42501'; end if;
 previous_sub=current_setting('request.jwt.claim.sub',true);
 perform set_config('request.jwt.claim.sub',reservation.actor::text,true);
 select full_name into subject_name from public.profiles where id=old.id;
 if TG_OP='UPDATE' then
  update public.profiles set full_name=reservation.full_name where id=old.id;
 else
  delete from auth.sessions where user_id=old.id;
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(reservation.actor,'ADMIN_ACCOUNT_'||case TG_OP when 'UPDATE' then 'UPDATED' else 'DELETED' end,'profiles',old.id,jsonb_build_object('subject_name',subject_name,'before_email',old.email,'after_email',case when TG_OP='UPDATE' then new.email else null end));
 delete from private.account_mutations where id=reservation.id;
 perform set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 return coalesce(new,old);
end $$;
create trigger apply_account_update after update on auth.users for each row execute function private.apply_account_mutation();
create trigger apply_account_delete before delete on auth.users for each row execute function private.apply_account_mutation();
revoke all on function private.apply_account_mutation() from public,anon,authenticated;
revoke all on function private.admin_accounts(text,integer),public.admin_accounts(text,integer),private.reserve_account_mutation(uuid,text,text,text),public.reserve_account_mutation(uuid,text,text,text),private.cancel_account_mutation(uuid),public.cancel_account_mutation(uuid) from public,anon;
grant execute on function private.admin_accounts(text,integer),public.admin_accounts(text,integer),private.reserve_account_mutation(uuid,text,text,text),public.reserve_account_mutation(uuid,text,text,text),private.cancel_account_mutation(uuid),public.cancel_account_mutation(uuid) to authenticated;
-- Do not report success if Auth did not consume the exact reservation.
create function private.account_mutation_completed(reservation_id uuid) returns boolean language plpgsql stable security definer set search_path='' as $$
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 return not exists(select 1 from private.account_mutations where id=reservation_id);
end $$;
create function public.account_mutation_completed(reservation_id uuid) returns boolean language sql stable security invoker set search_path='' as $$ select private.account_mutation_completed(reservation_id) $$;
revoke all on function private.account_mutation_completed(uuid),public.account_mutation_completed(uuid) from public,anon;
grant execute on function private.account_mutation_completed(uuid),public.account_mutation_completed(uuid) to authenticated;
