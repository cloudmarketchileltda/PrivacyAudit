# Despliegue en Docker y Dokploy

El usuario realizará el despliegue y la configuración de Cloudflare. El código preparado cubre fases 1, 2 y 3.

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

Supabase ya tiene las tres migraciones versionadas y el seed de 52 controles. Site URL y retorno público de Auth están guardados para este dominio; se conservan retornos locales. No vuelva a aplicar migraciones ni resetee la base por cada despliegue.

El 5 de octubre de 2026 se aplicó también `20261005201508_phase3_processing_activities.sql` mediante el conector Supabase al proyecto PrivacyAudit `pbihajfbbcbbdvoqpggy`. El archivo se generó inicialmente con `supabase migration new` y su versión local se alineó con la asignada por el historial remoto. La CLI local no tenía sesión de gestión. Las cuatro versiones locales coinciden ahora con las remotas. El código de fase 3 se publicó en GitHub, rama `main`, el 6 de octubre de 2026 (commit `e1f4221`). Falta redesplegarlo y probarlo con sesiones reales; la revisión del 6 de octubre obtuvo HTTP 404 en `/processing` del dominio público. La presencia de la nueva tabla no publica las pantallas automáticamente.

## Verificación después de desplegar

1. Revise logs de compilación y ejecución, y healthcheck /api/health.
2. Configure DNS en Cloudflare apuntando al VPS y compruebe https://privacyaudit.cloudmarket.cl/signup.
3. Registre una cuenta propia, confirme correo en el navegador que inició el registro y pruebe login, recuperación y renovación de sesión.
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
