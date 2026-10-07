-- Phase 3: organization-scoped processing register, no external integrations.
create type public.processing_tristate as enum ('YES', 'NO', 'UNKNOWN');
create type public.processing_status as enum ('DRAFT', 'ACTIVE', 'ARCHIVED');
create table public.processing_activities (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 name text not null check (length(trim(name)) between 2 and 200),
 area text not null default '' check (length(area)<=200),
 owner text not null default '' check (length(owner)<=200),
 purpose text not null check (length(trim(purpose)) between 2 and 5000),
 data_subject_categories text[] not null check (cardinality(data_subject_categories) between 1 and 6 and data_subject_categories <@ array['CLIENTS','EMPLOYEES','SUPPLIERS','PROSPECTS','VISITORS','OTHER']::text[] and array_position(data_subject_categories,null) is null),
 personal_data_categories text[] not null check (cardinality(personal_data_categories) between 1 and 10 and personal_data_categories <@ array['IDENTIFICATION','CONTACT','FINANCIAL','EMPLOYMENT','LOCATION','BEHAVIOR','HEALTH','BIOMETRIC','OTHER_SENSITIVE','OTHER']::text[] and array_position(personal_data_categories,null) is null),
 sensitive_data public.processing_tristate not null default 'UNKNOWN',
 source text not null default '' check (length(source)<=5000),
 legal_basis text not null default 'UNDETERMINED' check (legal_basis in ('UNDETERMINED','CONSENT','CONTRACT','LEGAL_OBLIGATION','LEGITIMATE_INTEREST','OTHER')),
 legal_basis_details text not null default '' check (length(legal_basis_details)<=5000),
 systems text not null default '' check (length(systems)<=5000),
 recipients text not null default '' check (length(recipients)<=5000),
 processors text not null default '' check (length(processors)<=5000),
 international_transfer public.processing_tristate not null default 'UNKNOWN',
 international_transfer_details text not null default '' check (length(international_transfer_details)<=5000),
 retention_period text not null default '' check (length(retention_period)<=5000),
 retention_criteria text not null default '' check (length(retention_criteria)<=5000),
 security_measures text not null default '' check (length(security_measures)<=5000),
 notes text not null default '' check (length(notes)<=10000),
 status public.processing_status not null default 'DRAFT',
 created_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (international_transfer <> 'YES' or length(trim(international_transfer_details))>0),
 check (legal_basis <> 'OTHER' or length(trim(legal_basis_details))>0)
);
create index processing_activities_org_status_idx on public.processing_activities(organization_id,status);
create index processing_activities_creator_idx on public.processing_activities(created_by);

create function private.protect_processing_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if auth.uid() is null then raise exception 'Autenticación requerida' using errcode='42501'; end if;
  new.created_by=auth.uid(); new.created_at=now(); new.updated_at=now();
 else
  if new.id<>old.id or new.organization_id<>old.organization_id or new.created_by<>old.created_by or new.created_at<>old.created_at then
   raise exception 'Identidad de tratamiento inmutable' using errcode='42501';
  end if;
  new.updated_at=now();
 end if;
 return new;
end $$;
revoke all on function private.protect_processing_identity() from public,anon,authenticated;
create trigger protect_processing_identity before insert or update on public.processing_activities for each row execute function private.protect_processing_identity();
alter table public.processing_activities enable row level security;
revoke all on public.processing_activities from public,anon,authenticated;
grant select,insert,update,delete on public.processing_activities to authenticated;
create policy processing_read on public.processing_activities for select to authenticated using (private.can_read(organization_id));
create policy processing_insert on public.processing_activities for insert to authenticated with check (private.can_manage(organization_id) and exists(select 1 from public.organizations o where o.id=organization_id and o.status='ACTIVE'));
create policy processing_update on public.processing_activities for update to authenticated using (private.can_manage(organization_id) and exists(select 1 from public.organizations o where o.id=organization_id and o.status='ACTIVE')) with check (private.can_manage(organization_id) and exists(select 1 from public.organizations o where o.id=organization_id and o.status='ACTIVE'));
create policy processing_delete on public.processing_activities for delete to authenticated using (private.can_manage(organization_id) and exists(select 1 from public.organizations o where o.id=organization_id and o.status='ACTIVE'));
