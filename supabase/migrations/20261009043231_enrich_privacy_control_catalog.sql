-- Revisión del catálogo inicial de 52 controles. No modifica snapshots ni definiciones personalizadas.
-- Fuentes y criterios: docs/catalog/privacy-controls.json y docs/references/control-catalog.md.
-- Solo sustituir el conjunto de textos originales sin revisión jurídica; conservar identidad y configuración.
with content(code,title,old_description,old_objective,description,objective,guidance,normative_reference) as (values
('PR-001','Responsable interno de privacidad','Revisar cómo la organización gestiona responsable interno de privacidad y registrar los antecedentes observados.','Documentar el estado de responsable interno de privacidad.','Alcance
Asignar una persona o función que coordine privacidad y permita escalar decisiones, sin confundirla con el responsable legal del tratamiento.

Cumplimiento esperado del control
1. Existe designación aprobada, con funciones, suplencia y canal de contacto.
2. Dispone de acceso a dirección, tiempo y recursos acordes al volumen y riesgo de los tratamientos.
3. Se distingue la coordinación interna del delegado de un modelo voluntario de prevención: este último exige revisar autonomía, idoneidad y conflictos de interés según el artículo 50.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Asignar una persona o función que coordine privacidad y permita escalar decisiones, sin confundirla con el responsable legal del tratamiento.','Evidencias sugeridas
Designación, organigrama, descripción de funciones, presupuesto o asignación de horas y ruta de escalamiento.

Cómo verificar
Entrevistar al designado y comprobar que puede tramitar una solicitud o incidente. La ley no impone contratar universalmente un delegado; el control de coordinación es una práctica de gestión.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 14, 49 y 50.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-002','Funciones y responsabilidades documentadas','Revisar cómo la organización gestiona funciones y responsabilidades documentadas y registrar los antecedentes observados.','Documentar el estado de funciones y responsabilidades documentadas.','Alcance
Distribuir responsabilidades entre dirección, áreas de negocio, tecnología, seguridad, recursos humanos y proveedores para evitar que una obligación quede sin dueño.

Cumplimiento esperado del control
1. Se identifica quién decide finalidades y medios y quién ejecuta instrucciones como encargado.
2. Cada actividad tiene responsables para licitud, transparencia, derechos, conservación y seguridad, con reemplazo ante ausencias.
3. Personal y terceros conocen los deberes de confidencialidad y sus límites de actuación, que se mantienen al terminar la relación.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Distribuir responsabilidades entre dirección, áreas de negocio, tecnología, seguridad, recursos humanos y proveedores para evitar que una obligación quede sin dueño.','Evidencias sugeridas
Matriz de responsabilidades, perfiles de cargo, acuerdos de confidencialidad y contratos de encargados.

Cómo verificar
Recorrer un proceso real y comprobar que las funciones documentadas coinciden con quienes actúan. Una matriz concreta es una herramienta recomendada, no un formato legal obligatorio.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7, 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14, 14 bis, 15 bis y 49.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-003','Programa de privacidad','Revisar cómo la organización gestiona programa de privacidad y registrar los antecedentes observados.','Documentar el estado de programa de privacidad.','Alcance
Organizar las acciones de privacidad en un programa proporcional al riesgo, que conecte inventario, bases de licitud, derechos, proveedores y medidas de protección.

Cumplimiento esperado del control
1. El programa delimita procesos y datos cubiertos y registra brechas priorizadas.
2. Cada acción tiene responsable, recursos, plazo y criterio verificable de cierre.
3. La dirección aprueba y sigue el avance, distinguiendo el programa interno de un modelo de prevención o certificación voluntarios, que requieren condiciones adicionales.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Organizar las acciones de privacidad en un programa proporcional al riesgo, que conecte inventario, bases de licitud, derechos, proveedores y medidas de protección.','Evidencias sugeridas
Programa aprobado, plan de acciones, presupuesto, seguimiento y actas de dirección.

Cómo verificar
Elegir acciones cerradas y verificar su ejecución efectiva. Tener un programa o usar este catálogo no equivale a una certificación ni demuestra por sí solo el cumplimiento de toda la ley.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 7, 9, 11 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3, 14, 48 y 49.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-004','Revisión periódica del programa','Revisar cómo la organización gestiona revisión periódica del programa y registrar los antecedentes observados.','Documentar el estado de revisión periódica del programa.','Alcance
Revisar la eficacia del programa cuando cambien procesos, proveedores, riesgos o normativa, y a intervalos definidos por la organización.

Cumplimiento esperado del control
1. Existe una frecuencia justificada por riesgo y revisión adicional tras incidentes o cambios relevantes.
2. La revisión contrasta documentos con tratamientos reales, derechos atendidos y controles de seguridad.
3. Se registran decisiones, responsables y cierre de las acciones correctivas.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Revisar la eficacia del programa cuando cambien procesos, proveedores, riesgos o normativa, y a intervalos definidos por la organización.','Evidencias sugeridas
Plan de revisión, informes internos, actas, indicadores y comprobantes de corrección.

Cómo verificar
Comparar la última revisión con cambios ocurridos después. No atribuir a la ley una frecuencia anual universal; la periodicidad de este programa es un criterio de gestión.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 d) y e), 14 quinquies y 49.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-005','Inventario de sistemas con datos personales','Revisar cómo la organización gestiona inventario de sistemas con datos personales y registrar los antecedentes observados.','Documentar el estado de inventario de sistemas con datos personales.','Alcance
Identificar dónde se recopilan, almacenan, consultan y eliminan datos personales, incluyendo sistemas propios, nube, planillas, correos, papel y dispositivos.

Cumplimiento esperado del control
1. El inventario identifica sistema o repositorio, dueño, ubicación, entorno y proveedor.
2. Relaciona cada sistema con actividad, categorías de datos y titulares, accesos, transferencias y conservación.
3. Incluye repositorios informales y copias y se actualiza al incorporar, modificar o retirar sistemas.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Identificar dónde se recopilan, almacenan, consultan y eliminan datos personales, incluyendo sistemas propios, nube, planillas, correos, papel y dispositivos.','Evidencias sugeridas
Inventario, diagramas de arquitectura, listado de aplicaciones, repositorios y contratos de nube.

Cómo verificar
Contrastar una muestra con compras, tecnología y áreas usuarias. El inventario es un medio de demostrar control, no un registro con formato legal universal.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 2, 11 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 2, 3 e), 14 ter y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-006','Categorías de datos documentadas','Revisar cómo la organización gestiona categorías de datos documentadas y registrar los antecedentes observados.','Documentar el estado de categorías de datos documentadas.','Alcance
Clasificar las categorías de información y de titulares para aplicar protección y requisitos de licitud acordes a su naturaleza.

Cumplimiento esperado del control
1. Cada actividad distingue datos identificatorios, contacto, laborales, financieros, sensibles y otras categorías que realmente utiliza.
2. Se detectan datos de salud, biometría, niños y adolescentes y se revisa su régimen especial.
3. La clasificación incluye datos inferidos o combinados y no considera anónimos los datos que aún permitan identificar o reidentificar a una persona.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Clasificar las categorías de información y de titulares para aplicar protección y requisitos de licitud acordes a su naturaleza.','Evidencias sugeridas
Diccionario de datos, formularios, esquema de bases, clasificación y análisis de datos especiales.

Cómo verificar
Revisar campos reales y muestras minimizadas; comprobar que clasificación y avisos coinciden. La clasificación documentada apoya obligaciones legales; no todos los ejemplos se aplican a toda organización.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 2 y 10 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 2, 14 ter d), 16, 16 bis, 16 ter y 16 quáter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-007','Fuentes de obtención identificadas','Revisar cómo la organización gestiona fuentes de obtención identificadas y registrar los antecedentes observados.','Documentar el estado de fuentes de obtención identificadas.','Alcance
Determinar la procedencia de los datos y comprobar que su obtención permite el tratamiento concreto que se pretende realizar.

Cumplimiento esperado del control
1. Se registra si los datos provienen del titular, un proveedor, otro responsable o una fuente pública.
2. Se conserva evidencia de origen, autorización o habilitación legal y condiciones de uso.
3. Se revisa la procedencia de listas compradas, datos importados y extracción desde internet, sin asumir que disponibilidad pública permite cualquier uso.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Determinar la procedencia de los datos y comprobar que su obtención permite el tratamiento concreto que se pretende realizar.','Evidencias sugeridas
Registro de fuentes, contratos de adquisición, formularios de origen y comprobación de habilitación.

Cómo verificar
Rastrear datos de una actividad hasta su fuente y verificar licitud. Las excepciones de fuentes públicas del régimen anterior no deben trasladarse automáticamente al régimen reformado.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 a), 14 b) y 14 ter j).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-008','Mapa de circulación de datos','Revisar cómo la organización gestiona mapa de circulación de datos y registrar los antecedentes observados.','Documentar el estado de mapa de circulación de datos.','Alcance
Representar el recorrido de datos desde su obtención hasta su eliminación, con accesos internos, proveedores, destinatarios, respaldos y países involucrados.

Cumplimiento esperado del control
1. El mapa cubre entradas, operaciones, salidas y copias de las actividades relevantes.
2. Distingue circulación interna, encargo y cesión a otro responsable e identifica transferencias internacionales.
3. Cada flujo se enlaza con propósito, fundamento, medidas y responsable de su autorización.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Representar el recorrido de datos desde su obtención hasta su eliminación, con accesos internos, proveedores, destinatarios, respaldos y países involucrados.','Evidencias sugeridas
Diagramas de flujo, integraciones, contratos, destinos de exportación y ubicaciones de nube.

Cómo verificar
Seguir una muestra de datos a través de una integración y verificar que no existan destinos omitidos. El diagrama es una herramienta de gestión, no una exigencia de formato específico.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 5, 8, 11 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 14 ter, 15, 15 bis y 27.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-009','Registro de actividades','Revisar cómo la organización gestiona registro de actividades y registrar los antecedentes observados.','Documentar el estado de registro de actividades.','Alcance
Mantener una relación de actividades de tratamiento suficientemente completa para demostrar qué se hace con los datos, por qué y bajo qué condiciones.

Cumplimiento esperado del control
1. Cada actividad registra finalidad, titulares, datos, origen, base de licitud y responsable.
2. Incluye sistemas, encargados, destinatarios, transferencias, conservación y medidas principales.
3. Las actividades nuevas o modificadas se incorporan y se relacionan con documentos y evidencias vigentes.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Mantener una relación de actividades de tratamiento suficientemente completa para demostrar qué se hace con los datos, por qué y bajo qué condiciones.','Evidencias sugeridas
Registro de actividades, inventario asociado, políticas y contratos vinculados.

Cómo verificar
Comparar el registro con procesos de ventas, personal y operación. Este catálogo propone un registro interno para rendición de cuentas; no importa automáticamente la obligación o el formato de un registro del RGPD europeo.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 9, 11 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 14 y 14 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-010','Finalidades de tratamiento documentadas','Revisar cómo la organización gestiona finalidades de tratamiento documentadas y registrar los antecedentes observados.','Documentar el estado de finalidades de tratamiento documentadas.','Alcance
Explicar la finalidad concreta de cada uso de datos, de forma que permita evaluar necesidad, licitud y coherencia con la información entregada al titular.

Cumplimiento esperado del control
1. Las finalidades están definidas por actividad y evitan expresiones abiertas como cualquier fin comercial.
2. Cada dato y operación se vincula con una finalidad específica, explícita y lícita.
3. Se separan usos distintos, como ejecutar un servicio, publicidad y análisis, y se controla cualquier reutilización.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Explicar la finalidad concreta de cada uso de datos, de forma que permita evaluar necesidad, licitud y coherencia con la información entregada al titular.','Evidencias sugeridas
Registro de actividades, formularios, avisos y análisis de finalidades.

Cómo verificar
Comparar usos reales con finalidades documentadas e informadas. Una finalidad comercial o conveniente no constituye por sí misma una base jurídica.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 9 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 b), 12, 13 y 14 b).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-011','Responsables de cada actividad','Revisar cómo la organización gestiona responsables de cada actividad y registrar los antecedentes observados.','Documentar el estado de responsables de cada actividad.','Alcance
Identificar quién responde por cada actividad y quién tiene autoridad para aprobar cambios, coordinar derechos y aplicar medidas de protección.

Cumplimiento esperado del control
1. Cada actividad tiene un dueño interno identificado y un contacto suplente.
2. Se distingue el responsable legal de quienes operan como encargados o áreas ejecutoras.
3. El dueño conoce sistemas, proveedores, plazos y obligaciones del proceso y puede exigir correcciones.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Identificar quién responde por cada actividad y quién tiene autoridad para aprobar cambios, coordinar derechos y aplicar medidas de protección.','Evidencias sugeridas
Registro de actividades con responsables, organigrama, designaciones y procedimientos.

Cómo verificar
Entrevistar al dueño de una actividad y simular una solicitud de corrección. La asignación interna no desplaza la responsabilidad legal de la organización.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 2 n) y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 2, 3 e), 14 y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-012','Revisión de nuevas actividades','Revisar cómo la organización gestiona revisión de nuevas actividades y registrar los antecedentes observados.','Documentar el estado de revisión de nuevas actividades.','Alcance
Revisar antes del inicio las actividades nuevas y los cambios relevantes en datos, finalidades, proveedores o tecnologías.

Cumplimiento esperado del control
1. Existe un punto de revisión previo al uso de datos en producción.
2. Se comprueban licitud, minimización, información, derechos, conservación y seguridad.
3. La revisión determina si hay alto riesgo o supuestos de evaluación de impacto obligatoria y registra aprobación, condiciones o rechazo.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Revisar antes del inicio las actividades nuevas y los cambios relevantes en datos, finalidades, proveedores o tecnologías.','Evidencias sugeridas
Ficha de revisión de cambios, aprobación de proyecto, análisis de riesgo y evaluación de impacto cuando corresponda.

Cómo verificar
Examinar un proyecto reciente y comprobar que la revisión precedió a su puesta en marcha. No todo cambio exige evaluación formal de impacto, pero sí debe examinarse su aplicabilidad.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3, 14 quáter y 15 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-013','Minimización de datos recopilados','Revisar cómo la organización gestiona minimización de datos recopilados y registrar los antecedentes observados.','Documentar el estado de minimización de datos recopilados.','Alcance
Limitar la recopilación y el uso a datos necesarios y adecuados para la finalidad, evitando campos, copias o accesos que no puedan justificarse.

Cumplimiento esperado del control
1. Cada campo obligatorio tiene una necesidad vinculada con la finalidad y la base aplicable.
2. Se eliminan campos y copias superfluos o se sustituyen por información menos identificable cuando permita cumplir el propósito.
3. Los formularios y valores predeterminados no habilitan recopilación adicional sin justificación.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Limitar la recopilación y el uso a datos necesarios y adecuados para la finalidad, evitando campos, copias o accesos que no puedan justificarse.','Evidencias sugeridas
Formularios antes y después, justificación de campos, esquemas y configuración de recopilación.

Cómo verificar
Elegir campos sensibles u opcionales y comprobar por qué se necesitan. La minimización explícita corresponde al régimen reformado; su antecedente actual se relaciona con finalidad y diligencia.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c) y 14 quáter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-014','Exactitud y actualización','Revisar cómo la organización gestiona exactitud y actualización y registrar los antecedentes observados.','Documentar el estado de exactitud y actualización.','Alcance
Mantener datos correctos, completos, actuales y pertinentes y corregirlos o bloquearlos cuando existan dudas fundadas sobre su exactitud.

Cumplimiento esperado del control
1. Se identifican datos cuya desactualización puede afectar al titular y mecanismos para corregirlos.
2. Las solicitudes y errores detectados se gestionan con trazabilidad y actualización de los sistemas relacionados.
3. Se comunican correcciones a destinatarios cuando corresponda y se evita seguir utilizando información objetada mientras deba bloquearse.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Mantener datos correctos, completos, actuales y pertinentes y corregirlos o bloquearlos cuando existan dudas fundadas sobre su exactitud.','Evidencias sugeridas
Procedimiento de calidad, registros de corrección, controles de validación y comunicaciones a destinatarios.

Cómo verificar
Probar una corrección de extremo a extremo, sin exponer datos reales innecesarios. Una revisión periódica no reemplaza la obligación de corregir errores conocidos.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 6, 9 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 d), 6 y 14 c).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-015','Uso compatible con la finalidad','Revisar cómo la organización gestiona uso compatible con la finalidad y registrar los antecedentes observados.','Documentar el estado de uso compatible con la finalidad.','Alcance
Evitar que datos obtenidos para un propósito se reutilicen en otro sin evaluar compatibilidad y la habilitación que permita ese nuevo tratamiento.

Cumplimiento esperado del control
1. Los usos secundarios se identifican antes de ejecutarlos y se comparan con la finalidad original.
2. La decisión documenta compatibilidad o el supuesto legal aplicable, incluida nueva autorización del titular cuando corresponda.
3. Los cambios aprobados se reflejan en avisos, registros, accesos y contratos, y los usos no habilitados se detienen.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Evitar que datos obtenidos para un propósito se reutilicen en otro sin evaluar compatibilidad y la habilitación que permita ese nuevo tratamiento.','Evidencias sugeridas
Análisis de compatibilidad, autorización del cambio, avisos y consentimientos adicionales cuando procedan.

Cómo verificar
Revisar usos de publicidad, analítica o intercambio de bases. Actualizar un aviso no legaliza por sí solo una finalidad incompatible.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 9 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 b), 12, 13 y 15.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-016','Gestión de proporcionalidad','Revisar cómo la organización gestiona gestión de proporcionalidad y registrar los antecedentes observados.','Documentar el estado de gestión de proporcionalidad.','Alcance
Justificar que el alcance del tratamiento y sus medidas sean proporcionados a la finalidad y a la afectación posible de los titulares.

Cumplimiento esperado del control
1. Se evalúan necesidad, volumen, precisión, acceso y duración de los datos usados.
2. Se comparan alternativas menos invasivas y se documenta la opción elegida.
3. Las medidas reducen riesgos de exposición, discriminación o vigilancia y se revisan si cambia el contexto.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Justificar que el alcance del tratamiento y sus medidas sean proporcionados a la finalidad y a la afectación posible de los titulares.','Evidencias sugeridas
Análisis de necesidad y proporcionalidad, alternativas descartadas y medidas de reducción de riesgo.

Cómo verificar
Examinar un tratamiento intensivo y comprobar justificación y salvaguardas. La ficha de análisis es recomendada; la necesidad y proporcionalidad forman parte de deberes del régimen reformado.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c), 14 quáter, 14 quinquies y 15 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-017','Base de licitud documentada','Revisar cómo la organización gestiona base de licitud documentada y registrar los antecedentes observados.','Documentar el estado de base de licitud documentada.','Alcance
Identificar una fuente de licitud válida para cada finalidad y operación, conforme al régimen temporal, tipo de dato y carácter público o privado del responsable.

Cumplimiento esperado del control
1. El fundamento se documenta por finalidad, con la disposición o evidencia que lo sustenta.
2. Se distingue consentimiento de habilitación legal y se verifican las condiciones de cada fuente, incluidas las reglas de datos sensibles y órganos públicos.
3. Contrato e interés legítimo del artículo 13 reformado no se invocan como nuevas bases generales antes del 1 de diciembre de 2026 ni como excepciones automáticas para datos sensibles.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Identificar una fuente de licitud válida para cada finalidad y operación, conforme al régimen temporal, tipo de dato y carácter público o privado del responsable.','Evidencias sugeridas
Matriz de licitud, contratos pertinentes, artículos legales, consentimientos y análisis especializado.

Cómo verificar
Comprobar una muestra de actividades frente a la ley vigente en la fecha de tratamiento. La conveniencia del negocio o una política interna no son bases de licitud.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 10 y 20 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 a), 12, 13, 16 y 20.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-018','Registro del análisis de licitud','Revisar cómo la organización gestiona registro del análisis de licitud y registrar los antecedentes observados.','Documentar el estado de registro del análisis de licitud.','Alcance
Conservar el razonamiento y los antecedentes que permiten demostrar por qué se considera lícito un tratamiento, más allá de escribir una etiqueta de base jurídica.

Cumplimiento esperado del control
1. El análisis identifica finalidad, datos, titular, régimen vigente y fundamento concreto.
2. Justifica necesidad contractual, obligación legal o ponderación del interés legítimo cuando esa fuente sea aplicable, con efectos sobre derechos y salvaguardas.
3. La aprobación, fecha, autor y revisión ante cambios quedan trazables y los antecedentes permiten sostener la decisión.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Conservar el razonamiento y los antecedentes que permiten demostrar por qué se considera lícito un tratamiento, más allá de escribir una etiqueta de base jurídica.','Evidencias sugeridas
Informes de licitud, disposiciones citadas, contratos, evaluación de interés legítimo y actas de aprobación.

Cómo verificar
Intentar reconstruir la decisión con los documentos conservados. No exigir un formato universal de ponderación ni tratar el análisis interno como dictamen jurídico definitivo.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 10, 11 y 20 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 a) y e), 12, 13 y 14 a).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-019','Gestión del consentimiento','Revisar cómo la organización gestiona gestión del consentimiento y registrar los antecedentes observados.','Documentar el estado de gestión del consentimiento.','Alcance
Obtener y poder demostrar el consentimiento cuando sea la fuente aplicable, y permitir su revocación sin mantener usos que dependan exclusivamente de él.

Cumplimiento esperado del control
1. Se informa finalidad y condiciones antes de consentir y se registra la manifestación, fecha, versión y alcance.
2. Hasta el 30 de noviembre de 2026 se observa la exigencia escrita del artículo 4 actual: desde el 1 de diciembre se prepara una manifestación previa, libre, informada, específica e inequívoca según el artículo 12.
3. La revocación se tramita por medios equivalentes, sencillos y gratuitos en el régimen reformado, con cese de los usos dependientes y registro de excepciones legales de conservación.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Obtener y poder demostrar el consentimiento cuando sea la fuente aplicable, y permitir su revocación sin mantener usos que dependan exclusivamente de él.','Evidencias sugeridas
Textos y versiones de consentimiento, prueba de aceptación y revocación, configuración y registro de ejecución.

Cómo verificar
Probar aceptación y retirada y verificar que no haya casillas premarcadas ni consentimiento innecesario impuesto para servicios. Revocar no tiene efecto retroactivo y no elimina otras obligaciones legales válidas.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 10 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 12, 14 ter k) y 16.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-020','Revisión de tratamientos sensibles','Revisar cómo la organización gestiona revisión de tratamientos sensibles y registrar los antecedentes observados.','Documentar el estado de revisión de tratamientos sensibles.','Alcance
Aplicar un examen reforzado a datos sensibles, salud, biometría y datos de niños o adolescentes, considerando restricciones específicas y riesgos para sus titulares.

Cumplimiento esperado del control
1. Se identifican los tratamientos especiales y la condición que los habilita, sin trasladar sin análisis las bases generales.
2. Se verifican consentimiento expreso o excepción legal pertinente, límites de finalidad y requisitos específicos de salud y biometría.
3. Para niños y adolescentes se revisan interés superior, edad, autonomía y autorización de representantes cuando corresponda, junto con medidas de acceso, conservación y seguridad reforzadas.

Naturaleza y aplicabilidad
Exigencia condicionada al tratamiento y a los supuestos legales; documentar su aplicabilidad antes de evaluar. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Aplicar un examen reforzado a datos sensibles, salud, biometría y datos de niños o adolescentes, considerando restricciones específicas y riesgos para sus titulares.','Evidencias sugeridas
Clasificación, análisis legal específico, autorizaciones de representantes y medidas reforzadas.

Cómo verificar
Revisar los campos y usos reales antes de declarar No aplica. No asumir que un consentimiento general autoriza cualquier tratamiento de salud ni que se aplican idénticas reglas a todas las edades.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 2 g) y 10 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 16, 16 bis, 16 ter y 16 quáter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-021','Información a titulares','Revisar cómo la organización gestiona información a titulares y registrar los antecedentes observados.','Documentar el estado de información a titulares.','Alcance
Entregar información clara y accesible que permita al titular comprender quién usa sus datos, para qué y cómo ejercer sus derechos.

Cumplimiento esperado del control
1. La información refleja responsable, datos, finalidades, fuentes de licitud, destinatarios y canales reales.
2. En preparación del artículo 14 ter se incluyen conservación, origen, derechos, reclamación, revocación, transferencias y decisiones automatizadas cuando correspondan.
3. El lenguaje y el medio son adecuados al público y el acceso es gratuito, sin esconder condiciones relevantes.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Entregar información clara y accesible que permita al titular comprender quién usa sus datos, para qué y cómo ejercer sus derechos.','Evidencias sugeridas
Avisos vigentes, canales publicados, capturas y prueba de accesibilidad.

Cómo verificar
Contrastar información publicada con una actividad real y preguntar a un usuario qué comprendió. El contenido detallado del artículo 14 ter pertenece al régimen desde el 1 de diciembre de 2026.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 3, 4 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 g), 12, 13 d) y 14 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-022','Avisos en puntos de recopilación','Revisar cómo la organización gestiona avisos en puntos de recopilación y registrar los antecedentes observados.','Documentar el estado de avisos en puntos de recopilación.','Alcance
Presentar información pertinente donde se obtienen datos, en formularios digitales, papel, llamadas, aplicaciones o puntos físicos.

Cumplimiento esperado del control
1. Cada punto de recopilación informa propósito y responsable y facilita acceso al detalle antes de la aceptación cuando se requiera consentimiento.
2. Se distinguen datos necesarios, voluntarios y usos adicionales y se incluyen avisos específicos cuando corresponda, como geolocalización.
3. El aviso es legible, accesible y coherente con el texto completo y con el tratamiento efectivo.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Presentar información pertinente donde se obtienen datos, en formularios digitales, papel, llamadas, aplicaciones o puntos físicos.','Evidencias sugeridas
Inventario de puntos de captura, formularios, guiones, carteles y versiones de avisos.

Cómo verificar
Recorrer la captura como titular y comprobar que la información llega oportunamente. Un aviso por capas es una técnica recomendada, no un diseño universal impuesto por la ley.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 3 y 4 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 g), 12, 14 ter y 16 sexies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-023','Aviso de privacidad del sitio web','Revisar cómo la organización gestiona aviso de privacidad del sitio web y registrar los antecedentes observados.','Documentar el estado de aviso de privacidad del sitio web.','Alcance
Mantener la información pública de privacidad en el sitio web o en un medio equivalente permitido, de manera actualizada y fácil de encontrar.

Cumplimiento esperado del control
1. El aviso identifica al responsable, representante y delegado si existe, junto con medios de contacto utilizables.
2. Incluye los contenidos aplicables del artículo 14 ter: política y versión, datos y titulares, fines y licitud, destinatarios, seguridad, derechos, reclamación, origen y conservación.
3. Añade garantías y países de transferencias, revocación y decisiones automatizadas cuando existan, y describe seguridad sin publicar secretos operativos.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Mantener la información pública de privacidad en el sitio web o en un medio equivalente permitido, de manera actualizada y fácil de encontrar.','Evidencias sugeridas
URL o medio equivalente, texto aprobado, fecha y versión, revisión de enlaces y concordancia con el inventario.

Cómo verificar
Probar acceso sin iniciar sesión y el contacto publicado. No exigir tener un sitio web si procede un medio equivalente; la obligación detallada del artículo 14 ter rige desde diciembre de 2026.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-024','Información sobre cambios de finalidad','Revisar cómo la organización gestiona información sobre cambios de finalidad y registrar los antecedentes observados.','Documentar el estado de información sobre cambios de finalidad.','Alcance
Comunicar cambios relevantes de propósito y revisar la licitud de la reutilización antes de comenzar a tratar datos bajo las nuevas condiciones.

Cumplimiento esperado del control
1. Existe análisis previo de compatibilidad y fundamento del nuevo uso.
2. Se actualizan avisos y documentos y se informa de forma comprensible a titulares afectados según el caso.
3. Cuando se requiere un consentimiento nuevo, se obtiene y acredita antes del uso, y quienes no lo otorgan quedan excluidos de ese uso.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Comunicar cambios relevantes de propósito y revisar la licitud de la reutilización antes de comenzar a tratar datos bajo las nuevas condiciones.','Evidencias sugeridas
Análisis de cambio, versiones de avisos, comunicaciones y consentimiento cuando sea necesario.

Cómo verificar
Comparar fecha de autorización e información con inicio del nuevo uso. Una comunicación unilateral no sustituye una base jurídica ni el consentimiento exigible.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 9 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 b) y g), 12 y 14 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-025','Canal de solicitudes de titulares','Revisar cómo la organización gestiona canal de solicitudes de titulares y registrar los antecedentes observados.','Documentar el estado de canal de solicitudes de titulares.','Alcance
Habilitar un canal conocido y utilizable para ejercer derechos y derivar cada solicitud a una persona con capacidad de resolverla.

Cumplimiento esperado del control
1. El contacto está publicado y admite solicitudes sin obstáculos injustificados ni cobros por tramitación.
2. Se registra recepción, tipo de derecho, responsable y estado y se orienta al titular sin exigir información ajena a su solicitud.
3. El procedimiento distingue derechos y vías judiciales actuales de los derechos y reclamaciones ante la Agencia del régimen reformado.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Habilitar un canal conocido y utilizable para ejercer derechos y derivar cada solicitud a una persona con capacidad de resolverla.','Evidencias sugeridas
Canal publicado, registros de solicitudes, acuses, instrucciones y pruebas de recepción.

Cómo verificar
Enviar una solicitud de prueba y comprobar su recepción y trazabilidad. La obligación se refiere a los derechos aplicables; no se exige una plataforma tecnológica específica.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 12, 13 y 16 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 4 a 11 y 14 ter c), f) y g).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-026','Procedimiento de respuesta','Revisar cómo la organización gestiona procedimiento de respuesta y registrar los antecedentes observados.','Documentar el estado de procedimiento de respuesta.','Alcance
Responder solicitudes de titulares con decisión fundada, dentro de los plazos aplicables, ejecutando los cambios y comunicándolos cuando corresponda.

Cumplimiento esperado del control
1. Para el régimen actual se contempla que la falta de pronunciamiento en dos días hábiles habilita el amparo judicial del artículo 16.
2. Desde el 1 de diciembre de 2026 se prepara respuesta en 30 días corridos, prorrogable una sola vez hasta otros 30, y gestión del bloqueo temporal fundada con respuesta en dos días hábiles según el artículo 11.
3. Se conservan solicitud, verificación, decisión, fecha, ejecución y envío íntegro, se fundamentan denegaciones y se informa la vía de reclamación aplicable, con aviso a destinatarios si procede.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Responder solicitudes de titulares con decisión fundada, dentro de los plazos aplicables, ejecutando los cambios y comunicándolos cuando corresponda.','Evidencias sugeridas
Procedimiento con plazos por régimen, expedientes minimizados, calendario, respuestas y comprobantes de ejecución.

Cómo verificar
Revisar casos de acceso, rectificación y supresión, y simular vencimiento y bloqueo. No confundir días corridos con hábiles ni aplicar anticipadamente el plazo más amplio de la reforma.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 12 a 16 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 4 a 11 y 41.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-027','Verificación de identidad','Revisar cómo la organización gestiona verificación de identidad y registrar los antecedentes observados.','Documentar el estado de verificación de identidad.','Alcance
Verificar identidad y representación antes de entregar o modificar datos, con mecanismos proporcionales que no creen barreras ni recopilen información excesiva.

Cumplimiento esperado del control
1. Se valida que quien solicita sea el titular o su representante y que el mandato cubra la gestión cuando corresponda.
2. El método considera riesgo y canal, limita copias de identidad y protege sus registros.
3. Se identifica el destino seguro de respuesta y se documenta la comprobación sin conservar más datos de los necesarios, atendiendo las instrucciones aplicables de la Agencia desde el nuevo régimen.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Verificar identidad y representación antes de entregar o modificar datos, con mecanismos proporcionales que no creen barreras ni recopilen información excesiva.','Evidencias sugeridas
Protocolo de identificación, verificaciones, mandatos y canales de respuesta.

Cómo verificar
Simular solicitud de un tercero y una representación válida. No exigir siempre una copia íntegra de la cédula si otro método suficiente está disponible.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 a 13 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 11 y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-028','Criterios de conservación','Revisar cómo la organización gestiona criterios de conservación y registrar los antecedentes observados.','Documentar el estado de criterios de conservación.','Alcance
Definir cuánto tiempo se conserva cada categoría de datos, desde qué hito se cuenta y qué fundamento permite ese plazo.

Cumplimiento esperado del control
1. Cada actividad tiene plazo o criterio determinable y responsable de ejecutarlo.
2. Se distinguen necesidad de la finalidad, mandatos legales, defensa de derechos y excepciones específicas, con acceso limitado mientras proceda conservar.
3. Al terminar el fundamento se elimina o anonimiza de forma efectiva y los plazos informados coinciden con la práctica.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Definir cuánto tiempo se conserva cada categoría de datos, desde qué hito se cuenta y qué fundamento permite ese plazo.','Evidencias sugeridas
Tabla de conservación, normas sectoriales verificadas, contratos, reglas de archivo y calendario.

Cómo verificar
Revisar una categoría con antigüedad superior al plazo y comprobar su destino. No fijar un plazo único para todos los datos ni conservar indefinidamente por conveniencia.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 6, 9 y 15 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c), 7, 14 ter i) y 16 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-029','Procedimiento de eliminación','Revisar cómo la organización gestiona procedimiento de eliminación y registrar los antecedentes observados.','Documentar el estado de procedimiento de eliminación.','Alcance
Eliminar o anonimizar datos cuando corresponda, cubriendo sistemas, documentos, encargados y copias y evitando su reintroducción tras una restauración.

Cumplimiento esperado del control
1. El procedimiento identifica datos, fundamento, alcance y excepciones legales antes de actuar.
2. La ejecución alcanza repositorios y proveedores y documenta borrado, devolución o anonimización verificable.
3. Los respaldos tienen vencimiento, acceso restringido y controles para no restituir al uso ordinario datos ya eliminados, con limitaciones justificadas y trazables.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Eliminar o anonimizar datos cuando corresponda, cubriendo sistemas, documentos, encargados y copias y evitando su reintroducción tras una restauración.','Evidencias sugeridas
Procedimiento, órdenes y comprobantes de eliminación, acuerdos con proveedores y pruebas de restauración.

Cómo verificar
Seguir una eliminación hasta copias y encargados. Marcar inactivo o quitar un nombre no equivale necesariamente a borrar ni anonimizar.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 6 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c), 7, 14 d) y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-030','Revisión de datos históricos','Revisar cómo la organización gestiona revisión de datos históricos y registrar los antecedentes observados.','Documentar el estado de revisión de datos históricos.','Alcance
Revisar información antigua, archivos migrados y repositorios sin uso para detectar datos caducos, innecesarios o retenidos sin fundamento.

Cumplimiento esperado del control
1. Se identifican archivos históricos, copias y sistemas retirados con fecha y dueño.
2. Se decide conservar, corregir, restringir, eliminar o anonimizar con fundamento documentado.
3. Si se invocan fines históricos, estadísticos o científicos del régimen reformado, se verifican sus condiciones específicas y se anonimizan los resultados que se publiquen.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Revisar información antigua, archivos migrados y repositorios sin uso para detectar datos caducos, innecesarios o retenidos sin fundamento.','Evidencias sugeridas
Inventario histórico, muestreo de antigüedad, decisiones de depuración y comprobantes.

Cómo verificar
Revisar carpetas y sistemas heredados y comprobar que histórico no se usa como justificación automática de conservación indefinida.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 6 y 9 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c) y d), 7 y 16 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-031','Inventario de proveedores','Revisar cómo la organización gestiona inventario de proveedores y registrar los antecedentes observados.','Documentar el estado de inventario de proveedores.','Alcance
Identificar proveedores que tratan o pueden acceder a datos personales, incluyendo soporte, almacenamiento, servicios externos y subencargados.

Cumplimiento esperado del control
1. El inventario indica servicio, datos, sistemas, contactos, países y duración.
2. Se distingue encargado de otro responsable y se identifican subcontrataciones y permisos de acceso.
3. Se relacionan contratos, evaluación de riesgo, garantías y fecha de revisión para cada proveedor.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Identificar proveedores que tratan o pueden acceder a datos personales, incluyendo soporte, almacenamiento, servicios externos y subencargados.','Evidencias sugeridas
Inventario de proveedores, compras, contratos, cuentas de soporte y lista de subencargados.

Cómo verificar
Comparar el inventario con pagos, integraciones y accesos reales. El listado es una práctica para controlar obligaciones; no todos los proveedores son encargados.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14, 14 quinquies y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-032','Condiciones de tratamiento por proveedores','Revisar cómo la organización gestiona condiciones de tratamiento por proveedores y registrar los antecedentes observados.','Documentar el estado de condiciones de tratamiento por proveedores.','Alcance
Formalizar por escrito las instrucciones y condiciones del tratamiento por encargados, sin permitir que el proveedor determine usos propios no autorizados.

Cumplimiento esperado del control
1. El contrato precisa objeto, duración, finalidad, datos, titulares y derechos y obligaciones de las partes.
2. Incluye instrucciones, confidencialidad, seguridad, apoyo a derechos, comunicación de incidentes y devolución o supresión al terminar.
3. La subdelegación dispone de autorización previa, específica y escrita en el régimen reformado y mantiene las responsabilidades y condiciones pertinentes.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Formalizar por escrito las instrucciones y condiciones del tratamiento por encargados, sin permitir que el proveedor determine usos propios no autorizados.','Evidencias sugeridas
Contrato o mandato firmado, anexos de tratamiento, instrucciones y autorizaciones de subdelegación.

Cómo verificar
Contrastar una operación real con el contrato y verificar cierre de servicio. Un acuerdo de confidencialidad aislado no reemplaza las condiciones del encargo.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7, 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 bis, 14 quinquies y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-033','Evaluación de proveedores','Revisar cómo la organización gestiona evaluación de proveedores y registrar los antecedentes observados.','Documentar el estado de evaluación de proveedores.','Alcance
Comprobar antes y durante la contratación que el proveedor puede cumplir las instrucciones y ofrecer protección acorde al riesgo.

Cumplimiento esperado del control
1. La evaluación considera tipo y volumen de datos, acceso, ubicación, subcontratación e historial relevante.
2. Se verifican medidas y capacidades reales, con acciones sobre brechas y decisión de aceptar, restringir o sustituir.
3. Se revisa al cambiar el servicio o ante incidentes y se mantiene evidencia de seguimiento.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Comprobar antes y durante la contratación que el proveedor puede cumplir las instrucciones y ofrecer protección acorde al riesgo.','Evidencias sugeridas
Cuestionarios, informes, pruebas, compromisos correctivos y decisión de contratación.

Cómo verificar
Examinar un proveedor de riesgo alto y verificar sus garantías. No exigir una certificación comercial específica como requisito universal de la ley.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quinquies y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-034','Identificación de transferencias','Revisar cómo la organización gestiona identificación de transferencias y registrar los antecedentes observados.','Documentar el estado de identificación de transferencias.','Alcance
Detectar comunicaciones, cesiones y transferencias al exterior, incluyendo accesos remotos, nube, soporte y flujos dentro de grupos empresariales.

Cumplimiento esperado del control
1. Se identifican datos, emisor, receptor, propósito, frecuencia, país y forma de acceso.
2. Cada flujo se clasifica como encargo, cesión o transferencia internacional y se conecta con habilitación y garantías.
3. No se presume que pertenecer al mismo grupo, usar nube o cifrar elimina la necesidad de análisis.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Detectar comunicaciones, cesiones y transferencias al exterior, incluyendo accesos remotos, nube, soporte y flujos dentro de grupos empresariales.','Evidencias sugeridas
Mapa de transferencias, contratos, ubicaciones de almacenamiento y soporte, integraciones.

Cómo verificar
Revisar dónde operan proveedores y personal con acceso. El inventario es soporte de gestión de las obligaciones específicas de cada flujo.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 5 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 ter h), 15, 15 bis y 27.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-035','Destinatarios de datos documentados','Revisar cómo la organización gestiona destinatarios de datos documentados y registrar los antecedentes observados.','Documentar el estado de destinatarios de datos documentados.','Alcance
Conocer a quién se comunican datos y bajo qué finalidad y condiciones, distinguiendo al destinatario que decide usos propios del encargado.

Cumplimiento esperado del control
1. Los destinatarios o sus categorías se identifican por actividad y en la información al titular cuando corresponda.
2. Se documenta la base de la cesión y el instrumento escrito o electrónico del régimen reformado con partes, datos y finalidad.
3. Se limita el intercambio al alcance autorizado y se pueden comunicar rectificaciones, supresiones u oposiciones a receptores pertinentes.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Conocer a quién se comunican datos y bajo qué finalidad y condiciones, distinguiendo al destinatario que decide usos propios del encargado.','Evidencias sugeridas
Registro de destinatarios, instrumentos de cesión, contratos de encargo y comunicaciones de actualización.

Cómo verificar
Rastrear una cesión y verificar destinatario, propósito y fundamento. No tratar como encargado a quien decide sus propias finalidades.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 5 y 12 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 5, 14 ter d), 15 y 15 bis.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-036','Análisis de transferencias internacionales','Revisar cómo la organización gestiona análisis de transferencias internacionales y registrar los antecedentes observados.','Documentar el estado de análisis de transferencias internacionales.','Alcance
Evaluar la habilitación y garantías antes de transferir datos a otros países, además de la licitud general del tratamiento.

Cumplimiento esperado del control
1. Se identifican país, receptor, finalidad, frecuencia y transferencias posteriores.
2. Desde el nuevo régimen se acredita adecuación o garantías válidas mediante instrumentos, reglas corporativas o mecanismos previstos por los artículos 27 y 28, comprobando las decisiones o aprobaciones que correspondan.
3. Las excepciones sin adecuación ni garantías se analizan para transferencias específicas y no habituales, sin usar un consentimiento genérico para justificar servicios recurrentes.

Naturaleza y aplicabilidad
Exigencia condicionada al tratamiento y a los supuestos legales; documentar su aplicabilidad antes de evaluar. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Evaluar la habilitación y garantías antes de transferir datos a otros países, además de la licitud general del tratamiento.','Evidencias sugeridas
Análisis por flujo, decisión de adecuación aplicable, cláusulas y garantías, autorizaciones y aviso al titular.

Cómo verificar
Comprobar garantías y derechos exigibles con asesoría especializada. No presumir publicada una lista de países o aprobadas cláusulas por la Agencia sin verificarlo. No aplica exige demostrar ausencia de transferencias.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 5, 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 27, 28 y 29; 14 ter h).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-037','Gestión de accesos','Revisar cómo la organización gestiona gestión de accesos y registrar los antecedentes observados.','Documentar el estado de gestión de accesos.','Alcance
Restringir acceso a datos personales a personas y servicios autorizados según funciones y riesgo, desde el alta hasta la baja.

Cumplimiento esperado del control
1. Las cuentas y permisos tienen dueño, autorización y alcance mínimo necesario.
2. Se controlan altas, cambios, bajas, cuentas de servicio y accesos de terceros y se evita compartir credenciales personales.
3. Se aplican autenticación y trazabilidad adecuadas al riesgo, con protección especial de accesos administrativos y datos sensibles.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Restringir acceso a datos personales a personas y servicios autorizados según funciones y riesgo, desde el alta hasta la baja.','Evidencias sugeridas
Matriz de accesos, altas y bajas, configuración de autenticación y registros de acceso.

Cómo verificar
Probar que una cuenta sin autorización no accede y que una baja retira permisos. MFA y otras tecnologías son medidas a justificar por riesgo, no una marca o solución universal prescrita por la ley.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 f) y h), 14 bis y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-038','Revisión de privilegios','Revisar cómo la organización gestiona revisión de privilegios y registrar los antecedentes observados.','Documentar el estado de revisión de privilegios.','Alcance
Revisar privilegios existentes para retirar accesos innecesarios, acumulados o incompatibles con la función actual.

Cumplimiento esperado del control
1. La revisión tiene frecuencia definida por riesgo y cubre cuentas inactivas, terceros, servicios y administradores.
2. El dueño del proceso confirma necesidad y se corrigen excesos con fecha y responsable.
3. Cambios de función y desvinculaciones disparan revisión sin esperar al ciclo ordinario.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Revisar privilegios existentes para retirar accesos innecesarios, acumulados o incompatibles con la función actual.','Evidencias sugeridas
Recertificación de permisos, listados de cuentas, solicitudes y pruebas de retiro.

Cómo verificar
Muestrear un permiso retirado y uno mantenido. La frecuencia y el formato de recertificación son criterios de gestión; la protección efectiva de acceso es el deber subyacente.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 bis y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-039','Protección de respaldos','Revisar cómo la organización gestiona protección de respaldos y registrar los antecedentes observados.','Documentar el estado de protección de respaldos.','Alcance
Proteger copias de respaldo y comprobar que permitan recuperar disponibilidad e integridad sin ampliar indebidamente acceso o conservación.

Cumplimiento esperado del control
1. Los respaldos tienen alcance, frecuencia, ubicación, plazo y responsables según riesgo.
2. Se restringe acceso y se aplican protección del medio, cifrado o separación cuando corresponda, con control de proveedores y países.
3. Se prueba restauración y se evita reactivar datos borrados o privilegios revocados después de una recuperación.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Proteger copias de respaldo y comprobar que permitan recuperar disponibilidad e integridad sin ampliar indebidamente acceso o conservación.','Evidencias sugeridas
Política de respaldos, configuración, bitácoras, control de acceso y pruebas de recuperación.

Cómo verificar
Restaurar una muestra en entorno controlado y revisar antigüedad de copias. Cifrado y otros medios se seleccionan según riesgo y estado de la técnica, sin exigir una arquitectura única.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quinquies b) y c), 3 c).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-040','Medidas de seguridad documentadas','Revisar cómo la organización gestiona medidas de seguridad documentadas y registrar los antecedentes observados.','Documentar el estado de medidas de seguridad documentadas.','Alcance
Establecer medidas técnicas y organizativas capaces de proteger confidencialidad, integridad, disponibilidad y resiliencia de los datos.

Cumplimiento esperado del control
1. El análisis considera naturaleza, volumen, contexto, finalidad, tecnología, costos y probabilidad y gravedad de riesgos para titulares.
2. Las medidas están implementadas y se comprueban periódicamente, incluyendo prevención de acceso indebido, recuperación y gestión de vulnerabilidades según corresponda.
3. Se registran responsables, resultados de pruebas, brechas y correcciones y se revisan instrucciones diferenciadas de la Agencia cuando sean aplicables.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Establecer medidas técnicas y organizativas capaces de proteger confidencialidad, integridad, disponibilidad y resiliencia de los datos.','Evidencias sugeridas
Análisis de riesgos, política, configuraciones, pruebas de seguridad y planes correctivos.

Cómo verificar
Verificar funcionamiento mediante muestras, no solo existencia de políticas. No asumir que certificación ISO, cifrado universal o un producto concreto garantizan cumplimiento.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 f), 14 quinquies y 14 septies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-041','Procedimiento de incidentes','Revisar cómo la organización gestiona procedimiento de incidentes y registrar los antecedentes observados.','Documentar el estado de procedimiento de incidentes.','Alcance
Disponer de un procedimiento para detectar, contener, investigar y remediar vulneraciones de seguridad y decidir las comunicaciones legalmente exigibles.

Cumplimiento esperado del control
1. El procedimiento define detección, preservación de antecedentes, contención, evaluación y recuperación con responsables y escalamiento.
2. Desde el régimen reformado contempla comunicar a la Agencia sin dilaciones indebidas cuando exista riesgo razonable para derechos y libertades, sin inventar un plazo general de 72 horas.
3. Contempla comunicación adicional a titulares o representantes para los supuestos del artículo 14 sexies, como datos sensibles, niños menores de catorce años o datos económicos, financieros, bancarios o comerciales, y obligaciones sectoriales.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Disponer de un procedimiento para detectar, contener, investigar y remediar vulneraciones de seguridad y decidir las comunicaciones legalmente exigibles.','Evidencias sugeridas
Plan de respuesta, matriz de decisión, contactos, simulacros y modelos de comunicación.

Cómo verificar
Simular una vulneración y documentar evaluación de riesgo y decisión de comunicar. Este control describe un proceso de la organización; no incorpora envíos externos en PrivacyAudit.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quinquies y 14 sexies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-042','Registro de incidentes','Revisar cómo la organización gestiona registro de incidentes y registrar los antecedentes observados.','Documentar el estado de registro de incidentes.','Alcance
Registrar antecedentes y decisiones de incidentes para reconstruir qué ocurrió, cómo se protegieron los titulares y qué mejoras se ejecutaron.

Cumplimiento esperado del control
1. Cada caso identifica fechas, naturaleza, efectos, categorías de datos y cantidad aproximada de afectados cuando se conozca.
2. Se conservan decisiones de riesgo, contención, recuperación y medidas preventivas junto con las comunicaciones exigidas y su envío.
3. El registro limita acceso y retención de datos del incidente y distingue hechos confirmados, hipótesis y actualizaciones.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Registrar antecedentes y decisiones de incidentes para reconstruir qué ocurrió, cómo se protegieron los titulares y qué mejoras se ejecutaron.','Evidencias sugeridas
Registro de incidentes y comunicaciones, cronología, informe técnico y comprobantes de acciones.

Cómo verificar
Reconstruir un caso cerrado y verificar su consistencia. El artículo 14 sexies exige registrar las comunicaciones con sus antecedentes; extender el registro a todo incidente es una práctica recomendada.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 sexies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-043','Responsables de respuesta','Revisar cómo la organización gestiona responsables de respuesta y registrar los antecedentes observados.','Documentar el estado de responsables de respuesta.','Alcance
Asignar y preparar a quienes coordinan respuesta técnica, decisiones legales, comunicaciones y relación con proveedores ante un incidente.

Cumplimiento esperado del control
1. Existe equipo o funciones designadas con suplencia y contactos disponibles.
2. Se define quién evalúa riesgo, autoriza medidas y realiza comunicaciones requeridas, con participación de dirección según impacto.
3. Los proveedores conocen su obligación de avisar al responsable y el equipo practica escalamiento y respuesta.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Asignar y preparar a quienes coordinan respuesta técnica, decisiones legales, comunicaciones y relación con proveedores ante un incidente.','Evidencias sugeridas
Roles de respuesta, contactos, acuerdos con proveedores, actas y simulacros.

Cómo verificar
Activar un ejercicio fuera de la operación habitual y comprobar disponibilidad y decisiones. La composición del equipo es proporcional al contexto, no un número de cargos exigido universalmente.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quinquies y 14 sexies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-044','Revisión de proyectos nuevos','Revisar cómo la organización gestiona revisión de proyectos nuevos y registrar los antecedentes observados.','Documentar el estado de revisión de proyectos nuevos.','Alcance
Integrar protección de datos en el diseño de proyectos, productos, adquisiciones y modificaciones antes de tratar datos y durante su operación.

Cumplimiento esperado del control
1. El proceso revisa finalidades, licitud, minimización, derechos, proveedores y conservación antes del lanzamiento.
2. Las especificaciones incorporan controles técnicos y organizativos y se comprueba su implementación.
3. Se registran riesgos pendientes y condiciones de aprobación y se determina si corresponde evaluación de impacto.

Naturaleza y aplicabilidad
Combina obligaciones legales con criterios operativos recomendados para demostrar su ejecución. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Integrar protección de datos en el diseño de proyectos, productos, adquisiciones y modificaciones antes de tratar datos y durante su operación.','Evidencias sugeridas
Checklist de diseño, requisitos de proyecto, revisiones y pruebas de aceptación.

Cómo verificar
Seleccionar un proyecto y seguir un requisito de privacidad hasta su prueba. El checklist es soporte recomendado; la protección desde el diseño es un deber del régimen reformado.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quáter y 15 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-045','Evaluación previa de riesgos','Revisar cómo la organización gestiona evaluación previa de riesgos y registrar los antecedentes observados.','Documentar el estado de evaluación previa de riesgos.','Alcance
Evaluar riesgos para derechos y libertades antes de iniciar un tratamiento y realizar una evaluación de impacto cuando sea obligatoria.

Cumplimiento esperado del control
1. El examen identifica naturaleza, alcance, contexto, finalidad y riesgos y decide documentadamente si el tratamiento puede producir alto riesgo.
2. Se realiza previamente una evaluación de impacto en supuestos obligatorios del artículo 15 ter: evaluación sistemática y exhaustiva basada en tratamiento automatizado con efectos jurídicos significativos, tratamiento a gran escala, observación o monitoreo sistemático de zonas de acceso público o datos sensibles y especialmente protegidos en supuestos de excepción al consentimiento.
3. La evaluación describe operaciones y fines, necesidad y proporcionalidad, riesgos y mitigaciones, considera listas e instrucciones aplicables de la Agencia y registra decisión y seguimiento.

Naturaleza y aplicabilidad
Exigencia condicionada al tratamiento y a los supuestos legales; documentar su aplicabilidad antes de evaluar. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Evaluar riesgos para derechos y libertades antes de iniciar un tratamiento y realizar una evaluación de impacto cuando sea obligatoria.','Evidencias sugeridas
Examen de aplicabilidad, evaluación de impacto cuando proceda, mitigaciones y aprobación previa.

Cómo verificar
Comprobar que la evaluación precede al inicio y que las medidas se ejecutaron. No exigir evaluación formal para todo proyecto ni declarar No aplica sin analizar los supuestos legales.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 quáter, 14 quinquies y 15 ter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-046','Configuración de privacidad','Revisar cómo la organización gestiona configuración de privacidad y registrar los antecedentes observados.','Documentar el estado de configuración de privacidad.','Alcance
Configurar sistemas para tratar por defecto solo los datos necesarios y limitar exposición, duración y accesibilidad desde su primera utilización.

Cumplimiento esperado del control
1. Los valores iniciales restringen recopilación, uso, conservación y acceso al mínimo requerido por finalidad.
2. Las funciones opcionales, exportaciones y visibilidad se habilitan deliberadamente con autorización y fundamento.
3. Se comprueban valores por defecto tras cambios de versión y en cuentas nuevas, sin depender de que el titular corrija configuraciones excesivas.

Naturaleza y aplicabilidad
Desarrolla obligaciones legales; aplicar las condiciones y el régimen temporal de la referencia normativa. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Configurar sistemas para tratar por defecto solo los datos necesarios y limitar exposición, duración y accesibilidad desde su primera utilización.','Evidencias sugeridas
Configuraciones iniciales, especificaciones, capturas y pruebas con cuentas nuevas.

Cómo verificar
Crear una cuenta o instancia de prueba y verificar qué datos quedan accesibles y por cuánto tiempo. La protección por defecto no se limita a tener un aviso o una opción de baja.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 9 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 c) y 14 quáter.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-047','Formación del personal','Revisar cómo la organización gestiona formación del personal y registrar los antecedentes observados.','Documentar el estado de formación del personal.','Alcance
Preparar al personal para reconocer y ejecutar sus obligaciones de privacidad en las tareas que realmente desempeña.

Cumplimiento esperado del control
1. La formación adapta contenidos a funciones y riesgo: confidencialidad, uso permitido, derechos, incidentes y manejo seguro.
2. Incluye ejemplos operativos y verifica comprensión o capacidad de actuar.
3. Se actualiza por cambios relevantes y se ofrecen refuerzos cuando se detectan errores.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Preparar al personal para reconocer y ejecutar sus obligaciones de privacidad en las tareas que realmente desempeña.','Evidencias sugeridas
Plan de formación, materiales por rol, participación y ejercicios de comprensión.

Cómo verificar
Preguntar al personal cómo reporta una pérdida o atiende una solicitud. La ley sustenta deberes de protección; no establece universalmente horas anuales o un curso comercial concreto.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 bis, 14 quinquies y 49.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-048','Registro de capacitaciones','Revisar cómo la organización gestiona registro de capacitaciones y registrar los antecedentes observados.','Documentar el estado de registro de capacitaciones.','Alcance
Conservar constancia suficiente de la formación impartida para identificar cobertura, pendientes y necesidades de refuerzo.

Cumplimiento esperado del control
1. El registro identifica contenido y versión, fecha, participantes o grupos, rol e instructor o medio.
2. Permite detectar personal no formado y documenta seguimiento y comprobación de comprensión.
3. Se protege el registro como dato personal y se conserva con plazo y acceso justificados.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Conservar constancia suficiente de la formación impartida para identificar cobertura, pendientes y necesidades de refuerzo.','Evidencias sugeridas
Registro de asistencia, contenidos, evaluaciones y seguimiento de pendientes.

Cómo verificar
Conciliar una muestra de personas con funciones de riesgo frente al registro. La asistencia es evidencia de gestión y no demuestra por sí sola que el comportamiento sea correcto.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 14 bis, 14 quinquies y 49.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-049','Inducción en privacidad','Revisar cómo la organización gestiona inducción en privacidad y registrar los antecedentes observados.','Documentar el estado de inducción en privacidad.','Alcance
Incorporar instrucciones de privacidad al ingreso o cambio de función antes de conceder acceso a datos personales.

Cumplimiento esperado del control
1. La inducción informa usos autorizados, confidencialidad, medidas básicas, canales de derechos e incidentes.
2. La persona conoce sus responsabilidades y confirma recepción, y las cuentas se habilitan conforme a su función.
3. Se adapta la inducción a temporales, terceros y cambios de puesto y se refuerzan condiciones de salida.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Incorporar instrucciones de privacidad al ingreso o cambio de función antes de conceder acceso a datos personales.','Evidencias sugeridas
Checklist de ingreso, material, constancia de recepción y autorizaciones de acceso.

Cómo verificar
Revisar una incorporación reciente y comprobar orden de inducción y acceso. Este mecanismo es una práctica para materializar deberes de protección, no un formulario legal único.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 7 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 14 bis y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-050','Repositorio documental','Revisar cómo la organización gestiona repositorio documental y registrar los antecedentes observados.','Documentar el estado de repositorio documental.','Alcance
Mantener documentos y evidencias localizables que permitan demostrar decisiones y ejecución de privacidad sin recopilar datos personales innecesarios.

Cumplimiento esperado del control
1. El repositorio identifica documentos vigentes, dueño, actividad relacionada y permisos de acceso.
2. Conserva evidencias de licitud, contratos, derechos, medidas y revisiones con trazabilidad y plazos adecuados.
3. Evita duplicados sin control y minimiza datos de titulares en evidencias, usando muestras anonimizadas o redactadas cuando sea posible.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Mantener documentos y evidencias localizables que permitan demostrar decisiones y ejecución de privacidad sin recopilar datos personales innecesarios.','Evidencias sugeridas
Índice documental, permisos, enlaces a registros y muestras de evidencias.

Cómo verificar
Solicitar la evidencia de un control y comprobar que puede localizarse, entenderse y atribuirse. No se exige una plataforma específica ni conservar toda evidencia indefinidamente.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 12, 14 y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-051','Versionado de documentos','Revisar cómo la organización gestiona versionado de documentos y registrar los antecedentes observados.','Documentar el estado de versionado de documentos.','Alcance
Controlar versiones para saber qué instrucciones, políticas y avisos estaban vigentes cuando se obtuvo consentimiento o se tomó una decisión.

Cumplimiento esperado del control
1. Cada documento relevante tiene identificador, versión, fecha, autor y estado.
2. Se conserva historial necesario para reconstruir cambios y se retiran versiones obsoletas de los puntos de uso.
3. Consentimientos y decisiones enlazan la versión aplicable y los cambios relevantes se comunican a sus destinatarios.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Controlar versiones para saber qué instrucciones, políticas y avisos estaban vigentes cuando se obtuvo consentimiento o se tomó una decisión.','Evidencias sugeridas
Historial de versiones, políticas y avisos fechados, registro de publicación y enlaces de consentimiento.

Cómo verificar
Reconstruir el texto mostrado en una fecha pasada y verificar el vigente. La fecha y versión de la política pública tiene respaldo específico en el artículo 14 ter; el versionado del resto es una práctica de gestión.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4 y 8 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 12, 14 ter a) y 3 e).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.'),
('PR-052','Revisión y aprobación documental','Revisar cómo la organización gestiona revisión y aprobación documental y registrar los antecedentes observados.','Documentar el estado de revisión y aprobación documental.','Alcance
Asegurar que políticas, procedimientos y avisos sean revisados por personas competentes, aprobados y coherentes con los tratamientos efectivos.

Cumplimiento esperado del control
1. Se define quién redacta, revisa y aprueba cada tipo documental y con qué criterio.
2. La aprobación comprueba coherencia con inventario, licitud, contratos y operación y registra fecha y condiciones.
3. Se programa revisión por riesgo y ante cambios legales, de sistemas o de finalidades y se verifica publicación y aplicación.

Naturaleza y aplicabilidad
Práctica de gestión para apoyar y demostrar obligaciones legales; su formato no es una exigencia legal universal. Los criterios de la reforma se evalúan como preparación hasta el 30 de noviembre de 2026 y como exigibles desde el 1 de diciembre de 2026 cuando corresponda. El resultado de este control no certifica el cumplimiento integral de la ley.','Asegurar que políticas, procedimientos y avisos sean revisados por personas competentes, aprobados y coherentes con los tratamientos efectivos.','Evidencias sugeridas
Actas o flujos de aprobación, matriz documental, calendario y comprobación de aplicación.

Cómo verificar
Revisar un documento aprobado y contrastarlo con la práctica. La aprobación interna apoya rendición de cuentas y no reemplaza revisión jurídica profesional cuando se requiera.

Criterio de evaluación
Contrastar documentos con una muestra de ejecución y registrar fecha, alcance y limitaciones. Marcar Cumple solo si se satisfacen los criterios aplicables con evidencia suficiente; registrar brechas para cumplimiento parcial o incumplimiento. Si se propone No aplica, justificarlo con las características reales del tratamiento; no basta con ausencia de documentos. No adjuntar datos personales innecesarios ni secretos.','Revisión de fuentes: 2026-10-09. Referencia orientativa pendiente de validación jurídica profesional.

Hasta el 30 de noviembre de 2026: Ley 19.628, artículos 4, 8 y 11 (antecedentes aplicables; no todos equivalen al criterio operativo completo).
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2023-05-09

Desde el 1 de diciembre de 2026: Ley 19.628 modificada por Ley 21.719, artículos 3 e), 14 ter y 14 quinquies.
https://www.bcn.cl/leychile/navegar?idNorma=141599&idVersion=2026-12-01

Vigencia de la reforma: artículo primero transitorio de Ley 21.719.
https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1209272

Verificar además normativa sectorial, excepciones e instrucciones vigentes de la autoridad para el caso concreto. No se presume emitida ninguna instrucción, adecuación o modelo de la Agencia.')
)
update public.controls as c
set description=v.description, objective=v.objective, guidance=v.guidance, normative_reference=v.normative_reference
from content as v
where c.code=v.code and c.title=v.title
  and c.description=v.old_description and c.objective=v.old_objective
  and c.guidance='Solicitar antecedentes al responsable, revisar documentación disponible y registrar alcance, limitaciones y observaciones. La aplicabilidad y el análisis jurídico requieren revisión profesional.'
  and c.normative_reference='Pendiente de revisión jurídica. Validar normativa aplicable y referencias específicas antes de utilizar este control como criterio jurídico.'
  and c.legal_review_status='PENDING';
