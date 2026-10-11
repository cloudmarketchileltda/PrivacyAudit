-- Read-only verification against current memberships; no account/business mutations.
begin transaction read only;
do $$
declare p record; result jsonb; expected_org uuid; expected_tasks bigint; expected_mine bigint;
begin
 for p in select id from public.profiles where role='CLIENT' loop
  select organization_id into expected_org from public.organization_members where user_id=p.id and role='CLIENT';
  if expected_org is not null and not exists(select 1 from private.organization_deletions where organization_id=expected_org) then
   select count(*),count(*) filter(where t.assigned_to=p.id) into expected_tasks,expected_mine
   from public.tasks t join public.findings f on f.id=t.finding_id join public.assessments a on a.id=f.assessment_id
   where t.organization_id=expected_org and not exists(select 1 from private.assessment_deletions d where d.assessment_id=a.id);
  else expected_org=null;
  end if;
  perform set_config('request.jwt.claim.sub',p.id::text,true);
  execute 'set local role authenticated';
  select public.client_organization_dashboard() into result;
  execute 'reset role';
  if expected_org is null then
   if result is not null then raise exception 'Unexpected client organization'; end if;
  else
   if (result->'organization'->>'id')::uuid is distinct from expected_org
    or (result->'tasks'->>'total')::bigint is distinct from expected_tasks
    or (result->'tasks'->>'mine_total')::bigint is distinct from expected_mine then raise exception 'Client aggregate mismatch'; end if;
  end if;
 end loop;
 for p in select id from public.profiles where role in ('CONSULTANT','SUPER_ADMIN') loop
  perform set_config('request.jwt.claim.sub',p.id::text,true);
  execute 'set local role authenticated';
  begin
   perform public.client_organization_dashboard();
   raise exception 'Unexpected manager access';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
 end loop;
 if has_function_privilege('anon','public.client_organization_dashboard()','EXECUTE') then raise exception 'Unexpected anon grant'; end if;
end $$;
select 'client_dashboard_readonly_ok_rolled_back' as result;
rollback;
