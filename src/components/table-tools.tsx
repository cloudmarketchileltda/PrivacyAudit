import { generalConfig } from '@/config/general';
import Link from 'next/link';
import { Button } from './ui/button';
export function Pagination({
  page,
  count,
  pageSize = generalConfig.grids.pageSize,
  pageParam = 'page',
  path,
  params,
}: {
  page: number;
  count: number;
  pageSize?: number;
  pageParam?: string;
  path: string;
  params: Record<string, string | undefined>;
}) {
  const total = Math.max(1, Math.ceil(count / pageSize));
  const href = (n: number) =>
    `${path}?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined)) as Record<string, string>), [pageParam]: String(n) })}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-slate-500">
        {count} registros · Página {page} de {total}
      </p>
      <div className="flex gap-2">
        {page > 1 && (
          <Button variant="outline" asChild>
            <Link href={href(page - 1)}>Anterior</Link>
          </Button>
        )}
        {page < total && (
          <Button variant="outline" asChild>
            <Link href={href(page + 1)}>Siguiente</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
export function pageNumber(value?: string) {
  return Math.max(
    1,
    Math.min(generalConfig.grids.maxPageNumber, Number.parseInt(value || '1', 10) || 1),
  );
}
export function searchTerm(value?: string) {
  return (value || '')
    .replace(/[%_,()\\]/g, ' ')
    .trim()
    .slice(0, generalConfig.search.maxLength);
}
