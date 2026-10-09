import { generalConfig } from '../../../src/config/general.ts';
// Edge Functions use the same public limits as Next.js.
export const passwordPolicy = {
  minLength: generalConfig.account.passwordMinLength,
  maxLength: generalConfig.account.passwordMaxLength,
} as const;
