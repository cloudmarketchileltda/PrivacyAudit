# Diseño de la interfaz

Propuesta propia basada en el maestro: sidebar azul oscuro, superficies claras, acento verde petróleo, tipografía de sistema legible, estados textuales con color secundario y tablas como componente principal. Dashboard de fase 2 limitado a organizaciones y evaluación. No mostrar indicadores de hallazgos o evidencias todavía.

Móvil: navegación adaptable, formularios de una columna, tablas con desplazamiento local. Desktop: formularios de dos columnas y navegación persistente. Formularios con etiquetas visibles, errores próximos al campo, foco accesible y estados de envío. Catálogo y controles evaluados incluyen referencias normativas editables y estado de revisión jurídica.

## Actualización visual autorizada — 16 de octubre de 2026

Inicio interno en `/home`, separado del dashboard analítico: bienvenida, accesos existentes, tres prioridades y carrusel manual de recursos del Centro normativo y Plan de acción. No hay noticias inventadas, feed externo ni nuevo sistema editorial. Recursos y avisos muestran su alcance y fechas existentes.

Menú de escritorio agrupado y con desplazamiento vertical; menú móvil mediante dialog modal nativo (Escape, foco y cierre al navegar). Superficies suaves, identidad azul y tipografías existentes. Se conservan variantes semánticas de Button. Dashboard de cartera: seis métricas principales y cinco complementarias, sin eliminar indicadores ni alterar sus consultas. Dashboard, evaluaciones, tareas y hallazgos presentan filas como tarjetas etiquetadas bajo 640px; las grillas administrativas conservan desplazamiento local. Filtros apilados en móvil. Carrusel táctil/manual sin temporizador y con movimiento reducido.

Inicio usa las RPC existentes según perfil; no amplía acceso al detalle ni modifica RLS, SQL, Storage o IA. Resumen CLIENT sin organización disponible conserva acceso a recursos y muestra ausencia de organización. Ruta predeterminada compartida en `generalConfig.site.workspaceHomeHref`; enlaces de continuación explícitos conservados.

Las pantallas de detalle incluyen ruta de navegación hacia Inicio y el módulo principal. Los segmentos intermedios sin página propia se muestran como texto para evitar enlaces inexistentes.
