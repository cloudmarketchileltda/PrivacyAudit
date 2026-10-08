import { redirect, notFound } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
export default async function Page() {
  const { profile } = await requireUser();
  if (profile.role !== 'SUPER_ADMIN') notFound();
  redirect('/administration/organizations/new');
}
