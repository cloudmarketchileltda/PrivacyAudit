# Verificación de las fases 1 a 3

Resultados locales y remotos del 5 de octubre de 2026, America/Santiago. El documento maestro permanece sin modificaciones. La implementación local termina ahora en fase 3; las comprobaciones históricas de fases 1 y 2 se conservan a continuación.

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

## Verificación de fase 3

- Antes de continuar, login y healthcheck del dominio público respondieron HTTP 200. El proyecto remoto se identificó como PrivacyAudit (`pbihajfbbcbbdvoqpggy`), ACTIVE_HEALTHY, con siete tablas públicas existentes protegidas por RLS. Se encontró una cuenta confirmada y una sesión; esto no prueba recuperación por correo, renovación ni aislamiento con JWT reales.
- Se creó con Supabase CLI la migración de tratamientos; se aplicó mediante el conector al proyecto identificado y se alineó el archivo local con la versión remota `20261005201508`. No se modificaron migraciones anteriores. El historial remoto contiene ahora las cuatro versiones presentes localmente.
- `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` pasaron. Lint, tests y build final se ejecutaron con el runtime Node 24.19.0. Diez tests en total; la prueba nueva de PostgreSQL ejecuta la migración real y verifica creación, edición, archivo, borrado, autor calculado en servidor, identidad inmutable, validación SQL, organización archivada, retirada de membresía, clientes de solo lectura, administrador y denegación entre tenants y a anónimos.
- `npm run test:ui` pasó con 137 comprobaciones de pantallas y anchos, más flujos críticos. Añade listado global y por organización, alta, detalle y edición en siete anchos (360–1440 px). Comprueba categorías múltiples, validación condicional de transferencias, edición, archivo, búsqueda y filtros, paginación con 21 registros, eliminación confirmada y rutas bloqueadas para otro consultor y para edición de cliente. Se inspeccionaron visualmente capturas de alta y detalle en móvil y alta en escritorio. Este navegador se ejecutó con Node 20.20.2 y el adaptador PostgreSQL aislado existente, no contra Supabase Auth/PostgREST reales.
- `scripts/verify-phase3-remote.sql` pasó en PostgreSQL remoto: autor no falsificable, lectura y cambios de consultor autorizado, denegación entre tenants en SELECT/INSERT/UPDATE/DELETE, cliente de solo lectura, protección de identidad, organización archivada y rechazo de acceso anónimo. La transacción terminó con ROLLBACK. Se confirmó que permanecían una cuenta y una sesión originales, cero usuarios temporales de la prueba y cero tratamientos de prueba.
- La Data API real rechazó un SELECT anónimo a `processing_activities` con HTTP 401 / SQLSTATE 42501. RLS de la nueva tabla está habilitado.
- El servidor de producción local compilado respondió HTTP 200 en login y healthcheck y redirigió `/processing` anónimo a `/login` con HTTP 307. No equivale a un despliegue de fase 3 en Dokploy.
- Advisor de seguridad actual: sin hallazgos de RLS para tratamientos; advierte que la protección de contraseñas filtradas de Auth está desactivada. Pendiente de revisión de configuración: [guía de Supabase](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Advisor de rendimiento: solo once avisos informativos de índices sin uso, incluidos los dos nuevos; no hay advertencias de FK sin índice ni de initplan RLS.

Pendientes operativos: redesplegar la web y probar el nuevo módulo con sesiones reales de consultor y cliente. La publicación en GitHub quedó comprobada en la revisión de cierre siguiente. Recuperación por correo y renovación de sesión siguen pendientes. Docker no se ejecutó localmente. IA, notificaciones externas y fases 4–8 no se implementaron.

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

## Revisión del error 502

Se arrancó el servidor standalone de producción local con PORT=80 y HOSTNAME=0.0.0.0: el log mostró ambas direcciones en puerto 80, lsof confirmó TCP *:80 y /api/health respondió HTTP 200. Dockerfile ya usa este puerto. Se corrigió también npm start para escuchar explícitamente en 0.0.0.0:80. Esta prueba local no demuestra el puerto del contenedor remoto. El dominio público devolvió 502. En Dokploy, servicio cloudmarket-privacyaudit-e0n5t6, los logs mostraron npm start con --hostname 127.0.0.1 y puerto 80; el dominio apunta correctamente al puerto 80. El bind al loopback del contenedor impide acceso desde el proxy. Se publica el cambio de npm start a 0.0.0.0:80; el usuario realizará el redespliegue.

## Revisión de cierre del 6 de octubre de 2026

Se contrastó el documento maestro con el módulo implementado. Fase 3 corresponde a actividades de tratamiento: todos los campos de la sección 11 tienen representación en esquema, formulario y detalle. Incluye categorías múltiples, base propuesta seleccionable y explicación editable, responsables y proveedores como texto, transferencias Sí/No/No determinado y retención editable. No se determina automáticamente la validez jurídica de la base.

Se revisaron CRUD, archivo/reactivación, validación en servidor, FK, identidad inmutable, búsqueda, orden, filtros, paginación y acceso por organización. Las rutas de edición verifican permisos y las acciones comprueban que la organización esté activa; RLS también protege operaciones directas. No se encontraron funcionalidades principales faltantes en el alcance de fase 3.

- Se publicó la implementación en `https://github.com/cloudmarketchileltda/PrivacyAudit`, rama `main`, commit `e1f422123fe144782b539e8b6d28362fe1cc6c66`. Después del push, `git ls-remote origin refs/heads/main` coincidió con el SHA local y el árbol de trabajo estaba limpio.
- Con Node 24.19.0 pasaron lint, TypeScript, las diez pruebas automatizadas y build de producción.
- `npm run test:ui` pasó nuevamente: 137 comprobaciones de pantalla/viewport y flujos críticos, con Node 20.20.2 y el adaptador PGlite aislado. Se inspeccionaron las nuevas capturas del formulario en móvil y escritorio; no se detectaron defectos de disposición. No equivale a Supabase Auth/PostgREST reales.
- Se volvió a identificar el proyecto PrivacyAudit `pbihajfbbcbbdvoqpggy`, ACTIVE_HEALTHY. Las cuatro migraciones locales coinciden con el historial remoto; tratamientos tiene RLS y políticas SELECT, INSERT, UPDATE y DELETE.
- Se volvió a ejecutar `scripts/verify-phase3-remote.sql`: aislamiento entre consultores, cliente de solo lectura, autor e identidad protegidos, bloqueo en organización archivada y denegación anónima. Terminó con ROLLBACK; se confirmaron cero tratamientos y cero usuarios temporales `@example.test`.
- En el dominio público, `/login` y `/api/health` respondieron HTTP 200, pero `/processing` respondió HTTP 404. Esto demuestra que la nueva ruta no está disponible en ese despliegue; no se afirma validación de fase 3 en producción.
- Advisor de seguridad: sin hallazgos de RLS; conserva la advertencia documentada de protección de contraseñas filtradas desactivada.

Conclusión: implementación de fase 3 completa y validada en código y PostgreSQL; cierre operativo pendiente de redespliegue y prueba con sesiones reales. GitHub y despliegue son verificaciones distintas. No se inició fase 4 durante esta revisión. Su alcance según el maestro es hallazgos, tareas y plan de acción; IA y notificaciones externas mantienen el aplazamiento acordado.
