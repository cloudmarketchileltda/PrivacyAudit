type Dependencies = {
  authorize(token: string): Promise<{ role: string } | null>;
  prepare(org: string, token: string): Promise<void>;
  files(org: string, token: string): Promise<string[]>;
  remove(paths: string[]): Promise<void>;
  finish(org: string, token: string): Promise<void>;
};
export function deletionHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const reply = (status: number, body: object) => Response.json(body, { status });
    if (request.method !== 'POST') return reply(405, { error: 'Método no permitido.' });
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply(401, { error: 'Sesión requerida.' });
    try {
      const actor = await deps.authorize(token);
      if (!actor) return reply(401, { error: 'Sesión inválida.' });
      if (actor.role !== 'SUPER_ADMIN') return reply(403, { error: 'Solo el administrador.' });
      const input = await request.json().catch(() => null);
      if (
        !input ||
        typeof input.org !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          input.org,
        ) ||
        input.confirmation !== 'ELIMINAR ORGANIZACION'
      )
        return reply(400, { error: 'Organización o confirmación inválida.' });
      await deps.prepare(input.org, token);
      for (let batch = 0; batch < 200; batch++) {
        const paths = await deps.files(input.org, token);
        if (!paths.length) {
          await deps.finish(input.org, token);
          return reply(200, { success: true });
        }
        // Never accept unrelated paths, even if an upstream contract changes.
        if (paths.some((path) => !path.startsWith(`${input.org}/`)))
          throw new Error('Ruta inválida');
        await deps.remove(paths);
      }
      return reply(409, { error: 'El borrado está en proceso. Reintente para completarlo.' });
    } catch {
      return reply(409, { error: 'No se completó el borrado. Reintente desde Administración.' });
    }
  };
}
