-- Contact data is deliberately separated from profiles, whose names are visible to organization managers.
create table public.account_details (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 address text not null default '' check(length(address)<=300),
 phone text not null default '' check(length(phone)<=40),
 city text not null default '' check(length(city)<=120),
 country text not null default '' check(length(country)<=120),
 updated_at timestamptz not null default now()
);
alter table public.account_details enable row level security;
revoke all on public.account_details from public,anon,authenticated;
grant select on public.account_details to authenticated;
create policy account_details_read on public.account_details for select to authenticated
 using(user_id=(select auth.uid()) or (select private.is_admin()));
insert into public.account_details(user_id) select id from public.profiles;

-- Validate in PostgreSQL as well as in the application. Missing fields mean empty optional data.
create function private.validate_account_contact(contact jsonb) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb='{}'; field text; value text; max_length integer;
begin
 if contact is null or jsonb_typeof(contact)<>'object' then raise exception 'Datos de contacto inválidos' using errcode='22023'; end if;
 foreach field in array array['address','phone','city','country'] loop
  if contact ? field and jsonb_typeof(contact->field)<>'string' then raise exception 'Datos de contacto inválidos' using errcode='22023'; end if;
  value=trim(coalesce(contact->>field,''));
  max_length=case field when 'address' then 300 when 'phone' then 40 else 120 end;
  if length(value)>max_length then raise exception 'Datos de contacto demasiado largos' using errcode='22023'; end if;
  result=result||jsonb_build_object(field,value);
 end loop;
 return result;
end $$;
create function private.write_account_contact(target uuid,contact jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare validated jsonb; previous jsonb; fields jsonb;
begin
 validated=private.validate_account_contact(contact);
 select jsonb_build_object('address',address,'phone',phone,'city',city,'country',country)
 into previous from public.account_details where user_id=target for update;
 select coalesce(jsonb_agg(k),'[]') into fields from jsonb_object_keys(validated) k where validated->k is distinct from coalesce(previous->k,'""'::jsonb);
 insert into public.account_details(user_id,address,phone,city,country)
 values(target,validated->>'address',validated->>'phone',validated->>'city',validated->>'country')
 on conflict(user_id) do update set address=excluded.address,phone=excluded.phone,city=excluded.city,country=excluded.country,updated_at=now();
 if fields<>'[]'::jsonb then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'ACCOUNT_CONTACT_UPDATED','account_details',target,jsonb_build_object('changed_fields',fields));
 end if;
end $$;
revoke all on function private.validate_account_contact(jsonb),private.write_account_contact(uuid,jsonb) from public,anon,authenticated;

create function private.save_my_account(account_name text,contact jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sesión requerida' using errcode='42501'; end if;
 if account_name is null or length(trim(account_name)) not between 2 and 160 then raise exception 'Nombre inválido' using errcode='22023'; end if;
 perform 1 from public.profiles where id=auth.uid() for update;
 if not found then raise exception 'Cuenta no encontrada' using errcode='42501'; end if;
 update public.profiles set full_name=trim(account_name) where id=auth.uid();
 perform private.write_account_contact(auth.uid(),contact);
end $$;
create function public.save_my_account(account_name text,contact jsonb) returns void
language sql security invoker set search_path='' as $$ select private.save_my_account(account_name,contact) $$;
revoke all on function private.save_my_account(text,jsonb),public.save_my_account(text,jsonb) from public,anon;
grant execute on function private.save_my_account(text,jsonb),public.save_my_account(text,jsonb) to authenticated;

-- Existing reservations remain compatible. The new endpoints bind contact changes to the same Auth transaction.
alter table private.account_mutations add column contact jsonb;
alter table private.account_provisioning add column contact jsonb not null default '{}';
create function private.reserve_account_contact_mutation(target uuid,operation text,account_email text,account_name text,contact jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare reservation uuid; validated jsonb;
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 validated=private.validate_account_contact(contact);
 reservation=private.reserve_account_mutation(target,operation,account_email,account_name);
 update private.account_mutations set contact=validated where id=reservation;
 return reservation;
end $$;
create function public.reserve_account_contact_mutation(target uuid,operation text,account_email text,account_name text,contact jsonb) returns uuid
language sql security invoker set search_path='' as $$ select private.reserve_account_contact_mutation(target,operation,account_email,account_name,contact) $$;
create function private.reserve_account_contact_provisioning(account_email text,account_name text,account_role public.app_role,contact jsonb) returns uuid
language plpgsql security definer set search_path='' as $$
declare reservation uuid; validated jsonb;
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 validated=private.validate_account_contact(contact);
 reservation=private.reserve_account_provisioning(account_email,account_name,account_role);
 update private.account_provisioning set contact=validated where id=reservation;
 return reservation;
end $$;
create function public.reserve_account_contact_provisioning(account_email text,account_name text,account_role public.app_role,contact jsonb) returns uuid
language sql security invoker set search_path='' as $$ select private.reserve_account_contact_provisioning(account_email,account_name,account_role,contact) $$;
revoke all on function private.reserve_account_contact_mutation(uuid,text,text,text,jsonb),public.reserve_account_contact_mutation(uuid,text,text,text,jsonb),private.reserve_account_contact_provisioning(text,text,public.app_role,jsonb),public.reserve_account_contact_provisioning(text,text,public.app_role,jsonb) from public,anon;
grant execute on function private.reserve_account_contact_mutation(uuid,text,text,text,jsonb),public.reserve_account_contact_mutation(uuid,text,text,text,jsonb),private.reserve_account_contact_provisioning(text,text,public.app_role,jsonb),public.reserve_account_contact_provisioning(text,text,public.app_role,jsonb) to authenticated;

-- Validate and lock BEFORE Auth INSERT; consume only AFTER the profile and contact data have been written.
create or replace function private.require_admin_provisioning() returns trigger
language plpgsql security definer set search_path='' as $$
declare reserved private.account_provisioning;
begin
 select p.* into reserved from private.account_provisioning p where p.id=new.id and p.email=lower(new.email)
 and p.expires_at>now() and exists(select 1 from public.profiles where id=p.actor_id and role='SUPER_ADMIN') for update;
 if reserved.id is null then raise exception 'Solo el administrador puede crear cuentas' using errcode='42501'; end if;
 new.raw_app_meta_data:=coalesce(new.raw_app_meta_data,'{}'::jsonb)||jsonb_build_object('provisioned_by',reserved.actor_id,'provisioned_role',reserved.account_role);
 new.raw_user_meta_data:=coalesce(new.raw_user_meta_data,'{}'::jsonb)||jsonb_build_object('full_name',reserved.full_name);
 return new;
end $$;
create or replace function private.bootstrap_profile() returns trigger
language plpgsql security definer set search_path='' as $$
declare reserved private.account_provisioning; previous_sub text; account_role public.app_role='CLIENT'; actor uuid;
begin
 delete from private.account_provisioning p where p.id=new.id and p.email=lower(new.email) and p.expires_at>now()
 and exists(select 1 from public.profiles where id=p.actor_id and role='SUPER_ADMIN') returning p.* into reserved;
 -- Preserve the existing PostgreSQL maintenance contract. GoTrue INSERTs require the reservation in the BEFORE trigger.
 if reserved.id is not null then actor=reserved.actor_id; account_role=reserved.account_role;
 else
  select id into actor from public.profiles where id::text=new.raw_app_meta_data->>'provisioned_by' and role='SUPER_ADMIN';
  if actor is not null and new.raw_app_meta_data->>'provisioned_role' in ('CLIENT','CONSULTANT') then
   account_role=(new.raw_app_meta_data->>'provisioned_role')::public.app_role;
  end if;
 end if;
 insert into public.profiles(id,full_name,role,consultant_enrollment_allowed)
 values(new.id,left(coalesce(new.raw_user_meta_data->>'full_name',''),160),account_role,false);
 previous_sub=current_setting('request.jwt.claim.sub',true);
 if actor is not null then perform set_config('request.jwt.claim.sub',actor::text,true); end if;
 perform private.write_account_contact(new.id,coalesce(reserved.contact,'{}'::jsonb));
 if actor is not null then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(actor,'ADMIN_ACCOUNT_CREATED','profiles',new.id,jsonb_build_object('role',account_role));
 end if;
 perform set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 return new;
end $$;
create or replace function private.apply_account_mutation() returns trigger
language plpgsql security definer set search_path='' as $$
declare reservation private.account_mutations; previous_sub text; subject_name text;
begin
 select * into reservation from private.account_mutations where target=old.id and operation=TG_OP and expires_at>now() for update;
 if reservation.id is null then
  if TG_OP='DELETE' and coalesce(nullif(current_setting('role',true),'none'),session_user::text) not in ('postgres','supabase_admin') then raise exception 'Reserva administrativa requerida' using errcode='42501'; end if;
  return coalesce(new,old);
 end if;
 if not exists(select 1 from public.profiles where id=reservation.actor and role='SUPER_ADMIN') then raise exception 'Administrador no autorizado' using errcode='42501'; end if;
 if TG_OP='UPDATE' and (lower(new.email) is distinct from reservation.email or new.raw_user_meta_data->>'full_name' is distinct from reservation.full_name) then return new; end if;
 if TG_OP='DELETE' and (old.id=reservation.actor or exists(select 1 from public.profiles where id=old.id and role='SUPER_ADMIN')) then raise exception 'Cuenta administrativa protegida' using errcode='42501'; end if;
 previous_sub=current_setting('request.jwt.claim.sub',true);
 perform set_config('request.jwt.claim.sub',reservation.actor::text,true);
 select full_name into subject_name from public.profiles where id=old.id;
 if TG_OP='UPDATE' then
  update public.profiles set full_name=reservation.full_name where id=old.id;
  if reservation.contact is not null then perform private.write_account_contact(old.id,reservation.contact); end if;
 else delete from auth.sessions where user_id=old.id;
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(reservation.actor,'ADMIN_ACCOUNT_'||case TG_OP when 'UPDATE' then 'UPDATED' else 'DELETED' end,'profiles',old.id,jsonb_build_object('subject_name',subject_name,'before_email',old.email,'after_email',case when TG_OP='UPDATE' then new.email else null end));
 delete from private.account_mutations where id=reservation.id;
 perform set_config('request.jwt.claim.sub',coalesce(previous_sub,''),true);
 return coalesce(new,old);
end $$;
create or replace function private.admin_accounts(term text,page_number integer) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare result jsonb; total bigint; needle text=lower(left(trim(coalesce(term,'')),100));
begin
 if not private.is_admin() then raise exception 'No autorizado' using errcode='42501'; end if;
 if page_number is null or page_number<1 or page_number>10000 then raise exception 'Página inválida'; end if;
 select count(*) into total from public.profiles p join auth.users u on u.id=p.id where needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0;
 select coalesce(jsonb_agg(to_jsonb(p) order by p.full_name,p.id),'[]') into result from (
 select p.id,p.full_name,p.role,u.email,d.address,d.phone,d.city,d.country from public.profiles p join auth.users u on u.id=p.id
 join public.account_details d on d.user_id=p.id
 where needle='' or strpos(lower(p.full_name),needle)>0 or strpos(lower(coalesce(u.email,'')),needle)>0
 order by p.full_name,p.id offset (page_number-1)*20 limit 20
 ) p;
 return jsonb_build_object('users',result,'count',total);
end $$;
