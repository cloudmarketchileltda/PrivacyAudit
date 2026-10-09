import { contactInput, type ContactInput } from '../_shared/account-contact.ts';
import { passwordPolicy } from '../_shared/password-policy.ts';
export type MutationInput = {
  target: string;
  operation: 'UPDATE' | 'DELETE' | 'RESET_PASSWORD';
  password?: string;
  full_name?: string;
  email?: string;
  confirmation?: string;
  contact?: ContactInput;
};
export function mutationInput(value: unknown): MutationInput | null {
  if (!value || typeof value !== 'object') return null;
  const d = value as Record<string, unknown>;
  if (
    typeof d.target !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.target)
  )
    return null;
  if (d.operation === 'RESET_PASSWORD') {
    if (
      typeof d.password !== 'string' ||
      d.password.length < passwordPolicy.minLength ||
      d.password.length > passwordPolicy.maxLength ||
      d.password !== d.password_confirmation
    )
      return null;
    return { target: d.target, operation: 'RESET_PASSWORD', password: d.password };
  }
  if (d.operation === 'DELETE')
    return d.confirmation === 'ELIMINAR CUENTA'
      ? { target: d.target, operation: 'DELETE', confirmation: d.confirmation }
      : null;
  if (d.operation !== 'UPDATE' || typeof d.full_name !== 'string' || typeof d.email !== 'string')
    return null;
  const full_name = d.full_name.trim(),
    email = d.email.trim().toLowerCase();
  if (
    full_name.length < 2 ||
    full_name.length > 160 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    return null;
  const hasContact = ['address', 'phone', 'city', 'country'].some((field) => field in d);
  const contact = hasContact ? contactInput(d) : undefined;
  if (contact === null) return null;
  return { target: d.target, operation: 'UPDATE', full_name, email, contact };
}
export function mutationHandler(deps: {
  authorize: (token: string) => Promise<{ id: string; role: string } | null>;
  mutate: (input: MutationInput, token: string) => Promise<boolean>;
}) {
  return async (request: Request) => {
    const reply = (status: number, body: object) =>
      Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if (request.method !== 'POST') return reply(405, { error: 'Método no permitido.' });
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply(401, { error: 'Sesión requerida.' });
    try {
      const actor = await deps.authorize(token);
      if (!actor) return reply(401, { error: 'Sesión inválida.' });
      if (actor.role !== 'SUPER_ADMIN')
        return reply(403, { error: 'Acción exclusiva del administrador.' });
      const body = await request.text();
      if (body.length > 4096) return reply(413, { error: 'Solicitud demasiado grande.' });
      let value: unknown;
      try {
        value = JSON.parse(body);
      } catch {
        return reply(400, { error: 'Datos inválidos.' });
      }
      const input = mutationInput(value);
      if (!input || (input.operation !== 'UPDATE' && input.target === actor.id))
        return reply(400, { error: 'Datos inválidos o cuenta protegida.' });
      if (!(await deps.mutate(input, token)))
        return reply(400, {
          error:
            'No se pudo modificar la cuenta. Revise el correo, las relaciones históricas y los permisos.',
        });
      return reply(200, { success: true });
    } catch {
      return reply(503, { error: 'Servicio no disponible.' });
    }
  };
}
