import { TaskList } from '@/features/workflow/task-list';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <TaskList params={await searchParams} />;
}
