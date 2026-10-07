import { z } from '@/lib/validation';
export const subjectLabels = {
  CLIENTS: 'Clientes',
  EMPLOYEES: 'Trabajadores',
  SUPPLIERS: 'Proveedores',
  PROSPECTS: 'Prospectos',
  VISITORS: 'Visitantes',
  OTHER: 'Otros',
} as const;
export const dataLabels = {
  IDENTIFICATION: 'Identificación',
  CONTACT: 'Contacto',
  FINANCIAL: 'Financieros',
  EMPLOYMENT: 'Laborales',
  LOCATION: 'Ubicación',
  BEHAVIOR: 'Comportamiento',
  HEALTH: 'Salud',
  BIOMETRIC: 'Biométricos',
  OTHER_SENSITIVE: 'Otros datos sensibles',
  OTHER: 'Otros',
} as const;
export const basisLabels = {
  UNDETERMINED: 'No determinada',
  CONSENT: 'Consentimiento',
  CONTRACT: 'Contrato',
  LEGAL_OBLIGATION: 'Obligación legal',
  LEGITIMATE_INTEREST: 'Interés legítimo',
  OTHER: 'Otra',
} as const;
export const statusLabels = { DRAFT: 'Borrador', ACTIVE: 'Activo', ARCHIVED: 'Archivado' } as const;
export const tristateLabels = { YES: 'Sí', NO: 'No', UNKNOWN: 'No determinado' } as const;
export function optionKeys<T extends Record<string, string>>(options: T) {
  return Object.keys(options) as [keyof T & string, ...(keyof T & string)[]];
}
const text = (max = 5000) => z.string().trim().max(max);
export const processingSchema = z
  .object({
    name: text(200).min(2, 'Ingrese un nombre de al menos dos caracteres.'),
    area: text(200),
    owner: text(200),
    purpose: text().min(2, 'Describa la finalidad del tratamiento.'),
    data_subject_categories: z
      .array(z.enum(optionKeys(subjectLabels)))
      .min(1, 'Seleccione al menos un tipo de titular.')
      .max(6)
      .transform((v) => [...new Set(v)]),
    personal_data_categories: z
      .array(z.enum(optionKeys(dataLabels)))
      .min(1, 'Seleccione al menos una categoría de datos.')
      .max(10)
      .transform((v) => [...new Set(v)]),
    sensitive_data: z.enum(optionKeys(tristateLabels)),
    source: text(),
    legal_basis: z.enum(optionKeys(basisLabels)),
    legal_basis_details: text(),
    systems: text(),
    recipients: text(),
    processors: text(),
    international_transfer: z.enum(optionKeys(tristateLabels)),
    international_transfer_details: text(),
    retention_period: text(),
    retention_criteria: text(),
    security_measures: text(),
    notes: text(10000),
    status: z.enum(optionKeys(statusLabels)),
  })
  .superRefine((v, ctx) => {
    if (v.international_transfer === 'YES' && !v.international_transfer_details)
      ctx.addIssue({
        code: 'custom',
        path: ['international_transfer_details'],
        message: 'Describa las transferencias internacionales.',
      });
    if (v.legal_basis === 'OTHER' && !v.legal_basis_details)
      ctx.addIssue({
        code: 'custom',
        path: ['legal_basis_details'],
        message: 'Explique la base de licitud propuesta.',
      });
  });
export function processingInput(data: FormData) {
  return {
    ...Object.fromEntries(data),
    data_subject_categories: data.getAll('data_subject_categories'),
    personal_data_categories: data.getAll('personal_data_categories'),
  };
}
