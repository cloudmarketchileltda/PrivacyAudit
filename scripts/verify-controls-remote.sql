-- Identified PrivacyAudit project only. Temporary rows and mutations are rolled back.
-- SQL permissions/FK verification; does not issue Auth JWTs or manipulate real Storage blobs.
begin;
select set_config('catalog_test.admin',gen_random_uuid()::text,true);
select set_config('catalog_test.consultant',gen_random_uuid()::text,true);
select set_config('catalog_test.code','TEST-'||substr(gen_random_uuid()::text,1,15),true);
select set_config('catalog_test.rut1',(select n::text||'-'||d from generate_series(99006000,99006100) n cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1),true);
select set_config('catalog_test.rut2',(select n::text||'-'||d from generate_series(99006200,99006300) n cross join unnest(array['0','1','2','3','4','5','6','7','8','9','K']) d where private.valid_rut(n::text||'-'||d) and not exists(select 1 from public.organizations where rut=n::text||'-'||d) limit 1),true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) select current_setting('catalog_test.'||actor)::uuid,current_setting('catalog_test.'||actor)||'@example.test',now(),'{"full_name":"Temporary catalog check"}'::jsonb from unnest(array['admin','consultant']) actor;
update public.profiles set role='SUPER_ADMIN' where id=current_setting('catalog_test.admin')::uuid;
update public.profiles set role='CONSULTANT' where id=current_setting('catalog_test.consultant')::uuid;
select set_config('request.jwt.claim.sub',current_setting('catalog_test.admin'),true);
set local role authenticated;
with row as (insert into public.controls(code,title,category) values(current_setting('catalog_test.code'),'Temporary original control','Gobierno') returning id) select set_config('catalog_test.control',(select id::text from row),true);
select set_config('catalog_test.a',public.create_organization(jsonb_build_object('legal_name','Temporary catalog org A','rut',current_setting('catalog_test.rut1')))::text,true);
select set_config('catalog_test.b',public.create_organization(jsonb_build_object('legal_name','Temporary catalog org B','rut',current_setting('catalog_test.rut2')))::text,true);
select public.create_assessment(current_setting('catalog_test.a')::uuid,'Temporary A');
select public.create_assessment(current_setting('catalog_test.b')::uuid,'Temporary B');
update public.controls set title='Temporary updated control',active=false where id=current_setting('catalog_test.control')::uuid;
do $$ begin
 if exists(select 1 from public.assessment_controls where control_id=current_setting('catalog_test.control')::uuid and snapshot->>'title'<>'Temporary original control') then raise exception 'Snapshot changed'; end if;
 begin delete from public.controls where id=current_setting('catalog_test.control')::uuid; raise exception 'Applied deletion allowed' using errcode='P0002'; exception when sqlstate '23503' or sqlstate '23001' then null; end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('catalog_test.consultant'),true);
do $$ begin
 if exists(select 1 from public.controls) then raise exception 'Nonadmin catalog read'; end if;
 delete from public.controls where id=current_setting('catalog_test.control')::uuid;
 if found then raise exception 'Nonadmin catalog deletion'; end if;
 update public.controls set title='Unauthorized' where id=current_setting('catalog_test.control')::uuid;
 if found then raise exception 'Nonadmin catalog modification'; end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('catalog_test.admin'),true);
update public.organizations set status='ARCHIVED' where id=current_setting('catalog_test.a')::uuid;
select public.prepare_organization_deletion(current_setting('catalog_test.a')::uuid,'ELIMINAR ORGANIZACION');
select public.finish_organization_deletion(current_setting('catalog_test.a')::uuid);
do $$ begin
 if exists(select 1 from public.assessment_controls where organization_id=current_setting('catalog_test.a')::uuid) then raise exception 'Applied copies retained'; end if;
 if not exists(select 1 from public.assessment_controls where organization_id=current_setting('catalog_test.b')::uuid and control_id=current_setting('catalog_test.control')::uuid) then raise exception 'Other organization changed'; end if;
 begin delete from public.controls where id=current_setting('catalog_test.control')::uuid; raise exception 'Shared applied deletion allowed' using errcode='P0002'; exception when sqlstate '23503' or sqlstate '23001' then null; end;
end $$;
select public.prepare_organization_deletion(current_setting('catalog_test.b')::uuid,'ELIMINAR ORGANIZACION');
select public.finish_organization_deletion(current_setting('catalog_test.b')::uuid);
do $$ begin
 delete from public.controls where id=current_setting('catalog_test.control')::uuid;
 if not found then raise exception 'Unused deletion denied'; end if;
end $$;
select 'catalog_permissions_usage_guard_and_organization_priority_ok_rolled_back' as verification;
rollback;
