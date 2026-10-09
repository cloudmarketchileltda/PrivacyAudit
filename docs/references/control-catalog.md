# Revisión del catálogo de privacidad — 9 de octubre de 2026

El catálogo inicial tenía 52 controles de gestión con descripciones genéricas y referencias pendientes. No es una transcripción exhaustiva de la ley. Esta revisión mantiene códigos, títulos, categorías, severidad y requisitos de evidencia y amplía descripción, objetivo, orientación y referencia normativa. Cada descripción explica alcance, cumplimiento esperado y naturaleza del criterio; la orientación desarrolla evidencias y verificación.

## Fuentes y vigencia

- [Ley 19.628, versión actualmente aplicable hasta el 30 de noviembre de 2026](https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09).
- [Ley 19.628, texto consolidado desde el 1 de diciembre de 2026](https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01).
- [Ley 21.719, reforma y artículo primero transitorio](https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272). Publicada el 13 de diciembre de 2024; el régimen reformado entra en vigor el 1 de diciembre de 2026. La fuente oficial consultada registra modificación por Ley 21.806 el 5 de febrero de 2026.

Los artículos actuales son antecedentes de las obligaciones relacionadas, no una afirmación de que cada formato o práctica del catálogo sea obligatorio actualmente. Hasta diciembre los criterios nuevos se utilizan para preparación; no sustituyen deberes y plazos actuales. Por ejemplo, el artículo 16 actual habilita amparo judicial ante falta de pronunciamiento en dos días hábiles; no se aplica anticipadamente el plazo general de 30 días corridos del artículo 11 reformado. Este último admite una prórroga de hasta otros 30 días corridos y contempla respuesta al bloqueo temporal en dos días hábiles. La reforma no fija un plazo general de 72 horas para comunicar vulneraciones: exige actuar sin dilaciones indebidas bajo sus condiciones.

La designación de un delegado y el modelo de prevención tienen carácter voluntario en los artículos 49–50; la coordinación interna es una práctica recomendada. La evaluación de impacto del artículo 15 ter es condicional al alto riesgo y sus supuestos obligatorios. Los formatos de inventario, registro de actividades, capacitación y versionado interno son herramientas de gestión, no obligaciones importadas del RGPD. No se presume publicada ninguna decisión de adecuación, instrucción ni cláusula modelo de la Agencia.

Se conserva `legal_review_status=PENDING`: la consulta de fuentes y esta propuesta editorial no sustituyen validación jurídica profesional ni certifican cumplimiento. Revisar además normativa sectorial y el contexto concreto de cada organización. No se agregan IA ni comunicaciones externas al sistema.

## Autoría y actualización

La fuente editorial de esta revisión es `docs/catalog/privacy-controls.json`. `scripts/privacy-control-catalog.ts` produce el seed y la migración de esta revisión y permite comprobarlos con `--check`. Para cambios posteriores, crear una nueva migración; no reescribir migraciones ya aplicadas. El seed solo incorpora códigos ausentes y no sobrescribe datos existentes.

La migración sustituye únicamente textos del catálogo original que sigan intactos, con título original y revisión PENDING. Omite controles personalizados o revisados. No cambia identidades, configuración, controles propios, aplicaciones, respuestas, evidencias ni informes. Las evaluaciones anteriores conservan sus snapshots; nuevas evaluaciones copian el catálogo ampliado. No se convierte retroactivamente una evaluación en incumplidora ni se recalculan sus resultados. Los cambios del catálogo utilizan su auditoría existente; una migración de mantenimiento no se atribuye falsamente a un usuario de aplicación.

## Mapa de controles y referencias futuras

GESTION: práctica de gestión; MIXTO: obligación y criterio operativo; OBLIGACION: desarrollo de deber legal con condiciones y vigencia; CONDICIONAL: verificar supuesto de aplicación. Todos mantienen revisión jurídica pendiente.

| Código | Control                                     | Naturaleza  | Artículos de Ley 19.628 reformada            |
| ------ | ------------------------------------------- | ----------- | -------------------------------------------- |
| PR-001 | Responsable interno de privacidad           | GESTION     | 3 e), 14, 49 y 50                            |
| PR-002 | Funciones y responsabilidades documentadas  | GESTION     | 14, 14 bis, 15 bis y 49                      |
| PR-003 | Programa de privacidad                      | GESTION     | 3, 14, 48 y 49                               |
| PR-004 | Revisión periódica del programa             | GESTION     | 3 d) y e), 14 quinquies y 49                 |
| PR-005 | Inventario de sistemas con datos personales | GESTION     | 2, 3 e), 14 ter y 14 quinquies               |
| PR-006 | Categorías de datos documentadas            | MIXTO       | 2, 14 ter d), 16, 16 bis, 16 ter y 16 quáter |
| PR-007 | Fuentes de obtención identificadas          | MIXTO       | 3 a), 14 b) y 14 ter j)                      |
| PR-008 | Mapa de circulación de datos                | GESTION     | 3 e), 14 ter, 15, 15 bis y 27                |
| PR-009 | Registro de actividades                     | GESTION     | 3 e), 14 y 14 ter                            |
| PR-010 | Finalidades de tratamiento documentadas     | OBLIGACION  | 3 b), 12, 13 y 14 b)                         |
| PR-011 | Responsables de cada actividad              | GESTION     | 2, 3 e), 14 y 15 bis                         |
| PR-012 | Revisión de nuevas actividades              | GESTION     | 3, 14 quáter y 15 ter                        |
| PR-013 | Minimización de datos recopilados           | OBLIGACION  | 3 c) y 14 quáter                             |
| PR-014 | Exactitud y actualización                   | OBLIGACION  | 3 d), 6 y 14 c)                              |
| PR-015 | Uso compatible con la finalidad             | OBLIGACION  | 3 b), 12, 13 y 15                            |
| PR-016 | Gestión de proporcionalidad                 | MIXTO       | 3 c), 14 quáter, 14 quinquies y 15 ter       |
| PR-017 | Base de licitud documentada                 | OBLIGACION  | 3 a), 12, 13, 16 y 20                        |
| PR-018 | Registro del análisis de licitud            | MIXTO       | 3 a) y e), 12, 13 y 14 a)                    |
| PR-019 | Gestión del consentimiento                  | OBLIGACION  | 12, 14 ter k) y 16                           |
| PR-020 | Revisión de tratamientos sensibles          | CONDICIONAL | 16, 16 bis, 16 ter y 16 quáter               |
| PR-021 | Información a titulares                     | OBLIGACION  | 3 g), 12, 13 d) y 14 ter                     |
| PR-022 | Avisos en puntos de recopilación            | MIXTO       | 3 g), 12, 14 ter y 16 sexies                 |
| PR-023 | Aviso de privacidad del sitio web           | OBLIGACION  | 14 ter                                       |
| PR-024 | Información sobre cambios de finalidad      | OBLIGACION  | 3 b) y g), 12 y 14 ter                       |
| PR-025 | Canal de solicitudes de titulares           | MIXTO       | 4 a 11 y 14 ter c), f) y g)                  |
| PR-026 | Procedimiento de respuesta                  | OBLIGACION  | 4 a 11 y 41                                  |
| PR-027 | Verificación de identidad                   | MIXTO       | 11 y 14 quinquies                            |
| PR-028 | Criterios de conservación                   | OBLIGACION  | 3 c), 7, 14 ter i) y 16 quinquies            |
| PR-029 | Procedimiento de eliminación                | OBLIGACION  | 3 c), 7, 14 d) y 15 bis                      |
| PR-030 | Revisión de datos históricos                | MIXTO       | 3 c) y d), 7 y 16 quinquies                  |
| PR-031 | Inventario de proveedores                   | GESTION     | 14, 14 quinquies y 15 bis                    |
| PR-032 | Condiciones de tratamiento por proveedores  | OBLIGACION  | 14 bis, 14 quinquies y 15 bis                |
| PR-033 | Evaluación de proveedores                   | GESTION     | 14 quinquies y 15 bis                        |
| PR-034 | Identificación de transferencias            | MIXTO       | 14 ter h), 15, 15 bis y 27                   |
| PR-035 | Destinatarios de datos documentados         | OBLIGACION  | 5, 14 ter d), 15 y 15 bis                    |
| PR-036 | Análisis de transferencias internacionales  | CONDICIONAL | 27, 28 y 29; 14 ter h)                       |
| PR-037 | Gestión de accesos                          | MIXTO       | 3 f) y h), 14 bis y 14 quinquies             |
| PR-038 | Revisión de privilegios                     | GESTION     | 14 bis y 14 quinquies                        |
| PR-039 | Protección de respaldos                     | MIXTO       | 14 quinquies b) y c), 3 c)                   |
| PR-040 | Medidas de seguridad documentadas           | OBLIGACION  | 3 f), 14 quinquies y 14 septies              |
| PR-041 | Procedimiento de incidentes                 | OBLIGACION  | 14 quinquies y 14 sexies                     |
| PR-042 | Registro de incidentes                      | OBLIGACION  | 14 sexies                                    |
| PR-043 | Responsables de respuesta                   | GESTION     | 14 quinquies y 14 sexies                     |
| PR-044 | Revisión de proyectos nuevos                | MIXTO       | 14 quáter y 15 ter                           |
| PR-045 | Evaluación previa de riesgos                | CONDICIONAL | 14 quáter, 14 quinquies y 15 ter             |
| PR-046 | Configuración de privacidad                 | OBLIGACION  | 3 c) y 14 quáter                             |
| PR-047 | Formación del personal                      | GESTION     | 14 bis, 14 quinquies y 49                    |
| PR-048 | Registro de capacitaciones                  | GESTION     | 3 e), 14 bis, 14 quinquies y 49              |
| PR-049 | Inducción en privacidad                     | GESTION     | 14 bis y 14 quinquies                        |
| PR-050 | Repositorio documental                      | GESTION     | 3 e), 12, 14 y 14 quinquies                  |
| PR-051 | Versionado de documentos                    | GESTION     | 12, 14 ter a) y 3 e)                         |
| PR-052 | Revisión y aprobación documental            | GESTION     | 3 e), 14 ter y 14 quinquies                  |
