import { assessmentDeletionConfirmation } from '../_shared/assessment-deletion.ts';
type Dependencies = {
  authorize(token: string): Promise<{ role: string } | null>;
  prepare(assessment: string, token: string): Promise<string>;
  files(assessment: string, token: string): Promise<string[]>;
  remove(paths: string[]): Promise<void>;
  finish(assessment: string, token: string): Promise<void>;
};
export function assessmentDeletionHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const reply = (status: number, body: object) => Response.json(body, { status });
    if (request.method !== 'POST') return reply(405, { error: 'Método no permitido.' });
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply(401, { error: 'Sesión requerida.' });
    try {
      const actor = await deps.authorize(token);
      if (!actor) return reply(401, { error: 'Sesión inválida.' });
      if (!['SUPER_ADMIN', 'CONSULTANT'].includes(actor.role))
        return reply(403, { error: 'Solo el administrador o un consultor asignado.' });
      const input = await request.json().catch(() => null);
      if (
        !input ||
        typeof input.assessment !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          input.assessment,
        ) ||
        input.confirmation !== assessmentDeletionConfirmation
      )
        return reply(400, { error: 'Evaluación o confirmación inválida.' });
      // SQL rechecks membership and organization status on every RPC using the caller's JWT.
      const org = await deps.prepare(input.assessment, token);
      for (let batch = 0; batch < 200; batch++) {
        const paths = await deps.files(input.assessment, token);
        if (!paths.length) {
          await deps.finish(input.assessment, token);
          return reply(200, { success: true });
        }
        if (paths.length > 100 || paths.some((path) => !path.startsWith(`${org}/`)))
          throw new Error('Listado inválido');
        await deps.remove(paths);
      }
      return reply(409, {
        error: 'El borrado está en proceso. Reintente Eliminar para completarlo.',
      });
    } catch {
      return reply(409, {
        error: 'No se completó el borrado. Revise sus permisos y reintente Eliminar.',
      });
    }
  };
}
