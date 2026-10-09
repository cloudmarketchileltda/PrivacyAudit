# Despliegue en Docker y Dokploy

El usuario realizará el despliegue y la configuración de Cloudflare. El código preparado cubre fases 1 a 6 y el cambio de cuentas administradas exclusivamente por SUPER_ADMIN.

## Configuración

- Repositorio: https://github.com/cloudmarketchileltda/PrivacyAudit.git
- Rama: main.
- Build Type: Dockerfile. Ruta: Dockerfile. Contexto: .
- Puerto de la aplicación y healthcheck: **80**. Configure el dominio de Dokploy hacia el puerto interno 80. El contenedor ejecuta node server.js como usuario app, sin privilegios de root.
- Dominio final: privacyaudit.cloudmarket.cl. La entrada HTTP del servidor es el puerto 80; Cloudflare debe servir HTTPS a los usuarios.
- No agregue una publicación independiente del puerto del contenedor al host si Dokploy/Traefik ya ocupa el puerto 80. Use el enrutamiento del dominio. compose.yaml publica 80:80 para una prueba local fuera de Dokploy.

Argumentos de build públicos (ambos obligatorios):

```env
NEXT_PUBLIC_SUPABASE_URL=https://pbihajfbbcbbdvoqpggy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clave publishable del proyecto>
```

Cambiar estos valores requiere recompilar. No usar service role key.

Variables de ejecución:

```env
NEXT_PUBLIC_SUPABASE_URL=https://pbihajfbbcbbdvoqpggy.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<misma clave publishable>
APP_URL=https://privacyaudit.cloudmarket.cl
```

Supabase conserva las migraciones de fases 1 y 2 y el seed de 52 controles; las migraciones adicionales se documentan a continuación. Site URL y retorno público de Auth están guardados para este dominio; se conservan retornos locales. No vuelva a aplicar migraciones ni resetee la base por cada despliegue.

El 5 de octubre de 2026 se aplicó también `20261005201508_phase3_processing_activities.sql` mediante el conector Supabase al proyecto PrivacyAudit `pbihajfbbcbbdvoqpggy`. El archivo se generó inicialmente con `supabase migration new` y su versión local se alineó con la asignada por el historial remoto. La CLI local no tenía sesión de gestión. Las cuatro versiones locales coinciden ahora con las remotas. El código de fase 3 se publicó en GitHub, rama `main`, el 6 de octubre de 2026 (commit `e1f4221`). El usuario informó el redespliegue el 6 de octubre; la comprobación posterior obtuvo HTTP 200 en login y healthcheck y HTTP 307 hacia `/login` en `/processing`. Sigue pendiente probar el módulo con sesiones reales de consultor y cliente. La presencia de la nueva tabla no publica las pantallas automáticamente.

## Verificación después de desplegar

1. Revise logs de compilación y ejecución, y healthcheck /api/health.
2. Configure DNS en Cloudflare apuntando al VPS y compruebe https://privacyaudit.cloudmarket.cl/signup.
3. Cree las cuentas desde Administración con un SUPER_ADMIN existente y pruebe login, recuperación y renovación de sesión. El registro público está cerrado.
4. Pruebe aislamiento con cuentas de dos organizaciones. Las pruebas previas de PostgreSQL no sustituyen sesiones reales de Supabase Auth.

## Prueba local de Docker

```sh
cp .env.example .env
# Completar valores públicos y APP_URL=http://localhost
docker compose build
docker compose up -d
curl -f http://localhost/api/health
```

Docker no está instalado localmente. El primer build remoto compiló Next.js y falló al copiar public, ausente por ser una carpeta vacía en el ZIP. public/.gitkeep corrige esa omisión. La nueva imagen con puerto 80 aún requiere build y arranque en el servidor. Si el runtime restringe puertos bajos para usuarios sin privilegios, configure net.ipv4.ip_unprivileged_port_start=0 dentro del contenedor; no ejecute la aplicación como root.

Para revertir use una imagen anterior. No revierta migraciones ni elimine datos automáticamente. PostgreSQL y Auth viven en Supabase; el contenedor no necesita persistencia de negocio.

Fuentes: https://docs.dokploy.com/docs/core/providers y https://docs.dokploy.com/docs/core/applications/build-type.

## Preparación de fase 4

El 6 de octubre de 2026 se autorizó fase 4. La migración `20261007020423_phase4_findings_tasks.sql` ya está aplicada en el proyecto PrivacyAudit `pbihajfbbcbbdvoqpggy`. Se generó inicialmente con `supabase migration new phase4_findings_tasks`; tras aplicarla por el conector se alineó el nombre local con la versión remota asignada. Las cinco migraciones locales corresponden al historial remoto.

La base de datos está preparada para Hallazgos, Tareas y Plan de acción. Después de publicar el código, redespliegue `main` en Dokploy; no repita ni resetee las migraciones. La presencia de tablas nuevas no despliega las pantallas. Pruebe crear hallazgo desde un control, asignar tarea a un cliente, envío a revisión, devolución con observaciones, reenvío, aprobación y cierre. El cliente no debe editar hallazgos ni aprobar tareas. Evidencias y Storage corresponden a fase 5 y todavía no están disponibles.

## Cuentas creadas por el administrador

La migración `20261007234041_admin_managed_accounts.sql` y la Edge Function `admin-create-user` ya están aplicadas en el proyecto PrivacyAudit `pbihajfbbcbbdvoqpggy`. No repita la migración. La función valida el JWT con Auth y exige SUPER_ADMIN en `profiles`; la credencial privilegiada se conserva únicamente en Supabase Functions. El Docker de Next.js no necesita nuevos secretos.

Redespliegue esta entrega de Next.js para retirar los enlaces de registro e incorporar Crear cuenta en Administración → Usuarios y permisos. Mientras no se redespliegue, las pantallas antiguas pueden seguir apareciendo, pero el trigger de Auth ya rechaza altas públicas y la RPC de autoactivación ya está bloqueada. En el proyecto remoto no se modificó el ajuste de Auth Allow new users to sign up: el bloqueo comprobado se aplica en la base de datos y una llamada directa de signup devuelve HTTP 500 sin crear usuarios. Se recomienda deshabilitar también ese ajuste en Auth; no sustituye la autorización administrativa de la función.

Compruebe con su administrador real la creación de un CLIENT y un CONSULTANT, entrada con la contraseña inicial, cambio de contraseña por recuperación y vinculación a una organización. El administrador habilita el email administrativamente; no se envía correo de alta ni se afirma verificación del buzón. Las cuentas existentes conservan sus roles y membresías.

## Grillas de usuarios y membresías

La migración `20261008004619_admin_membership_grids.sql` ya está aplicada en PrivacyAudit `pbihajfbbcbbdvoqpggy`. No repita su aplicación. No requiere nuevas variables ni claves privilegiadas en Next.js. La nueva sección es `/administration/memberships`, exclusivamente para SUPER_ADMIN. El cliente tiene una organización como máximo; el consultor puede tener varias.

Después de publicar y redesplegar esta entrega, pruebe como administrador: asignar cliente, transferirlo a otra organización, retirar su membresía y seleccionar varias organizaciones para un consultor. Verifique con sus sesiones reales el acceso resultante. La base de datos ya aplica la cardinalidad nueva a RPC anteriores e invitaciones, aunque todavía se vea la pantalla antigua. Los cambios de rol entre cliente y consultor requieren retirar primero las membresías incompatibles.

Para corregir el alta administrativa del 7 de octubre: aplicar `20261008012856_fix_admin_account_provisioning.sql` y desplegar `admin-create-user` con `index.ts` y `handler.ts` actuales. Mantener `verify_jwt=false`: la función valida el token mediante Auth `getUser` y el rol actual antes de reservar. La clave administrativa permanece únicamente en Supabase Functions. Next.js sigue invocando la misma función, por lo que no necesita redespliegue para este arreglo.

## Administración de cuentas: edición, eliminación y scroll

El 8 de octubre de 2026 se aplicó `20261008120939_admin_account_management.sql` al proyecto dedicado PrivacyAudit `pbihajfbbcbbdvoqpggy` (ACTIVE_HEALTHY) y se desplegó `admin-manage-user` versión 1 ACTIVE. La versión local se alineó con la asignada por el historial remoto; el archivo original se generó mediante `supabase migration new`. No repita la migración. Falta redesplegar Next.js en Dokploy.

```sh
supabase functions deploy admin-manage-user --project-ref pbihajfbbcbbdvoqpggy
```

Mantener `verify_jwt=false`: el handler verifica el JWT con `getUser` y el rol actual. Ninguna credencial privilegiada va en Next.js. Verificar con cuentas reales modificación de nombre/correo, rechazo de correo duplicado, borrado de una cuenta sin relaciones históricas y bloqueo de borrado de cuenta administrativa o con historial. El cambio de correo se habilita administrativamente sin enviar una notificación operativa ni acreditar propiedad del buzón. Verificar que cuentas y auditoría muestran diez filas y desplazamiento interno. El backend local de navegador reproduce operaciones SQL y autorización, pero no demuestra el comportamiento completo de GoTrue ni sesiones reales remotas.

## Fase 7 informes PDF

La migración `20261009021625_phase7_reports.sql` ya está aplicada en PrivacyAudit `pbihajfbbcbbdvoqpggy`, con versión local alineada al historial remoto. No repetirla manualmente. El código de fase 7 está publicado en GitHub `main`; redesplegar Next.js en Dokploy si aún no se actualizó y comprobar el flujo autenticado. No requiere desplegar Functions nuevas ni agregar variables, buckets o credenciales privilegiadas. El PDF usa Node/PDFKit con fuentes Noto Sans incluidas mediante `outputFileTracingIncludes`; el contenedor standalone debe conservar `src/features/reports/fonts` y los datos de PDFKit. La descarga no necesita Chrome, Python ni red externa.

Verificar con sesiones reales: consultor publica desde una evaluación, cliente de esa organización descarga, otro cliente/consultor no puede acceder por UUID y la retirada de membresía retira acceso. Confirmar publicación/descarga en auditoría administrativa. El borrado completo debe retirar todos los informes antes de evaluaciones; probar únicamente en una organización desechable autorizada. Las pruebas locales no acreditan estos recorridos remotos.
