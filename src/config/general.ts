/**
 * Configuración general pública de PrivacyAudit.
 * Se importa en servidor y navegador: nunca agregar secretos ni credenciales.
 * Consulte docs/system-and-business-rules.md antes de modificarla.
 */
// Cada color se define una vez; las variantes semánticas lo reutilizan.
const actionStyles = {
  general: 'bg-blue-700 text-white hover:bg-blue-800',
  modify: 'bg-green-700 text-white hover:bg-green-800',
  remove: 'bg-red-700 text-white hover:bg-red-800',
} as const;

export const generalConfig = {
  buttons: {
    // Azul: acción general / rol. Verde: edición / guardado. Rojo: eliminación.
    variants: {
      default: actionStyles.general,
      role: actionStyles.general,
      edit: actionStyles.modify,
      destructive: actionStyles.remove,
      outline: 'border border-slate-300 bg-white hover:bg-slate-50',
      ghost: 'hover:bg-slate-100',
    },
    sizes: {
      default: 'h-10 px-4',
      sm: 'h-8 px-3',
      lg: 'h-12 px-6',
      icon: 'h-9 w-9 shrink-0',
    },
    defaultVariant: 'default',
    defaultSize: 'default',
    formVariant: 'edit',
  },
  grids: {
    // Las RPC admin_accounts, admin_membership_users y dashboard_summary también
    // paginan de 20 en SQL. Cambiar pageSize exige una migración coordinada de esas RPC.
    pageSize: 20,
    maxPageNumber: 10000,
    // Altura del viewport, independiente del número de resultados por página.
    visibleRows: 10,
    headerHeightRem: 2.75,
    accounts: { rowHeightRem: 4, minWidth: '760px' },
    audit: { rowHeightRem: 4, minWidth: '1150px' },
  },
  search: { maxLength: 100 },
} as const;

/** Altura exacta del encabezado y de las filas visibles; calculada sin multiplicar variables CSS. */
export function gridViewportHeight(kind: 'accounts' | 'audit') {
  const grids = generalConfig.grids;
  return `${grids.headerHeightRem + grids.visibleRows * grids[kind].rowHeightRem}rem`;
}

/** Variables heredadas por las grillas desde el layout, sin duplicar valores en CSS. */
export const gridCssVariables = {
  '--grid-visible-rows': generalConfig.grids.visibleRows,
  '--grid-header-height': `${generalConfig.grids.headerHeightRem}rem`,
  '--accounts-row-height': `${generalConfig.grids.accounts.rowHeightRem}rem`,
  '--accounts-viewport-height': gridViewportHeight('accounts'),
  '--audit-viewport-height': gridViewportHeight('audit'),
  '--accounts-min-width': generalConfig.grids.accounts.minWidth,
  '--audit-row-height': `${generalConfig.grids.audit.rowHeightRem}rem`,
  '--audit-min-width': generalConfig.grids.audit.minWidth,
};

/** Rango inclusivo usado por Supabase .range(); Pagination usa el mismo pageSize. */
export function pageRange(page: number): [number, number] {
  const start = (page - 1) * generalConfig.grids.pageSize;
  return [start, start + generalConfig.grids.pageSize - 1];
}
