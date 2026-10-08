import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/queries';
export default async function Page() {
  await requireUser();
  redirect('/dashboard');
}
