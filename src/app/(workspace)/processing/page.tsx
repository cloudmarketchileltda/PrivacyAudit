import { ProcessingList } from '@/features/processing/processing-list';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <ProcessingList params={await searchParams} />;
}
