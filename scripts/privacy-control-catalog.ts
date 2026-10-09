import { readFile, readdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export interface CatalogEntry {
  code: string;
  title: string;
  category: string;
  severity_if_failed: 'MEDIUM' | 'HIGH';
  nature: 'GESTION' | 'MIXTO' | 'OBLIGACION' | 'CONDICIONAL';
  current_articles: string;
  future_articles: string;
  scope: string;
  criteria: string[];
  evidence: string;
  verification: string;
}
export interface Catalog {
  reviewed_at: string;
  effective_from: string;
  current_source: string;
  future_source: string;
  amendment_source: string;
  controls: CatalogEntry[];
}
const natureLabels = {
  GESTION:
    'Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal.',
  MIXTO:
    'Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución.',
  OBLIGACION:
    'Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa.',
  CONDICIONAL:
    'Exigencia condicionada al tratamiento y a los supuestos legales; documentar su aplicabilidad antes de evaluar.',
};
export const originalGuidance =
  'Solicitar antecedentes al responsable, revisar documentación disponible y registrar alcance, limitaciones y observaciones. La aplicabilidad y el análisis jurídico requieren revisión profesional.';
export const originalReference =
  'Pendiente de revisión jurídica. Validar normativa aplicable y referencias específicas antes de utilizar este control como criterio jurídico.';
export function originalDescription(title: string) {
  return `Revisar cómo la organización gestiona ${title.toLowerCase()} y registrar los antecedentes observados.`;
}
export function originalObjective(title: string) {
  return `Documentar el estado de ${title.toLowerCase()}.`;
}
export function expandedControl(catalog: Catalog, entry: CatalogEntry, index: number) {
  return {
    code: entry.code,
    title: entry.title,
    description: `Alcance\n${entry.scope}\n\nCumplimiento esperado del control\n${entry.criteria.map((criterion, i) => `${i + 1}. ${criterion}.`).join('\n')}\n\nNaturaleza y aplicabilidad\n${natureLabels[entry.nature]} Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.`,
    category: entry.category,
    objective: entry.scope,
    guidance: `Evidencias sugeridas\n${entry.evidence}\n\nCómo verificar\n${entry.verification}\n\nCriterio de evaluación\nContrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.`,
    normative_reference: `Revisión de fuentes: ${catalog.reviewed_at}. Referencia orientativa pendiente de validación jurídica profesional.\n\nHasta el 30 de noviembre de 2026: Ley 19.628, artículos ${entry.current_articles} (antecedentes aplicables; no todos equivalen al criterio operativo completo).\n${catalog.current_source}\n\nDesde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos ${entry.future_articles}.\n${catalog.future_source}\n\nVigencia de la reforma: artículo primero transitorio de Ley 21.719.\n${catalog.amendment_source}\n\nVerificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.`,
    legal_review_status: 'PENDING' as const,
    severity_if_failed: entry.severity_if_failed,
    requires_evidence: true,
    active: true,
    sort_order: index + 1,
  };
}
const sql = (value: string | boolean | number) =>
  typeof value === 'string' ? `'${value.replaceAll("'", "''")}'` : String(value);
export function seedSQL(catalog: Catalog) {
  const rows = catalog.controls.map((entry, index) =>
    Object.values(expandedControl(catalog, entry, index))
      .map(sql)
      .join(','),
  );
  return `-- Generado desde docs/catalog/privacy-controls.json por scripts/privacy-control-catalog.ts.\n-- Catálogo orientativo, revisión jurídica PENDING; las evaluaciones conservan sus snapshots.\ninsert into public.controls(code,title,description,category,objective,guidance,normative_reference,legal_review_status,severity_if_failed,requires_evidence,active,sort_order) values\n${rows.map((row) => `(${row})`).join(',\n')}\non conflict(code) do nothing;\n`;
}
export function migrationSQL(catalog: Catalog) {
  const rows = catalog.controls.map((entry, index) => {
    const expanded = expandedControl(catalog, entry, index);
    return [
      entry.code,
      entry.title,
      originalDescription(entry.title),
      originalObjective(entry.title),
      expanded.description,
      expanded.objective,
      expanded.guidance,
      expanded.normative_reference,
    ]
      .map(sql)
      .join(',');
  });
  return `-- Revisión del catálogo inicial de 52 controles. No modifica snapshots ni definiciones personalizadas.\n-- Fuentes y criterios: docs/catalog/privacy-controls.json y docs/references/control-catalog.md.\n-- Solo sustituir el conjunto de textos originales sin revisión jurídica; conservar identidad y configuración.\nwith content(code,title,old_description,old_objective,description,objective,guidance,normative_reference) as (values\n${rows.map((row) => `(${row})`).join(',\n')}\n)\nupdate public.controls as c\nset description=v.description, objective=v.objective, guidance=v.guidance, normative_reference=v.normative_reference\nfrom content as v\nwhere c.code=v.code and c.title=v.title\n  and c.description=v.old_description and c.objective=v.old_objective\n  and c.guidance=${sql(originalGuidance)}\n  and c.normative_reference=${sql(originalReference)}\n  and c.legal_review_status='PENDING';\n`;
}
// Herramienta editorial para esta revisión. No regenerar una migración ya aplicada con contenido nuevo:
// una revisión posterior requiere una nueva migración y conservar el historial publicado.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const catalog: Catalog = JSON.parse(await readFile('docs/catalog/privacy-controls.json', 'utf8'));
  const migrations = (await readdir('supabase/migrations')).filter((name) =>
    name.endsWith('_enrich_privacy_control_catalog.sql'),
  );
  if (migrations.length !== 1) throw new Error('Se requiere una única migración de esta revisión.');
  const outputs = [
    ['supabase/seed.sql', seedSQL(catalog)],
    [`supabase/migrations/${migrations[0]}`, migrationSQL(catalog)],
  ];
  for (const [path, content] of outputs) {
    if (process.argv.includes('--check')) {
      if ((await readFile(path, 'utf8')) !== content)
        throw new Error(`Contenido desincronizado: ${path}`);
    } else {
      await writeFile(path, content);
    }
  }
  console.log(
    `Catálogo: ${catalog.controls.length} controles; seed y migración ${process.argv.includes('--check') ? 'sincronizados' : 'generados'}.`,
  );
}
