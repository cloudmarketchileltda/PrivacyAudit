
create type public.assessment_status as enum ('DRAFT','IN_PROGRESS','REVIEW','COMPLETED');
create type public.control_status as enum ('PENDING','CONFORM','PARTIAL','NON_CONFORM','NOT_APPLICABLE');
create type public.severity as enum ('LOW','MEDIUM','HIGH','CRITICAL');
create table public.controls (
 id uuid primary key default gen_random_uuid(), code text not null unique check(length(code) between 2 and 30),
 title text not null check(length(trim(title)) between 2 and 200), description text not null default '', category text not null,
 objective text not null default '', guidance text not null default '', normative_reference text not null default 'Pendiente de revisión jurídica',
 legal_review_status text not null default 'PENDING' check(legal_review_status in ('PENDING','REVIEWED')),
 severity_if_failed public.severity not null default 'MEDIUM', requires_evidence boolean not null default true,
 active boolean not null default true, sort_order integer not null default 0,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.assessments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 name text not null check(length(trim(name)) between 2 and 200), description text not null default '', status public.assessment_status not null default 'DRAFT',
 started_at timestamptz, completed_at timestamptz, consultant_id uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(), unique(id,organization_id)
);
create index assessments_org_idx on public.assessments(organization_id);
create index assessments_consultant_idx on public.assessments(consultant_id);
create table public.assessment_controls (
 id uuid primary key default gen_random_uuid(), assessment_id uuid not null, organization_id uuid not null,
 control_id uuid not null references public.controls(id) on delete restrict, snapshot jsonb not null,
 status public.control_status not null default 'PENDING', auditor_comment text not null default '', client_comment text not null default '',
 evaluated_by uuid references public.profiles(id), evaluated_at timestamptz, applicability_reason text not null default '',
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(assessment_id,organization_id) references public.assessments(id,organization_id) on delete cascade,
 unique(assessment_id,control_id), check(status<>'NOT_APPLICABLE' or length(trim(applicability_reason))>0)
);
create index responses_org_idx on public.assessment_controls(organization_id);
create index responses_control_idx on public.assessment_controls(control_id);
create index responses_evaluator_idx on public.assessment_controls(evaluated_by);
create function private.create_assessment(org uuid,title text,details text) returns uuid language plpgsql security definer set search_path='' as $$
declare assessment uuid;
begin
 if not private.can_manage(org) or not exists(select 1 from public.organizations where id=org and status='ACTIVE') then raise exception 'No autorizado' using errcode='42501'; end if;
 if not exists(select 1 from public.controls where active) then raise exception 'Catálogo vacío'; end if;
 insert into public.assessments(organization_id,name,description,consultant_id) values(org,title,details,auth.uid()) returning id into assessment;
 insert into public.assessment_controls(assessment_id,organization_id,control_id,snapshot)
 select assessment,org,c.id,jsonb_build_object('code',c.code,'title',c.title,'description',c.description,'category',c.category,'objective',c.objective,'guidance',c.guidance,'normative_reference',c.normative_reference,'legal_review_status',c.legal_review_status,'severity_if_failed',c.severity_if_failed,'requires_evidence',c.requires_evidence,'sort_order',c.sort_order) from public.controls c where c.active;
 return assessment;
end $$;
create function public.create_assessment(org uuid,title text,details text default '') returns uuid language sql security invoker set search_path='' as $$ select private.create_assessment(org,title,details) $$;
create function private.guard_assessment() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.organization_id<>old.organization_id or new.consultant_id<>old.consultant_id or new.created_at<>old.created_at then raise exception 'Identidad inmutable'; end if;
 if new.status='COMPLETED' then
 if not exists(select 1 from public.assessment_controls where assessment_id=new.id) or exists(select 1 from public.assessment_controls where assessment_id=new.id and status='PENDING') then raise exception 'Controles pendientes'; end if;
 new.completed_at=coalesce(old.completed_at,now());
 else new.completed_at=null; end if;
 if new.status<>'DRAFT' then new.started_at=coalesce(old.started_at,now()); end if;
 return new;
end $$;
create trigger guard_assessment before update on public.assessments for each row execute function private.guard_assessment();
create function private.guard_response() returns trigger language plpgsql set search_path='' as $$
declare assessment_state public.assessment_status;
begin
 -- Serialize response edits and completion to avoid a concurrent PENDING response after completion.
 select status into assessment_state from public.assessments where id=old.assessment_id for update;
 if not private.can_manage(old.organization_id) then
 if auth.uid() is null or not exists(select 1 from public.organization_members where organization_id=old.organization_id and user_id=auth.uid() and role='CLIENT') or (to_jsonb(new)-'client_comment'-'updated_at') is distinct from (to_jsonb(old)-'client_comment'-'updated_at') then raise exception 'No autorizado' using errcode='42501'; end if;
 return new;
 end if;
 if assessment_state='COMPLETED' then raise exception 'Reabra la evaluación antes de editar'; end if;
 if new.id<>old.id or new.organization_id<>old.organization_id or new.assessment_id<>old.assessment_id or new.control_id<>old.control_id or new.snapshot<>old.snapshot or new.created_at<>old.created_at then raise exception 'Identidad inmutable'; end if;
 new.evaluated_by=case when new.status='PENDING' then null else auth.uid() end;
 new.evaluated_at=case when new.status='PENDING' then null else now() end;
 return new;
end $$;
create trigger guard_response before update on public.assessment_controls for each row execute function private.guard_response();
alter table public.controls enable row level security;
revoke all on public.controls from anon,authenticated;
create trigger touch_controls before update on public.controls for each row execute function private.touch_updated_at();
alter table public.assessments enable row level security;
revoke all on public.assessments from anon,authenticated;
create trigger touch_assessments before update on public.assessments for each row execute function private.touch_updated_at();
alter table public.assessment_controls enable row level security;
revoke all on public.assessment_controls from anon,authenticated;
create trigger touch_assessment_controls before update on public.assessment_controls for each row execute function private.touch_updated_at();

grant select on public.controls,public.assessments,public.assessment_controls to authenticated;
grant insert,update on public.controls to authenticated;
grant update(name,description,status) on public.assessments to authenticated;
grant update(status,auditor_comment,applicability_reason) on public.assessment_controls to authenticated;
create policy controls_read on public.controls for select to authenticated using(active or private.is_admin());
create policy controls_insert on public.controls for insert to authenticated with check(private.is_admin());
create policy controls_update on public.controls for update to authenticated using(private.is_admin()) with check(private.is_admin());
create policy assessments_read on public.assessments for select to authenticated using(private.can_read(organization_id));
create policy assessments_update on public.assessments for update to authenticated using(private.can_manage(organization_id)) with check(private.can_manage(organization_id));
create policy responses_read on public.assessment_controls for select to authenticated using(private.can_read(organization_id));
create policy responses_update on public.assessment_controls for update to authenticated using(private.can_manage(organization_id)) with check(private.can_manage(organization_id));
revoke all on function private.create_assessment(uuid,text,text),private.guard_assessment(),private.guard_response() from public,anon,authenticated;
grant execute on function private.create_assessment(uuid,text,text) to authenticated;
revoke all on function public.create_assessment(uuid,text,text) from public,anon;
grant execute on function public.create_assessment(uuid,text,text) to authenticated;

alter table public.controls add constraint control_text_limits check(length(description)<=5000 and length(category) between 2 and 200 and length(objective)<=3000 and length(guidance)<=10000 and length(normative_reference)<=5000 and sort_order between 0 and 10000);
alter table public.assessments add constraint assessment_description_limit check(length(description)<=5000);
alter table public.assessment_controls add constraint response_text_limits check(length(auditor_comment)<=10000 and length(client_comment)<=10000 and length(applicability_reason)<=2000);

create function private.touch_assessment_activity() returns trigger language plpgsql set search_path='' as $$
begin update public.assessments set status=status where id=new.assessment_id;return new;end $$;
create trigger touch_parent after update on public.assessment_controls for each row execute function private.touch_assessment_activity();
revoke execute on function private.touch_assessment_activity() from public,anon,authenticated;

create function private.update_client_comment(response_id uuid,comment_text text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.assessment_controls r join public.organization_members m on m.organization_id=r.organization_id where r.id=response_id and m.user_id=auth.uid() and m.role='CLIENT') then raise exception 'No autorizado' using errcode='42501'; end if;
 if comment_text is null or length(comment_text)>10000 then raise exception 'Comentario inválido'; end if;
 update public.assessment_controls set client_comment=comment_text where id=response_id;
end $$;
create function public.update_client_comment(response_id uuid,comment_text text) returns void language sql security invoker set search_path='' as $$ select private.update_client_comment(response_id,comment_text) $$;
revoke execute on function private.update_client_comment(uuid,text),public.update_client_comment(uuid,text) from public,anon;
grant execute on function private.update_client_comment(uuid,text),public.update_client_comment(uuid,text) to authenticated;
