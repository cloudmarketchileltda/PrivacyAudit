-- Keep authorization identical and evaluate the current user once per statement.
alter policy profiles_read on public.profiles using (
 id=(select auth.uid()) or (select private.is_admin()) or exists(
 select 1 from public.organization_members m where m.user_id=profiles.id and private.can_manage(m.organization_id)
 ));
alter policy profiles_update on public.profiles using(id=(select auth.uid())) with check(id=(select auth.uid()));
alter policy members_read on public.organization_members using(user_id=(select auth.uid()) or private.can_manage(organization_id));
-- Cover the complete composite foreign key used for assessment responses.
create index responses_assessment_org_idx on public.assessment_controls(assessment_id,organization_id);
