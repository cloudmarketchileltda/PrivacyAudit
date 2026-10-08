import { contactInput, type ContactInput } from '../_shared/account-contact.ts';
export type AccountInput = {
  full_name: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'CONSULTANT';
  contact: ContactInput;
};
export type AccountDependencies = {
  authorize: (token: string) => Promise<{ id: string; role: string } | null>;
  create: (
    input: AccountInput,
    actor: string,
    token: string,
  ) => Promise<{ id?: string; error?: string }>;
};
export function accountInput(value: unknown): AccountInput | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (
    typeof data.full_name !== 'string' ||
    typeof data.email !== 'string' ||
    typeof data.password !== 'string' ||
    typeof data.role !== 'string'
  )
    return null;
  const full_name = data.full_name.trim();
  const email = data.email.trim().toLowerCase();
  if (
    full_name.length < 2 ||
    full_name.length > 160 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    data.password.length < 10 ||
    data.password.length > 128 ||
    !['CLIENT', 'CONSULTANT'].includes(data.role)
  )
    return null;
  const contact = contactInput(data);
  if (!contact) return null;
  return {
    full_name,
    email,
    password: data.password,
    role: data.role as AccountInput['role'],
    contact,
  };
}
export function accountHandler(deps: AccountDependencies) {
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
        return reply(403, { error: 'Solo el administrador puede crear cuentas.' });
      if (Number(request.headers.get('content-length')) > 4096)
        return reply(413, { error: 'Solicitud demasiado grande.' });
      const body = await request.text();
      if (body.length > 4096) return reply(413, { error: 'Solicitud demasiado grande.' });
      let value: unknown;
      try {
        value = JSON.parse(body);
      } catch {
        return reply(400, { error: 'Datos inválidos.' });
      }
      const input = accountInput(value);
      if (!input)
        return reply(400, {
          error: 'Revise nombre, correo, rol y contraseña (10 a 128 caracteres).',
        });
      const result = await deps.create(input, actor.id, token);
      if (result.error || !result.id)
        return reply(400, {
          error:
            'No se pudo crear la cuenta. Revise si el correo ya está registrado y la política de contraseña.',
        });
      return reply(201, { id: result.id });
    } catch {
      return reply(503, { error: 'No se pudo crear la cuenta. Inténtelo más tarde.' });
    }
  };
}
