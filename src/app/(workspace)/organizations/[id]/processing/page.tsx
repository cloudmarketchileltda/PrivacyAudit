import { ProcessingList } from '@/features/processing/processing-list';
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, filters] = await Promise.all([params, searchParams]);
  return <ProcessingList organizationId={id} params={filters} />;
}
