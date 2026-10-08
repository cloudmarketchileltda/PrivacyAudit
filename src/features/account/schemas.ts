import { z } from '@/lib/validation';
import { generalConfig } from '@/config/general';

const limits = generalConfig.account;
export const contactSchema = z.object({
  address: z.string().trim().max(limits.contactMaxLengths.address).default(''),
  phone: z.string().trim().max(limits.contactMaxLengths.phone).default(''),
  city: z.string().trim().max(limits.contactMaxLengths.city).default(''),
  country: z.string().trim().max(limits.contactMaxLengths.country).default(''),
});
export const profileSchema = contactSchema.extend({
  full_name: z.string().trim().min(2).max(limits.fullNameMaxLength),
});
export const passwordSchema = z
  .object({
    password: z.string().min(limits.passwordMinLength).max(limits.passwordMaxLength),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden.',
  });
export const changePasswordSchema = passwordSchema
  .safeExtend({
    current_password: z.string().min(1).max(limits.passwordMaxLength),
  })
  .refine((data) => data.current_password !== data.password, {
    message: 'La nueva contraseña debe ser diferente de la actual.',
  });
export const emailSchema = z.object({
  email: z
    .email()
    .max(limits.emailMaxLength)
    .transform((value) => value.toLowerCase()),
  current_password: z.string().min(1).max(limits.passwordMaxLength),
});
