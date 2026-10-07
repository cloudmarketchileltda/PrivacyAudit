-- Audit history must not itself prevent deletion of an otherwise unused Auth account.
alter table public.audit_logs add column actor_ref uuid;
update public.audit_logs set actor_ref=actor_id;
alter table public.audit_logs drop constraint audit_logs_actor_id_fkey;
alter table public.audit_logs add constraint audit_logs_actor_id_fkey foreign key(actor_id) references public.profiles(id) on delete set null;
create index audit_logs_actor_ref_idx on public.audit_logs(actor_ref);
create or replace function private.audit_snapshot() returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.organization_ref=coalesce(new.organization_ref,new.organization_id);
 new.actor_ref=coalesce(new.actor_ref,new.actor_id);
 if new.organization_name='' then
  select legal_name into new.organization_name from public.organizations where id=new.organization_id;
  if new.organization_name is null and new.organization_ref is not null then
   select organization_name into new.organization_name from public.audit_logs where organization_ref=new.organization_ref and organization_name<>'' order by created_at desc,id limit 1;
  end if;
 end if;
 new.organization_name=coalesce(new.organization_name,'');
 select full_name,role::text into new.actor_name,new.actor_role from public.profiles where id=new.actor_id;
 if new.actor_id is not null and new.actor_name is null then
  select actor_name,actor_role into new.actor_name,new.actor_role from public.audit_logs where actor_ref=new.actor_ref order by created_at desc,id limit 1;
  new.actor_id=null;
 end if;
 new.actor_name=coalesce(new.actor_name,'Sistema');new.actor_role=coalesce(new.actor_role,'SYSTEM');
 return new;
end $$;
-- Auth knows the account subject. Only a confirmed sign-in proves that subject was the actor.
create or replace function private.audit_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if TG_OP='INSERT' then
  insert into public.audit_logs(action,entity_type,entity_id,metadata) values('AUTH_ACCOUNT_CREATED','authentication',new.id,jsonb_build_object('source','auth.users','subject_ref',new.id));
 else
  if new.last_sign_in_at is distinct from old.last_sign_in_at and new.last_sign_in_at is not null then
   insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(new.id,'AUTH_SIGN_IN','authentication',new.id,jsonb_build_object('source','auth.users','subject_ref',new.id));
  end if;
  if new.encrypted_password is distinct from old.encrypted_password then
   insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'AUTH_CREDENTIAL_UPDATED','authentication',new.id,jsonb_build_object('source','auth.users','subject_ref',new.id));
  end if;
 end if;
 return new;
end $$;
create or replace function private.audit_auth_session_end() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata) values(auth.uid(),'AUTH_SESSION_ENDED','authentication',old.id,jsonb_build_object('source','auth.sessions','subject_ref',old.user_id));
 return old;
end $$;
