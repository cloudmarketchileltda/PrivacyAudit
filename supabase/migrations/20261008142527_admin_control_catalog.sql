-- Catalog administration is exclusive to SUPER_ADMIN. Historical copies remain visible through assessments.
alter policy controls_read on public.controls using(private.is_admin());
grant delete on public.controls to authenticated;
create policy controls_delete on public.controls for delete to authenticated using(private.is_admin());
-- The existing RESTRICT FK is authoritative, including inactive controls and concurrent assessment creation.
comment on constraint assessment_controls_control_id_fkey on public.assessment_controls is
 'CAT-02: a catalog control cannot be deleted while applied in any organization. This protects the catalog row, not removal of organization-owned assessment copies.';
comment on function private.finish_organization_deletion(uuid) is
 'ORG-04 takes precedence over all conservation/deletion restrictions for organization-owned data. Delete every related row and file; do not remove shared accounts or global catalog definitions. Storage API cleanup precedes SQL finalization.';
