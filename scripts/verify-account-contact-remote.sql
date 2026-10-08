-- SQL authorization contexts and rollback only: not GoTrue, issued sessions or email delivery.
begin;
select set_config('privacyaudit.contact.admin',(select id::text from public.profiles where role='SUPER_ADMIN' order by id limit 1),true);
do $$ begin
 if coalesce(current_setting('privacyaudit.contact.admin'),'')='' then raise exception 'Administrador requerido'; end if;
 if exists(select 1 from auth.users where id='f1000000-0000-4000-8000-000000000001' or email='account-contact-rollback@example.test') then raise exception 'Fixture ya existente'; end if;
 if exists(select 1 from public.profiles p where not exists(select 1 from public.account_details d where d.user_id=p.id)) then raise exception 'Cuenta sin contacto inicial'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.contact.admin'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
select set_config('privacyaudit.contact.new',public.reserve_account_contact_provisioning('account-contact-rollback@example.test','Cuenta de prueba de contacto','CLIENT','{"address":"Dirección temporal","phone":"+56 9 1111 1111","city":"Santiago","country":"Chile"}')::text,true);
reset role;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
values(current_setting('privacyaudit.contact.new')::uuid,'account-contact-rollback@example.test',now(),'{"full_name":"Nombre inicial"}','{}');
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data)
values('f1000000-0000-4000-8000-000000000001','contact-other-rollback@example.test',now(),'{"full_name":"Otra cuenta temporal"}',jsonb_build_object('provisioned_by',current_setting('privacyaudit.contact.admin'),'provisioned_role','CONSULTANT'));
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.contact.new'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
 if (select city from public.account_details where user_id=auth.uid())<>'Santiago' then raise exception 'Alta perdió contacto'; end if;
 perform public.save_my_account('Nombre actualizado','{"address":"Dirección actualizada","phone":"+56 9 2222 2222","city":"Valparaíso","country":"Chile"}');
 begin perform public.save_my_account('Debe revertir',jsonb_build_object('city',repeat('x',121))); raise exception 'Contacto inválido aceptado'; exception when sqlstate '22023' then null; end;
 if (select full_name from public.profiles where id=auth.uid())<>'Nombre actualizado' then raise exception 'Guardado no atómico'; end if;
 if exists(select 1 from public.account_details where user_id='f1000000-0000-4000-8000-000000000001') then raise exception 'Lectura ajena permitida'; end if;
 begin update public.account_details set city='Invasión' where user_id=auth.uid(); raise exception 'Escritura directa permitida'; exception when insufficient_privilege then null; end;
 begin perform public.reserve_account_contact_mutation(auth.uid(),'UPDATE','other@example.test','No autorizado','{}'); raise exception 'Reserva no administrativa permitida'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.account_details where user_id=current_setting('privacyaudit.contact.new')::uuid) then raise exception 'Consultor leyó contacto ajeno'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('privacyaudit.contact.admin'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text,true);
do $$ declare reservation uuid; begin
 if not exists(select 1 from public.account_details where user_id=current_setting('privacyaudit.contact.new')::uuid and city='Valparaíso') then raise exception 'Administrador sin acceso'; end if;
 reservation=public.reserve_account_contact_mutation(current_setting('privacyaudit.contact.new')::uuid,'UPDATE','changed-contact-rollback@example.test','Nombre administrativo','{"city":"Concepción","country":"Chile"}');
 perform set_config('privacyaudit.contact.reservation',reservation::text,true);
end $$;
reset role;
update auth.users set email='changed-contact-rollback@example.test',raw_user_meta_data='{"full_name":"Nombre administrativo"}' where id=current_setting('privacyaudit.contact.new')::uuid;
do $$ begin
 if exists(select 1 from private.account_mutations where id=current_setting('privacyaudit.contact.reservation')::uuid) then raise exception 'Reserva no consumida'; end if;
 if (select city from public.account_details where user_id=current_setting('privacyaudit.contact.new')::uuid)<>'Concepción' then raise exception 'Edición perdió contacto'; end if;
 if exists(select 1 from public.audit_logs where entity_type='account_details' and entity_id=current_setting('privacyaudit.contact.new')::uuid and metadata::text like '%Dirección%') then raise exception 'Auditoría contiene dirección'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('save_my_account','reserve_account_contact_mutation','reserve_account_contact_provisioning') and (p.prosecdef or has_function_privilege('anon',p.oid,'EXECUTE') or not has_function_privilege('authenticated',p.oid,'EXECUTE'))) then raise exception 'Funciones inseguras'; end if;
end $$;
delete from auth.users where id=current_setting('privacyaudit.contact.new')::uuid;
do $$ begin
 if exists(select 1 from public.account_details where user_id=current_setting('privacyaudit.contact.new')::uuid) then raise exception 'Contacto no eliminado por cascada'; end if;
end $$;
select 'PASS: contact provisioning, private reads, own save, rollback, admin reservation/edit, cascade and grants; all fixtures rolled back' as result;
rollback;
