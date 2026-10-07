-- Cover the full composite FK and organization lookups reported by the advisor.
create index comments_org_time_idx on public.comments(organization_id,created_at);
create index evidence_previous_org_idx on public.evidence(previous_evidence_id,organization_id);
