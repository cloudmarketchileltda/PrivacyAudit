import { z } from '@/lib/validation';
export function validRut(value: string) {
  const cleaned = value.replace(/[.\s]/g, '').toUpperCase();
  if (!/^\d{7,8}-[\dK]$/.test(cleaned)) return false;
  const [body, dv] = cleaned.split('-');
  let sum = 0,
    factor = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const digit = 11 - (sum % 11);
  return dv === (digit === 11 ? '0' : digit === 10 ? 'K' : String(digit));
}
const text = (max = 200) => z.string().trim().max(max);
const yesNo = z.enum(['YES', 'NO', 'UNKNOWN']);
export const organizationSchema = z.object({
  legal_name: text().min(2),
  rut: z
    .string()
    .transform((v) => v.replace(/[.\s]/g, '').toUpperCase())
    .refine(validRut, 'RUT inválido'),
  trade_name: text(),
  industry: text(),
  employee_count: z
    .union([z.literal(''), z.coerce.number().int().min(0).max(10000000)])
    .transform((v) => (v === '' ? null : v)),
  website: z.union([
    z.literal(''),
    z.url().refine((v) => /^https?:\/\//.test(v), 'Use http o https'),
  ]),
  address: text(500),
  contact_name: text(),
  contact_email: z.union([z.literal(''), z.email()]),
  contact_phone: text(50),
  privacy_officer: text(),
  status: z.enum(['ACTIVE', 'ARCHIVED']),
  treats_clients: z.boolean(),
  treats_employees: z.boolean(),
  treats_suppliers: z.boolean(),
  sensitive_data: yesNo,
  uses_cameras: z.boolean(),
  marketing: z.boolean(),
  external_providers: z.boolean(),
  international_transfers: yesNo,
  has_website: z.boolean(),
  web_forms: z.boolean(),
});
