-- Validate new finding assignments without rewriting historical assignments.
-- Task assignments retain their existing contract.
create function private.guard_finding_client_assignee() returns trigger
-- Private trigger privileges are limited to locking the canonical role/membership.
-- Callers have SELECT but deliberately no direct UPDATE grant on memberships.
language plpgsql security definer set search_path='' as $$
begin
 if new.assigned_to is null then return new; end if;
 if TG_OP='UPDATE' and new.assigned_to is not distinct from old.assigned_to then return new; end if;
 if auth.uid() is null or not private.can_manage(new.organization_id) then
  raise exception 'Asignación no autorizada' using errcode='42501';
 end if;
 -- Locks coordinate with membership removal/role changes until this write commits.
 perform 1 from public.organization_members m join public.profiles p on p.id=m.user_id
 where m.organization_id=new.organization_id and m.user_id=new.assigned_to
 and m.role='CLIENT' and p.role='CLIENT' for share of m,p;
 if not found then
  raise exception 'El responsable del hallazgo debe ser un cliente de la misma organización'
   using errcode='23514';
 end if;
 return new;
end $$;
create trigger guard_finding_client_assignee before insert or update of assigned_to on public.findings
for each row execute function private.guard_finding_client_assignee();
revoke all on function private.guard_finding_client_assignee() from public,anon,authenticated;
