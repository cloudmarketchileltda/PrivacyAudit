# Convenciones

Revisar `docs/references/index.md`, `docs/architecture.md` y el documento maestro al continuar. Alcance autorizado actual: fases 1 y 2 solamente. No iniciar fase 3 sin petición del usuario.

Stack: Next.js App Router, TypeScript estricto, Tailwind 4, componentes shadcn/ui, React Hook Form, Zod y Supabase SSR. Server Components por defecto. Validar entradas en servidor y aplicar RLS. Ninguna clave service role en la aplicación. Relaciones con FK y snapshots de controles para preservar historia.

Comandos: `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run dev`. `npm run test:db` ejecuta las migraciones reales en PostgreSQL embebido PGlite, con roles Auth de prueba; no demuestra conectividad remota ni entrega de correo de Supabase.

Todo cambio SQL debe estar en migración generada por `supabase migration new`. No alterar proyectos remotos sin identificar el destino. Mantener README y resultados de verificación honestos.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
