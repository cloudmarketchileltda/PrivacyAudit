-- CTA-02: email changes belong exclusively to the reserved administrative operation.
-- A private definer is required to read reservations without exposing them to Auth clients.
create function private.guard_account_email() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- GoTrue self-service writes email_change before confirmation. Reject initiation,
 -- including a new request replacing an old one; allow clearing stale pending data.
 if new.email_change is distinct from old.email_change and coalesce(new.email_change,'')<>'' then
  raise exception 'Solo el administrador puede modificar el correo electrónico' using errcode='42501';
 end if;
 if new.email is distinct from old.email then
  perform 1 from private.account_mutations m
  join public.profiles p on p.id=m.actor and p.role='SUPER_ADMIN'
  where m.target=old.id and m.operation='UPDATE' and m.expires_at>now()
   and m.email=lower(new.email)
   and m.full_name=new.raw_user_meta_data->>'full_name'
  for update of m;
  if not found then
   raise exception 'Reserva administrativa requerida para modificar el correo electrónico' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_account_email() from public,anon,authenticated;
create trigger guard_account_email before update on auth.users
for each row execute function private.guard_account_email();
