-- Pending deletions freeze their notifications, without blocking unrelated work.
create or replace function private.emit_notification(org uuid,event text,title text,message text,event_key text,task uuid default null,finding uuid default null,evidence uuid default null,target uuid default null,managers boolean default false,exclude_actor boolean default true) returns bigint language plpgsql security definer set search_path='' as $$
declare inserted bigint;
begin
 -- Serialize with deletion preparation, including scheduled jobs without an application session.
 perform 1 from public.organizations where id=org for share;
 if exists(select 1 from private.organization_deletions where organization_id=org)
 or exists(select 1 from private.assessment_deletions where assessment_id=private.related_assessment('notifications',jsonb_build_object('task_id',task,'finding_id',finding,'evidence_id',evidence))) then return 0; end if;
 insert into public.notifications(recipient_id,organization_id,event_type,title,message,event_key,task_id,finding_id,evidence_id)
 select distinct m.user_id,org,event,title,message,event_key,task,finding,evidence from public.organization_members m join public.profiles p on p.id=m.user_id
 where m.organization_id=org and (m.user_id=target or (managers and m.role='CONSULTANT' and p.role in ('CONSULTANT','SUPER_ADMIN'))) and (not exclude_actor or m.user_id is distinct from auth.uid())
 on conflict on constraint notifications_recipient_id_event_key_key do nothing;
 get diagnostics inserted=row_count;return inserted;
end $$;
create or replace function private.read_notifications(notification uuid default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'No autorizado' using errcode='42501'; end if;
 -- Ignore frozen branches instead of aborting Mark all for unrelated evaluations.
 update public.notifications n set read_at=now()
 where n.recipient_id=auth.uid() and n.read_at is null and (notification is null or n.id=notification)
 and private.notification_access(n.organization_id,n.task_id,n.evidence_id)
 and not exists(select 1 from private.organization_deletions where organization_id=n.organization_id)
 and not exists(select 1 from private.assessment_deletions where assessment_id=private.related_assessment('notifications',to_jsonb(n)));
end $$;
