# Verificación de las fases 1 y 2

Resultados locales y remotos del 5 de octubre de 2026, America/Santiago. El documento maestro permanece sin modificaciones. El alcance implementado termina en fase 2.

## Comprobaciones realizadas

- Instalación con versiones concretas y lockfile. Node 24.19.0, Next.js 16.3.8, React 19.3.0, Supabase JS 2.117.2 y SSR 0.12.7.
- Fase 1: tests PostgreSQL y build de producción antes de continuar con las rutas de fase 2.
- TypeScript estricto y lint con reglas de TypeScript, React Hooks y accesibilidad JSX.
- Ocho pruebas automatizadas, con múltiples comprobaciones de autorización y estado. Las migraciones SQL se ejecutan realmente en PostgreSQL PGlite; las tablas de Auth y la función auth.uid se proveen como fixture de prueba.
- Aislamiento de SELECT, UPDATE y DELETE entre consultores; cliente solo accede a su organización y no modifica estados de evaluación; denegación de elevación de rol vía API y metadata.
- Invitaciones: email coincidente y confirmado, token de un uso, revocación, expiración, organización activa y retiro de membresías.
- Catálogo de 52 controles, seed idempotente, creación de evaluación con controles activos, copia histórica, justificación obligatoria de no aplicabilidad y cierre bloqueado mientras haya controles pendientes.
- Reapertura de evaluación, rechazo de edición de controles en una evaluación completada, protección de identidades y conservación del historial al intentar borrar una organización con evaluaciones.
- Comentario del cliente limitado a su campo; no modifica el evaluador, la fecha de evaluación ni el estado del control.
- Todas las tablas públicas tienen RLS y los wrappers RPC públicos usan SECURITY INVOKER. Las funciones privilegiadas viven en private con permisos de ejecución acotados.
- 102 comprobaciones de pantalla y viewport en Chromium. Pantallas del espacio de trabajo a 360, 390, 560, 768, 1024, 1280 y 1440 px; pantallas de Auth y administración en cinco de esos anchos. Tablas con desplazamiento local y sin desbordamiento horizontal de página en esas muestras.
- Navegador: login de consultor, creación de organización con perfil, creación de evaluación con 52 controles, respuesta No aplica con motivo, actualización de avance, denegación de URL de otra organización, logout, acceso de cliente de solo lectura a estados, comentario del cliente y creación de control por administrador.
- Auditoría npm sin vulnerabilidades reportadas al cierre.
- Build de producción de Next.js, healthcheck HTTP 200 y otras 20 comprobaciones de pantallas públicas sobre el servidor de producción local sin credenciales. Las rutas privadas redirigen a configuración en ese estado.

## Límites de estas pruebas

La prueba de navegador usa un adaptador HTTP aislado para alimentar los clientes Supabase desde la base PGlite. Las rutas, formularios y Server Actions de Next.js son reales y ejercitan el SQL de la aplicación; el adaptador NO es Supabase Auth ni PostgREST. Solo existe en scripts de prueba, nunca se importa desde src y se descarta al finalizar. Los usuarios y datos de ejemplo son exclusivos de esas pruebas.

Se conectó el proyecto dedicado `pbihajfbbcbbdvoqpggy` y se aplicaron las tres migraciones versionadas y el seed de 52 controles. Los nombres y versiones de los archivos locales coinciden con el historial remoto. Se recompiló la aplicación con la URL y clave pública reales.

Comprobaciones remotas: siete tablas públicas con RLS; 52 controles activos; Auth responde HTTP 200, admite email y registro y exige confirmación; PostgREST rechaza SELECT anónimo a organizaciones y catálogo con HTTP 401 / SQLSTATE 42501; la app responde HTTP 200 en login y healthcheck y redirige dashboard anónimo a login. `scripts/verify-remote.sql` ejecutó una transacción en PostgreSQL remoto con identidades temporales y roles reales: metadata no eleva permisos, consultor B no ve ni modifica A, evaluación copia 52 controles, cierre con pendientes se rechaza, invitación permite lectura al cliente, comentario no cambia estado/evaluador, cliente no modifica estados ni puede activar consultor y anon no lee organizaciones. ROLLBACK eliminó toda la prueba; se confirmó cero usuarios, organizaciones y evaluaciones después. Esto prueba RLS y funciones de PostgreSQL, no sesiones emitidas por Auth.

Advisor de seguridad: sin hallazgos. Se corrigieron tres advertencias de initplan RLS y un índice de FK compuesta. Solo quedan avisos informativos de índices sin uso, esperables en una base recién creada: [explicación del advisor](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index). Se conservan para las consultas y claves foráneas previstas.

Se recuperó acceso nativo a Chrome con el perfil CloudMarket y sesión iniciada en el proyecto PrivacyAudit. En el panel se guardó Site URL `https://privacyaudit.cloudmarket.cl` y retorno `https://privacyaudit.cloudmarket.cl/auth/callback**`, email habilitado y confirmación obligatoria; se guardaron los dos retornos locales definidos en `supabase/config.toml` y el mínimo remoto de contraseña de diez caracteres. El panel confirmó ambas operaciones con mensajes de éxito. Falta verificar registro, confirmación y recuperación por correo, callback PKCE, renovación de sesión y aislamiento entre cuentas con JWT emitidos por Auth. Las invitaciones de aplicación se comparten mediante enlace; no hay envío automático de email de invitación.

Docker no está instalado en este entorno. El primer intento remoto en Dokploy compiló Next.js, pero falló al copiar la carpeta vacía public, ausente en el ZIP. Se añadió public/.gitkeep para conservarla. Por solicitud del usuario, el flujo continúa mediante GitHub y el usuario realizará el despliegue y Cloudflare. Dockerfile y compose ahora usan puerto 80; el arranque de esta imagen queda pendiente de verificación.

Los controles son ejemplos de gestión pendientes de revisión jurídica. No se verificó ni afirmó que cada control represente una obligación legal aplicable.

## Reproducción

```sh
npm ci
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:ui
npm run build
npm start
curl -f http://localhost:3000/api/health
```

`npm run types:local` regenera el contrato TypeScript desde las migraciones ejecutadas en PostgreSQL local de prueba; no pretende describir un proyecto remoto ya aplicado. Después de conectar el proyecto se puede contrastar con los tipos generados por Supabase CLI.

Los artefactos de QA de navegador se guardan en `artifacts/ui` y están excluidos de Git y Docker. Los resultados JSON registran pantallas, anchos y flujos probados.
