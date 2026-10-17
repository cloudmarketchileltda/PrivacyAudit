import { redirect } from 'next/navigation';
import { generalConfig } from '@/config/general';
import { isConfigured } from '@/lib/config';
export default function Home() {
  redirect(isConfigured() ? generalConfig.site.workspaceHomeHref : '/setup');
}
