# Piloto IA normativo — 16 de octubre de 2026

## Alcance autorizado

Consultas únicamente sobre protección de datos personales en Chile, sin acceso a información de clientes. Veinte consultas diarias por usuario, día America/Santiago, y USD 10 de presupuesto piloto TOTAL (no mensual ni por usuario), incluida indexación. La biblioteca y FAQ siguen funcionando independientemente. La integración tiene backend desplegado e indexado en Supabase; las verificaciones remotas se detallan al final. Las pruebas con adaptadores por sí solas no acreditan ejecución real. El frontend sigue pendiente del redespliegue que realiza el usuario en Dokploy.

La primera fuente es la copia del PDF Ley 21.719 ya aportada, generada el 16-10-2026. Son 112 fragmentos de sus 56 páginas, con vínculo a la página y hash del original en `src/features/legal-library/corpus.json`. El seed está en la migración `20261016221137_legal_ai_pilot.sql`. No se indexan FAQ pendientes de aprobación, documentos de clientes ni el texto consolidado externo que todavía no se ha incorporado al corpus. Por ello las respuestas sobre régimen anterior o materias no fundamentadas deben indicar insuficiencia. No se afirma que toda la normativa vigente esté cubierta.

## Dónde pegar la clave

Archivo local creado con permisos 0600:

`supabase/.env.legal-ai.local`

Completar únicamente `OPENAI_API_KEY=` con la clave. No agregar comillas innecesarias, no pegarla en el chat, no copiarla a `.env.local` de Next.js. Git ignora este archivo y Docker excluye archivos `.env` también en subdirectorios. No se imprime ni se versiona. `LEGAL_AI_DATABASE_URL` puede quedar vacío: se utiliza el bootstrap restringido desde Vault. Nunca colocar allí la URL administrativa. `LEGAL_AI_ENABLED` ya está habilitado en Supabase tras la preparación del entorno. La clave por sí sola no configura el resto del módulo.

Ejemplo sin secretos para recrear el archivo en otro equipo:

```dotenv
OPENAI_API_KEY=
LEGAL_AI_DATABASE_URL=
LEGAL_AI_ENABLED=false
```

## Arquitectura y permisos

- Next.js: formulario, sesión/perfil actual y Server Actions. No recibe claves de OpenAI ni conexión administrativa.
- Supabase Function `legal-assistant`: autentica JWT con Auth getUser y verifica el perfil mediante la clave pública y la sesión del actor. Esta lectura se limita al perfil/rol para autorización, no se envía al modelo.
- Conexión PostgreSQL independiente `legal_ai_worker`, LOGIN sin contraseña inicialmente, NOINHERIT, NOSUPERUSER, NOBYPASSRLS. Solo USAGE del esquema `legal_ai` y EXECUTE de seis funciones concretas. Sin grants de tablas, Auth, Storage, organizaciones, evaluaciones, evidencias ni contactos. La Function rechaza una conexión cuyo current_user sea otro rol.
- Tablas del corpus y consumo en esquema no expuesto `legal_ai`, con RLS y sin grants directos al worker, anon o authenticated. Funciones definidoras limitadas con search_path vacío. Wrappers de estado/configuración públicos SECURITY INVOKER; implementación privada con identidad y rol actuales. Revisar también que legal_ai NO esté en los schemas expuestos de Data API al desplegar.
- Búsqueda híbrida: PostgreSQL FTS español y similitud coseno sobre embeddings de 256 dimensiones en arrays PostgreSQL. Se eligió búsqueda exacta para el corpus pequeño, sin instalar pgvector; no hay índice ANN. Puede migrarse a pgvector/HNSW al crecer manteniendo la interfaz `search`. Las migraciones reales se prueban en PGlite sin sustituir este cálculo.
- Proveedor desacoplado por `AiProvider`. Inicial: OpenAI Responses y embeddings, fetch nativo sin SDK adicional. Sin web search, tools, SQL generado, adjuntos, function calling ni acceso del modelo al backend.
- Preguntas independientes: se envían únicamente pregunta, instrucciones, fecha UTC de referencia y fragmentos recuperados. No se envían nombres de usuario, identificadores de organización, roles, registros ni historial. El formulario no admite contexto de clientes; la Function rechaza campos extra.
- Respuesta estructurada: answered / insufficient / out_of_scope, texto y citas. Cada cita debe identificar un fragmento recuperado y un extracto literal de 12–300 caracteres presente en él. URLs y páginas las construye la aplicación, no el modelo. Una cita válida demuestra origen del extracto, no corrección jurídica de todas las conclusiones.

El filtro previo bloquea preguntas sin vocabulario temático, algunos intentos de inyección y patrones de correo/RUT/teléfono. No detecta todos los datos personales ni todas las preguntas maliciosas. Las instrucciones del modelo añaden rechazo de temas ajenos/mixtos. No prometer clasificación perfecta ni exactitud jurídica; evaluar preguntas adversarias reales antes de abrir el piloto a clientes. Aunque falle la clasificación, no hay herramienta para recuperar información de clientes. La propia pregunta puede contener información ingresada por el usuario: el aviso solicita consultas generales sin datos identificables.

## Modelos, costos y límites

Modelo de respuesta fijado inicialmente: `gpt-5-mini-2025-08-07`, razonamiento minimal, salida máxima 1.200 tokens. Embeddings: `text-embedding-3-small`, 256 dimensiones. Tarifas estándar consultadas el 16-10-2026: USD 0,25/M tokens entrada y USD 2/M salida; embeddings USD 0,02/M. No se aplica descuento de caché al estimar, por prudencia. Fuentes oficiales: [modelo](https://developers.openai.com/api/docs/models/gpt-5-mini), [embeddings](https://developers.openai.com/api/docs/models/text-embedding-3-small), [precios](https://developers.openai.com/api/docs/pricing).

Configuración pública compartida y valores iniciales: `supabase/functions/legal-assistant/limits.ts`, reutilizados desde generalConfig.legalLibrary.ai. La migración guarda la política/modelos/tarifas en la base; la Function utiliza los valores de la reserva. Las pruebas comparan defaults SQL con el archivo compartido. Un cambio futuro de límites exige mantener ambos sincronizados mediante migración nueva; no editar la aplicada. El administrador puede habilitar/deshabilitar y abrir a todos los perfiles desde el módulo, con auditoría de configuración sin preguntas.

La reserva es transaccional y bloquea la fila global de settings: antes de cualquier llamada, suma un máximo conservador al consumo. Consulta: 60.000 tokens de entrada de cota conservadora (bytes de fragmentos, pregunta y sobrecarga), 1.200 de salida y hasta 4.000 para embedding. Indexación: cota de 10.000 tokens de embedding por fragmento. El payload se limita a 6.000 bytes, pregunta 1.000 caracteres/4.000 bytes, cinco fragmentos de hasta 1.600 caracteres. No hay herramientas externas ni historial que hagan crecer el contexto.

Tras respuesta válida se reemplaza la reserva por costo estimado según usage. Fallos, timeout, salida incompleta, citas inválidas o proceso caído CONSERVAN la reserva entera para evitar liberar presupuesto posiblemente facturado. Finish es idempotente. No hay reintentos automáticos. Las consultas reservadas cuentan hacia las 20, incluso fallidas; rechazos previos no consumen cuota ni API. El índice no consume cuota de consultas pero sí presupuesto. Consultas concurrentes del mismo usuario se bloquean mientras haya una reserva reciente; máximo global de tres reservas recientes, bloqueo SQL independiente de ocultar botones.

El tope es el control ESTIMADO de este módulo, no un tope contractual de la factura de OpenAI: no incluye usos externos de la misma clave/proyecto, impuestos ni cambios de tarifa. Usar un proyecto/clave dedicado y revisar tarifas al cambiar modelos. Verificar alertas y presupuesto del proveedor sin asumir corte estricto. No se rellenan ni reinician los USD 10 automáticamente. Reservas antiguas siguen cargadas; revisión manual basada en usage/facturación, sin herramienta de devolución automática.

## Instalación y activación

Destino: PrivacyAudit `pbihajfbbcbbdvoqpggy`. Confirmar siempre el destino antes de operaciones remotas. Las migraciones 20261016221137 (corpus/política), 20261016221147 (modelo) y 20261016221816 (bootstrap Vault) están aplicadas: no reaplicarlas.

La contraseña del rol restringido se genera dentro de PostgreSQL y permanece cifrada en Vault. El bootstrap RPC `legal_ai_runtime_password` solo permite ejecución con service_role, desde la Function; usuarios anon/authenticated no pueden recuperarla. La credencial administrativa reservada de Supabase se usa exclusivamente para ese RPC, nunca para consultar datos de negocio. La Function toma el host de SUPABASE_DB_URL y sustituye usuario/contraseña antes de abrir la conexión restringida, comprobando current_user. No se requiere configurar LEGAL_AI_DATABASE_URL manualmente. Ese secreto permanece como override opcional para instalaciones alternativas; no poner una conexión administrativa allí.

En un entorno nuevo con Vault: aplicar las migraciones versionadas, cargar OPENAI_API_KEY y LEGAL_AI_ENABLED=true como secretos de Functions y desplegar legal-assistant. No copiar claves al frontend ni a Dokploy. Indexar desde Administrar piloto IA (un fragmento por llamada, reanudable y con presupuesto). Habilitar primero para administrador; después de pruebas, abrir clientes/consultores. La configuración de esta entrega ya se realizó remotamente y el corpus quedó indexado.

GET de la Function comprueba conexión restringida y responde 204 sin datos de configuración; POST anónimo devuelve 401. Los métodos de consulta requieren Auth getUser y perfil actual. El frontend requiere el redespliegue de Dokploy que realiza el usuario: no se ha operado Dokploy.

Para detener preguntas, deshabilitar piloto desde el módulo; para detener también indexación/cualquier uso, poner LEGAL_AI_ENABLED=false en los secretos. Biblioteca y FAQ permanecen disponibles. Rotaciones futuras deben actualizar contraseña del rol y Vault en una misma operación administrativa controlada; no usar scripts de contraseña que dejen Vault desincronizado.

## Cambio futuro y conservación

Para cambiar modelo de respuesta: verificar disponibilidad, compatibilidad Responses/structured outputs, tarifas, cotas de reserva y pruebas antes de actualizar settings mediante migración; el adaptador es independiente de la UI. Para otro proveedor, implementar `AiProvider`, revisar privacidad y esquema de salida. Cambiar embeddings exige reindexar TODO el corpus con el mismo modelo y dimensión; desactivar preguntas durante esa operación. Si cambia dimensión, migrar almacenamiento/cálculo. Un documento adicional requiere fuente aprobada, régimen temporal y mapeo fiable de páginas/enlaces; no mezclar documentos con fechas distintas silenciosamente.

No se guardan preguntas, respuestas ni embeddings de preguntas en tablas. Se conservan solo metadatos de llamadas (actor, día, tipo, tokens, costo/reserva, estado) para cuota y presupuesto; sin organización ni contenido de clientes. Al eliminar legítimamente una cuenta, actor pasa a null y se conserva el agregado de costo. No hay purga discrecional de auditoría; el cambio de configuración queda en auditoría global existente. No se modifica la conservación organizacional ni ORG-04/EVA-05.

OpenAI recibe el texto enviado aunque Responses use store:false. Esto no equivale a retención cero del proveedor ni elimina sus posibles registros de abuso; revisar [controles de datos oficiales](https://developers.openai.com/api/docs/guides/your-data) y los controles reales de la cuenta. No se utiliza contenido real de clientes en pruebas. Revisar logging del hosting/proveedor antes de activar: el código no imprime payloads, pero no garantiza la configuración externa de logs.

## Pruebas reproducibles y aceptación

`npm test` incluye `tests/legal-ai.test.ts`; `npm run test:db` también. Verifican corpus/hash/defaults, rechazo de tablas de clientes al worker, roles, 20 consultas, reservas, agotamiento, replay, entradas fuera de tema/datos personales, citas inventadas, desactivación y payload sin tools/store. Los proveedores de estas pruebas son simulados, nunca consumen OpenAI. `npm run test:ui:legal-library` verifica piloto inicialmente desactivado, controles administrativos por rol y biblioteca/FAQ en móvil/escritorio. Habilita después solo el fixture con embeddings sintéticos y proveedor simulado para comprobar respuesta con fuentes, contador y bloqueo a 20/20; no hace llamadas reales.

Con clave real, validar al menos: consentimiento (artículos 12–13), derechos, supresión/excepciones, vigencia, incidentes sin inventar 72 horas, pregunta sobre régimen antiguo no cubierto, pregunta fuera de tema con palabras legales añadidas, inyección, petición de clientes/evidencias, texto con datos personales y pregunta sin fundamento. Revisar citas y costos reales con un profesional; las pruebas deterministas no demuestran calidad del modelo ni rechazo semántico perfecto.

## Cambio de modelo y ubicación de secretos

El usuario seleccionó gpt-5-mini-2025-08-07, visible en el listado de su cuenta. Migración adicional 20261016221147_legal_ai_response_model.sql actualiza modelo/tarifas sin reiniciar presupuesto o cuotas. La presencia en GET /models no demuestra generación, saldo ni calidad. Modelo señalado deprecated por la documentación: mantener reemplazable y verificar disponibilidad al activar. GPT-5 Mini requiere razonamiento minimal (no admite none). La cota de salida incluye tokens de razonamiento; una respuesta incompleta conserva la reserva y no se reintenta automáticamente.

La variable se llama OPENAI_API_KEY, pero debe configurarse en Supabase → Edge Functions → Secrets porque allí corre legal-assistant. Añadirla solo al contenedor Next.js de Dokploy no configura la Function. No usar prefijo NEXT_PUBLIC_. Dokploy conserva sus variables públicas Supabase y APP_URL existentes; este diseño no requiere entregar la clave OpenAI a Next.js.

## Estado remoto verificado tras autorización de migraciones

Ambas migraciones ya están aplicadas en PrivacyAudit: 20261016221137 y 20261016221147. Se sincronizaron sus nombres locales con el historial MCP. No reaplicar el SQL. Confirmados 112 fragmentos, 0 embeddings, cuotas/modelo/presupuesto configurados, cero consumo y piloto desactivado. Worker sin contraseña y sin SELECT en tablas public/auth/storage. Falta provisionar conexión restringida, desplegar Function/frontend e indexar; no hubo llamada de generación real en esta operación.

## Estado operativo remoto — 16 de octubre de 2026

Vault provisionado sin mostrar ni versionar la contraseña; Function legal-assistant activa (versión 3), GET 204 con conexión restringida y POST anónimo 401. OPENAI_API_KEY coincide con la clave local verificada por digest sin mostrar su valor; LEGAL_AI_ENABLED=true guardado. 112/112 fragmentos indexados con text-embedding-3-small. Configuración enabled/all_users=true, 20 consultas/día, presupuesto total USD 10. Consumo estimado más reservas conservadas USD 0,019908 al finalizar las comprobaciones iniciales.

Indexación inicial ejecutada mediante mantenimiento autorizado, con reservas previas por fragmento y embeddings reales en lotes, sin datos de clientes. Una consulta real de consentimiento recuperó cinco fragmentos; la primera respuesta se rechazó por cita inválida y conservó su reserva. Se precisaron las instrucciones de extractos literales y la segunda respuesta pasó la validación con tres citas de página 12. Una pregunta mixta de receta/privacidad fue rechazada por GPT-5 Mini. Las pruebas de generación usaron el adaptador real con búsqueda/cuota/contabilidad remotas mediante mantenimiento; no se afirma que se haya probado una sesión real de cliente contra la Function. Las reservas/costos de las pruebas quedaron contabilizados.

El módulo está habilitado para los tres perfiles y preparado para que el usuario redespliegue el frontend desde GitHub en Dokploy. No se realizó despliegue ni modificación de Dokploy. Mantener revisión profesional y probar el recorrido autenticado tras ese redespliegue.
