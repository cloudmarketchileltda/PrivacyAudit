import { FindingList } from '@/features/workflow/finding-list';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <FindingList params={await searchParams} plan />;
}
