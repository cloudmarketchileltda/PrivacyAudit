import { generalConfig } from '../../../src/config/general.ts';

export type ContactInput = { address: string; phone: string; city: string; country: string };
export function contactInput(value: Record<string, unknown>): ContactInput | null {
  const result = { address: '', phone: '', city: '', country: '' };
  for (const field of ['address', 'phone', 'city', 'country'] as const) {
    if (value[field] !== undefined && typeof value[field] !== 'string') return null;
    result[field] = (value[field] as string | undefined)?.trim() ?? '';
    if (result[field].length > generalConfig.account.contactMaxLengths[field]) return null;
  }
  return result;
}
