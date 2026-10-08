import { z } from '@/lib/validation';
export const membershipSchema = z
  .object({
    target: z.uuid(),
    expected_role: z.enum(['CLIENT', 'CONSULTANT']),
    organizations: z.array(z.uuid()),
    expected_organizations: z.array(z.uuid()),
  })
  .superRefine((value, context) => {
    if (value.expected_role === 'CLIENT' && value.organizations.length > 1)
      context.addIssue({
        code: 'custom',
        path: ['organizations'],
        message: 'Un cliente solo puede tener una organización.',
      });
    if (new Set(value.organizations).size !== value.organizations.length)
      context.addIssue({
        code: 'custom',
        path: ['organizations'],
        message: 'No repita organizaciones.',
      });
  });
export type MembershipInput = z.infer<typeof membershipSchema>;
