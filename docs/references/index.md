# Referencias de PrivacyAudit

Consultadas el 4 de octubre de 2026 (America/Santiago).

- `PrivacyAudit.docx`, documento maestro aportado por el usuario en la raíz. Leído completo. Define producto, stack, restricciones y fases. El 5 de octubre de 2026 el usuario autorizó continuar con fase 3. El original se conserva; IA aplazada hasta completar el MVP y notificaciones operativas externas excluidas por ahora.
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client — leído; sesiones de servidor, proxy, cookies.
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security — leído; grants explícitos, políticas por operación, aislamiento.
- Changelog Supabase: https://supabase.com/changelog.md — leído; cambios sobre exposición automática de tablas se resuelven con grants explícitos. No se utiliza GraphQL ni Supabase autoalojado.
- Next.js: https://nextjs.org/docs/app/getting-started/installation y https://nextjs.org/docs/app/api-reference/config/next-config-js/output — consultados; App Router y standalone.
- Docker: https://docs.docker.com/guides/nextjs/ y Dokploy: https://docs.dokploy.com/docs/core — consultados para preparar contenedor, sin despliegue remoto.

No se recibieron referencias visuales. El diseño se deriva de los requisitos B2B del maestro.

Revisadas para fase 3 el 5 de octubre de 2026: documentación local de Next.js sobre páginas y Server Actions; changelog actual de Supabase y guía RLS. La migración declara grants explícitos y políticas por operación, sin depender de la exposición automática de tablas.
