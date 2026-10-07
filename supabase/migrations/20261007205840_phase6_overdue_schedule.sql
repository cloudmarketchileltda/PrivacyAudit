-- PGlite has no pg_cron. Hosted PostgreSQL installs and schedules the real worker.
do $$ begin
 if exists(select 1 from pg_available_extensions where name='pg_cron') then
  create extension if not exists pg_cron;
  perform cron.schedule('privacyaudit-overdue-notifications','*/15 * * * *','select private.run_due_notifications();');
 end if;
end $$;
