# Plan de acción: operación actual

Revisión del 9 de octubre de 2026. La sección 13 del documento maestro pide explícitamente no crear inicialmente una entidad separada compleja y usar hallazgos y acciones como base del plan.

## Creación y asociaciones

1. Abrir **Plan de acción**, seleccionar Organización y pulsar Filtrar.
2. SUPER_ADMIN o CONSULTANT asignado, en organización activa, utiliza **Nuevo hallazgo**. Selecciona una evaluación obligatoria y opcionalmente su control histórico. También puede crearlo desde el detalle del control de una evaluación.
3. Abrir el hallazgo y, en **Tareas correctivas**, pulsar **Nueva tarea**. Registrar acción/título, descripción, responsable, prioridad y fecha objetivo. Se proponen el responsable, prioridad y fecha del hallazgo; pueden ajustarse según las validaciones vigentes.
4. El hallazgo aparece automáticamente en Plan de acción; cada tarea queda asociada al hallazgo, cuya evaluación determina su contexto. No existe tabla, identificador ni formulario independiente de plan.

Relación: Organización → Evaluación → Hallazgo → Tareas. El control del hallazgo es opcional. Las FK compuestas impiden enlazar hallazgos y tareas con organizaciones/evaluaciones incompatibles; las relaciones históricas no se reasignan al editar.

## Seguimiento y permisos

La ruta `/action-plan` reutiliza `FindingList` con `plan=true`: lista hallazgos, severidad, responsable, fecha, estado y progreso. Los filtros afectan hallazgos; vencido se refiere a la fecha objetivo del hallazgo, no a fechas individuales de sus tareas. La severidad/responsable del hallazgo pueden diferir de la prioridad/responsable de cada tarea.

El cliente consulta hallazgos de su organización y ve únicamente sus tareas asignadas. Puede iniciar y enviar esas tareas a revisión; el gestor las devuelve con observaciones o las aprueba. La RPC `finding_progress` devuelve solo totales del hallazgo: tareas DONE/total, incluyendo tareas de otros responsables sin revelar sus detalles. No es un porcentaje manual ni un score legal; sin tareas se muestra 0/0 sin porcentaje.

Cerrar un hallazgo exige justificación, tareas aprobadas y últimas evidencias asociadas aceptadas. Aceptar riesgo tiene su excepción explícita y exige justificación. Hallazgos cerrados/con riesgo aceptado y organizaciones archivadas impiden nuevas tareas; deben reabrirse/reactivarse mediante sus operaciones autorizadas. No hay borrado independiente de hallazgos/tareas; aplican las excepciones de borrado completo de organización/evaluación.

El informe PDF publicado contiene el plan completo de la organización conforme a INF-02; su snapshot no se actualiza automáticamente al cambiar tareas después de publicarlo.

## Implementación revisada

- `src/app/(workspace)/action-plan/page.tsx` y `src/features/workflow/finding-list.tsx`: vista y filtros.
- `src/app/(workspace)/organizations/[id]/findings/new/page.tsx`: asociación a evaluación/control.
- `src/app/(workspace)/findings/[id]/page.tsx`: acceso a Nueva tarea.
- `src/app/(workspace)/tasks/new/page.tsx`: exige hallazgo accesible y abierto.
- `src/features/workflow/actions.ts` y `queries.ts`: guardados, alcance actual y permisos.
- Migraciones de fase 4 y evidencias: FK, transiciones y `finding_progress`.

La revisión detectó un problema de descubrimiento: el módulo no explicaba cómo incorporar acciones. Se añadió una guía dentro de Plan de acción usando las rutas existentes. Desde el 10 de octubre de 2026, se consulta en un modal mediante el botón de icono de ayuda junto al título; el contenido permanece idéntico. No se agregó una entidad nueva ni se cambió SQL, RLS o permisos.
