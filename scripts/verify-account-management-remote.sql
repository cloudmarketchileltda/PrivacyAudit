-- Administrative RPC checks only; no real account is edited or deleted.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='SUPER_ADMIN' order by id limit 1),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
do $$ declare accounts jsonb; reservation uuid; begin
 accounts=public.admin_accounts('',1);
 if jsonb_array_length(accounts->'users')>20 or (accounts->>'count')::integer<1 then raise exception 'Grilla incorrecta'; end if;
 begin
  perform 1 from private.account_mutations;
  raise exception 'Se permitió leer reservas';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.reserve_account_mutation(auth.uid(),'DELETE',null,null);
  raise exception 'Se permitió eliminar administrador';
 exception when insufficient_privilege then null;
 end;
 reservation=public.reserve_account_mutation(auth.uid(),'UPDATE','management-check@example.test','Verificación temporal');
 if public.account_mutation_completed(reservation) then raise exception 'Reserva declarada consumida antes de Auth'; end if;
 perform public.cancel_account_mutation(reservation);
 if not public.account_mutation_completed(reservation) then raise exception 'Reserva no cancelada'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role<>'SUPER_ADMIN' order by id limit 1),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 begin
  perform public.admin_accounts('',1);
  raise exception 'Se permitió acceso no administrativo';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.reserve_account_mutation(auth.uid(),'UPDATE','management-check@example.test','Verificación temporal');
  raise exception 'Se permitió reserva no administrativa';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
do $$ begin
 if not (select relrowsecurity from pg_class where oid='private.account_mutations'::regclass) then raise exception 'RLS deshabilitado'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('admin_accounts','reserve_account_mutation','cancel_account_mutation','account_mutation_completed') and (p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE') or not has_function_privilege('authenticated',p.oid,'EXECUTE'))) then raise exception 'Grants o SECURITY incorrectos'; end if;
end $$;
select 'PASS: account grid, admin reservation/cancellation, private-table denial, protected admin deletion and non-admin denial; rollback' as result;
rollback;
