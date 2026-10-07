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

Revisadas para fase 4 el 6 de octubre de 2026: se releen las secciones 12–14 del maestro y la documentación local de Next.js de páginas y mutaciones. Se consultan el changelog de Supabase y la guía RLS actuales: no hay cambios aplicables que exijan nuevas dependencias para este flujo; se mantienen grants explícitos, RLS por operación y funciones privilegiadas privadas con autorización. El usuario autoriza fase 4; IA y canales externos continúan aplazados.

Revisadas para fase 5 el 7 de octubre de 2026: secciones 15–17, 22, 25 y 30–34 del maestro; README y arquitectura; documentación local de Next.js de mutaciones y Route Handlers. Se consultó el changelog actual de Supabase, incluido PostgreSQL 17.11 (sin usos de ltree, PGP, btree_gist ni operadores personalizados en esta entrega), y las guías oficiales de [Storage privado](https://supabase.com/docs/guides/storage/buckets/fundamentals), [RLS de Storage](https://supabase.com/docs/guides/storage/security/access-control) y [carga estándar](https://supabase.com/docs/guides/storage/uploads/standard-uploads). Se mantiene Node 24 y grants explícitos. Se utiliza carga directa con sesión, sin upsert, y descarga autenticada; no se emplean buckets públicos ni claves privilegiadas en la app.

Revisadas para fase 6 el 7 de octubre de 2026: documento maestro, README, arquitectura y documentación local de Next.js de Server Actions/Route Handlers; changelog vigente de Supabase y guías oficiales de [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) y [Cron](https://supabase.com/docs/guides/cron/quickstart). Se aplicaron las habilidades Supabase y buenas prácticas PostgreSQL para permisos, RLS e índices. El usuario autoriza completar fase 6 y adelantar auditoría administrativa con CSV y borrado exclusivamente administrativo; el documento maestro no se modifica. No se amplían canales externos ni IA.
