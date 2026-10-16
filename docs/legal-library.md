# Centro normativo

Entrega autorizada el 16 de octubre de 2026: biblioteca de la ley y FAQ, separadas de cualquier integración de IA. No amplía el resto de fase 8.

## Uso y acceso

Centro normativo en el menú de CLIENT, CONSULTANT y SUPER_ADMIN, también sin membresía de organización. `/legal-library` comprueba usuario y perfil en servidor; el endpoint `/api/legal-library/pdf` vuelve a comprobarlos independientemente. Documento global de consulta, sin acceso a datos de organizaciones.

La página ofrece PDF embebido, apertura en otra pestaña, descarga, enlaces oficiales y doce FAQ. Buscar compara todas las palabras contra pregunta, respuesta, categoría y referencia sin distinguir tildes ni mayúsculas; Tema acota por categoría. No es un chat ni una búsqueda semántica. No se guardan consultas, no se derivan mensajes al consultor y no se producen respuestas automáticas. La búsqueda dentro del PDF depende del visor del navegador; en móviles que no lo muestran se usa Abrir/Descargar.

El PDF corresponde a la copia BCN aportada por el usuario, generada el 16 de octubre de 2026, con 56 páginas, publicación 13 de diciembre de 2024, vigencia diferida 1 de diciembre de 2026 y última modificación indicada Ley 21.806 de 5 de febrero de 2026. No es una copia que se actualice automáticamente. Las FAQ identifican sus referencias como Ley 19.628 reformada y distinguen preparación de vigencia. Contenido editorial inicial pendiente de revisión jurídica profesional; no constituye certificación.

## Implementación y mantenimiento

- `src/config/general.ts`: rutas, metadatos, fuentes y aviso editorial; límite de búsqueda compartido en `generalConfig.search`.
- `src/features/legal-library/content.ts`: FAQ versionadas y buscador determinista.
- `src/features/legal-library/documents/ley-21719.pdf`: copia original, fuera de `public`.
- `src/app/(workspace)/legal-library/page.tsx`: Server Component y controles HTML accesibles.
- `src/app/api/legal-library/pdf/route.ts`: entrega autenticada inline/attachment, no-store y error recuperable. La ruta no admite una ruta de archivo suministrada por el usuario.
- `next.config.ts`: incluye el PDF en el tracing de standalone. No depende de Downloads en producción.

En esta entrega la edición se realiza en el repositorio y exige desplegar Next.js. No existe CRUD editorial desde Administración, tablas nuevas, migraciones ni archivos en Supabase Storage. No se requiere configurar credenciales adicionales. La entrega PDF carga la copia completa; no incorpora rangos HTTP, aceptable para el documento actual de menos de 200 KB.

Para actualizar: obtener una copia oficial, comprobar versión/vigencia/modificaciones y contenido, reemplazar el PDF, actualizar metadatos y revisar TODAS las referencias/páginas de FAQ. Mantener las respuestas como orientación pendiente mientras no exista revisión profesional real. Nunca marcar aprobación jurídica por inferencia. Ejecutar lint, typecheck, build y el recorrido UI antes del despliegue. Comprobar el archivo incluido en `.next/standalone` y abrir el PDF en el entorno publicado. El enlace a BCN permite consultar cambios posteriores sin alterar silenciosamente la copia.

Verificación reproducible: `npm run test:ui:legal-library` usa fixture Supabase local con PGlite y navegador Chromium. Comprueba acceso anónimo bloqueado, los tres roles, usuario sin organización, integridad binaria del PDF, descarga, referencias, búsqueda, filtros, estado vacío y tamaños móviles/escritorio. No demuestra conectividad ni sesiones reales en Supabase remoto.

## IA futura: decisión independiente

No hay SDK de IA, llamadas a modelos, embeddings, pgvector, secreto API ni endpoint de chat en esta entrega. Usar PDF/FAQ no genera cargos de API de IA; siguen existiendo los costos normales de hosting, autenticación y transferencia.

Una entrega posterior podría incorporar RAG: extracción por artículos/versiones → embeddings → búsqueda textual/vectorial en Supabase → modelo externo → respuesta con citas comprobables. La biblioteca seguirá funcionando si el proveedor no está configurado o se alcanza el presupuesto. No activar IA por la mera existencia de una clave.

Antes de implementarla, decidir proveedor/modelos, uso esperado, presupuesto, política de conversaciones y tratamiento de datos por el proveedor. Separar corpus normativo común de cualquier información de organizaciones; si se incorporan datos privados, aplicar membresías, RLS y prioridades de eliminación ORG-04/EVA-05 en todas las relaciones nuevas.

Costo a estimar con tarifas verificadas al contratar:

`consultas × (tokens de entrada × tarifa de entrada + tokens de salida × tarifa de salida) + embeddings de indexación/consultas + infraestructura adicional`

Las tarifas por millón de tokens deben dividirse por un millón en esa fórmula. Entrada incluye instrucciones, fragmentos recuperados e historial; una conversación larga puede encarecer cada turno. No estimar solo por número de usuarios ni prometer un costo fijo sin medir preguntas representativas.

Controles futuros: cuota por usuario, límite de longitud/contexto/respuesta, contador transaccional y reserva de costo antes de llamar al proveedor, máximo de llamadas concurrentes, bloqueo de nuevas llamadas al agotar el presupuesto y reintentos acotados. Las alertas del proveedor no deben asumirse como un corte estricto. Registrar consumo real sin guardar mensajes sensibles en logs. Validar respuestas con un conjunto de preguntas y casos sin fundamento antes de publicar. Secretos del proveedor exclusivamente en servidor; credencial administrativa Supabase exclusivamente en Functions según SYS-03.

La implementación de IA y la administración editorial mediante pantallas requieren una ampliación posterior explícita del alcance y sus verificaciones; este documento describe opciones, no funciones operativas.
