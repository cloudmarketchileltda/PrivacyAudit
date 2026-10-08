-- Read/transactional RPC checks only. Management SQL cannot impersonate
-- supabase_auth_admin; insertion order is tested in PGlite and must also be
-- confirmed with a real Auth Admin request from the application.
begin;
select set_config('request.jwt.claim.sub',(select id::text from public.profiles where role='SUPER_ADMIN' order by id limit 1),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
select set_config('privacyaudit.test_reservation',public.reserve_account_provisioning('provisioning-check@example.test','Verificación temporal','CLIENT')::text,true);
do $$ begin
 begin
  perform 1 from private.account_provisioning;
  raise exception 'Se permitió leer reservas';
 exception when insufficient_privilege then null;
 end;
 begin
  perform public.reserve_account_provisioning('provisioning-check@example.test','Verificación temporal','SUPER_ADMIN');
  raise exception 'Se permitió reservar SUPER_ADMIN';
 exception when invalid_parameter_value then null;
 end;
end $$;
reset role;
do $$ begin
 if not exists(select 1 from private.account_provisioning where id=current_setting('privacyaudit.test_reservation')::uuid and actor_id=current_setting('request.jwt.claim.sub')::uuid and account_role='CLIENT') then raise exception 'Reserva incorrecta'; end if;
end $$;
set local role authenticated;
select public.cancel_account_provisioning(current_setting('privacyaudit.test_reservation')::uuid);
reset role;
do $$ begin
 if exists(select 1 from private.account_provisioning where id=current_setting('privacyaudit.test_reservation')::uuid) then raise exception 'Reserva no cancelada'; end if;
end $$;
select 'PASS: admin reservation/cancellation, private table denied and SUPER_ADMIN creation denied; rollback' as result;
rollback;
