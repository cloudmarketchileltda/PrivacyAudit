# Conservación, exportación y cierre

Política de producto versión 2026-10-09, autorizada por el usuario. Las condiciones legales conservan su carácter inicial y requieren aprobación jurídica/comercial del operador. Este documento sustituye la purga discrecional de auditoría descrita en entregas anteriores.

## Política aplicada

| Situación                 | Regla                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Organización activa       | Historia protegida frente a edición; sin purga por antigüedad.                                                                        |
| Organización archivada    | Conserva datos, historial y archivos para consulta de miembros actuales; sin trabajo operativo. SUPER_ADMIN puede reactivar.          |
| Exportación               | SUPER_ADMIN, organización archivada y sin eliminación pendiente. Opcional antes del borrado.                                          |
| Eliminación confirmada    | Borra todos sus registros, historial y blobs en base activa/Storage. Conserva cuentas y catálogo global. ORG-04 prevalece.            |
| Eliminación de evaluación | EVA-05 conserva su excepción: elimina la rama y su historial, sin afectar otras evaluaciones.                                         |
| Eventos globales/cuentas  | Conservados por su finalidad; no hay purga discrecional ni TTL definido.                                                              |
| Respaldos                 | Pueden contener copias residuales. No se garantiza desaparición inmediata ni recuperación. Expiración real pendiente de verificación. |

La promesa comercial admitida es: «El historial está protegido contra modificaciones durante su conservación. Se elimina junto con la organización o evaluación cuando se confirma su eliminación autorizada». No anunciar conservación perpetua ni auditoría inmutable sin excepciones. No atribuir un plazo legal universal a esta política.

## Operación en la plataforma

Administración → Organizaciones → resumen → Conservación y cierre:

1. Archivar conserva los datos y detiene el trabajo operativo. Reactivar permite continuar.
2. Exportar datos y archivos prepara un ZIP privado. El administrador verifica la copia y la entrega por un medio autorizado; la plataforma no envía mensajes externos.
3. Eliminar exige escribir `ELIMINAR ORGANIZACION`. Exportar es una opción, nunca una condición para ejercer el borrado. Puede eliminar también una organización activa.
4. Si Storage falla, el borrado queda pendiente para reintentar. No se ofrece una exportación «completa» después de iniciar la eliminación porque algunos archivos pueden haberse eliminado.

## Contenido y comprobación de la exportación

- `datos.json`: snapshot transaccional de organización, evaluaciones y aplicaciones históricas, tratamientos, hallazgos, tareas, todas las versiones de evidencias, comentarios, notificaciones, informes y snapshots, membresías/nombres, invitaciones sin token/hash e historial asociado.
- `archivos/`: todos los objetos del prefijo de Storage de la organización, incluidas cargas incompletas y objetos sin reserva. Los nombres son generados; `source` en el índice enlaza el path original con `file_path` y `original_filename` en los datos.
- `informes/`: PDF generados desde los snapshots históricos, que también se incluyen en JSON. No se garantiza identidad binaria con descargas previas.
- `indice.json`: versión, instante de captura, conteos y lista de archivos con tamaño y SHA-256. No es firma digital ni prueba independiente de autenticidad.
- `LEEME.txt`: alcance y advertencias de conservación.

No incluye credenciales Auth, contraseñas, sesiones, contactos privados de cuentas ni catálogo global compartido. No exporta datos de otras organizaciones. El corte representa el instante de la consulta; los cambios administrativos o de avisos posteriores no pertenecen al corte.

No se truncan registros por el límite de 1.000 filas de Data API: el snapshot se construye mediante una operación SQL autorizada. Límites operativos: 64 MiB de snapshot y 512 MiB de contenido de paquete, definidos en `generalConfig.retention`. Ante un límite, archivo confirmado ausente, tamaño discordante, descarga o PDF fallido, no se entrega ZIP parcial. Se requiere una exportación asistida fuera de este endpoint para organizaciones mayores; no eliminar hasta haber obtenido la copia necesaria.

El ZIP se prepara en un directorio temporal privado (0700, archivo 0600), se elimina al terminar/cancelar la transmisión y se sirve con `private, no-store`. Un cierre abrupto del proceso puede dejar un temporal: el operador debe incluir limpieza de `privacyaudit-export-*` en el reinicio/rotación del host, sin publicar esos directorios. No se guarda una copia permanente del ZIP en Storage.

La auditoría registra `ORGANIZATION_EXPORT_PREPARED` y el hash del índice tras completar el paquete. No certifica que el navegador terminara de descargar ni que el destinatario lo conservara. El evento es posterior al corte y se elimina con la organización.

Para verificar: extraer en un entorno privado, comparar cada tamaño y SHA-256 con el índice, comprobar conteos y revisar una muestra de documentos/PDF. Conservar la copia en un repositorio controlado por la organización. El archivo contiene datos privados y no está cifrado por una contraseña propia del ZIP.

## Respaldos: estado verificado y limitación

Proyecto identificado: PrivacyAudit `pbihajfbbcbbdvoqpggy`. El 2026-10-09 la CLI `supabase backups list --project-ref pbihajfbbcbbdvoqpggy --output json` no pudo consultar respaldos por falta de access token de administración. La conexión MCP de SQL no concede esa capacidad. No se verificaron plan, PITR, retención efectiva, copias externas de Dokploy ni recuperación real. No se modificaron planes de pago o configuración de respaldos.

La documentación de Supabase distingue respaldos de PostgreSQL y archivos de Storage: la base conserva metadata, pero sus respaldos no incluyen los blobs. La retención depende del plan/PITR. Es información del proveedor, no evidencia de la configuración de este proyecto: https://supabase.com/docs/guides/platform/backups.

Antes de ofrecer un plazo contractual, el operador debe inventariar respaldos Supabase, host/Dokploy y copias manuales; registrar plan, días efectivos, ubicaciones, responsables y fecha de verificación. Después debe actualizar el texto compartido en `generalConfig.retention.backups` y las condiciones comerciales. Mientras esto no se complete, la plataforma informa que el plazo no está verificado.

## Procedimiento de restauración sin reactivar organizaciones eliminadas

Este es un control operativo obligatorio; no constituye automatización de restauración implementada.

1. Mantener el servicio público cerrado. Restaurar la copia únicamente en un entorno aislado, sin usuarios ni notificaciones operativas.
2. Obtener un inventario independiente y aprobado de las organizaciones que siguen autorizadas para prestarles servicio. La copia antigua no sirve como fuente de esa autorización. Si no es posible verificar el inventario, no reabrir.
3. Comparar la copia restaurada con esa lista vigente. Excluir toda organización que no esté autorizada, incluidos todos sus registros e historial; usar los mecanismos ORG-04 y Storage API cuando proceda. No conservar una lista de organizaciones eliminadas en la aplicación para saltarse la prioridad de borrado.
4. Resolver metadata de evidencias cuyos blobs ya no existan. No presentar esas evidencias como recuperadas ni publicar copias de datos inconsistentes.
5. Validar cuentas, roles, membresías y revocaciones actuales contra registros operativos autorizados; una copia antigua puede reponer sesiones o accesos retirados. Revalidar/inutilizar sesiones y credenciales según el incidente antes de abrir.
6. Ejecutar pruebas de aislamiento, inventario de archivos, permisos y flujos de negocio. Registrar el resultado del control sin copiar contenidos eliminados.
7. Solo reabrir después de aprobación del responsable de infraestructura y del servicio. Eliminar la copia aislada de trabajo conforme a su política verificada.

No se ejecutó una restauración real en esta entrega. No se garantiza borrado inmediato de copias que el proveedor todavía conserve ni de exportaciones descargadas por terceros autorizados.
