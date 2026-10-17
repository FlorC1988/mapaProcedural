# Edición y validación

## Estado

La edición manual pertenece al MVP, dispone de herramientas aprobadas y es libre de las restricciones aplicadas por el generador.

## 1. Validez

La validez se aplica exclusivamente al resultado de la generación automática. El generador entrega un mapa que satisface todas las reglas documentadas o falla.

Después de generado, el mapa puede modificarse libremente. Un mapa editado no se clasifica como válido o inválido y no se valida al editar, guardar o volver a abrir.

## 2. Edición libre

- Las restricciones espaciales y de validez de generación no se aplican a las ediciones manuales.
- Si la propiedad editada es el bioma, solo se ofrecen biomas activos; los inactivos históricos permanecen visibles donde ya existen.
- Un cambio no se rechaza por romper restricciones de altura, biomas, microbiomas o gimnasios.
- La interfaz no presenta esas diferencias como errores de validez.
- Guardar o abrir no ejecuta una validación.
- La matriz de piezas y la tabla de marcadores de gimnasio se recalculan después de cada edición y representan el estado actual.
- Ninguna herramienta puede dejar una posición vacía.
- Puede cambiarse el bioma por otro activo y asignarse cualquiera de las alturas Z1, Z2 o Z3.

## 3. Microbiomas

Cada colocación generada conserva inicialmente la identidad de su instancia y las celdas asociadas.

La alteración de biomas causada por un gimnasio durante la generación no se considera una edición manual y no desvincula el microbioma.

Cuando el usuario edita manualmente una celda perteneciente a un microbioma:

1. se desvincula la instancia completa;
2. todas sus celdas dejan de pertenecer a esa instancia;
3. las celdas conservan sus valores actuales de bioma, altura y gimnasio;
4. el cambio solicitado se aplica a la celda editada.

La desvinculación evita representar como microbioma una estructura que ya no coincide necesariamente con su definición.

El editor también permite:

- estampar una definición activa completa desde un ancla, sin rotarla ni reflejarla;
- mover una instancia existente;
- desvincular una instancia sin cambiar los valores de sus celdas.

El estampado debe caber completo dentro del tablero. Desvincula todas las instancias intersectadas, sobrescribe bioma y altura con la definición y conserva cualquier gimnasio ubicado en esas celdas. Mover desvincula primero el origen, que conserva sus valores, y luego estampa la definición en la nueva ancla.

## 4. Gimnasios

El usuario puede agregar, quitar, mover y cambiar el tipo de un gimnasio. Estas operaciones no aplican influencia ni cambian biomas. Agregar, mover o cambiar tipo deja la instancia sin área de influencia asociada; quitar elimina únicamente el gimnasio.

Como toda edición manual de una celda, si el origen o destino afectado pertenece a un microbioma, su instancia completa se desvincula antes de modificar el gimnasio y sus celdas conservan los valores actuales.

Como la edición es libre, no se exigen tipos distintos, separación, pertenencia a cuadrante ni áreas no superpuestas.

## 5. Expansión del tablero

El tablero puede ampliarse, pero no recortarse. El usuario indica cantidades no negativas para arriba, abajo, izquierda y derecha. La suma vertical y la horizontal deben ser pares, la cantidad agregada por la izquierda también debe ser par para conservar la geometría hexagonal (`DEC-092`) y las dimensiones resultantes deben permanecer entre 8 y 30.

Antes de aplicar la expansión se seleccionan un bioma activo y una altura para todas las celdas nuevas. Agregar arriba o a la izquierda desplaza las coordenadas de las posiciones existentes sin cambiar sus contenidos ni asociaciones. Las filas y columnas de la configuración se actualizan para futuras regeneraciones.

## 6. Deshacer y rehacer

Cada mapa mantiene durante la sesión un historial de múltiples operaciones. Cambiar una celda, editar un gimnasio, estampar, mover o desvincular un microbioma y expandir el tablero constituyen cada uno una operación completa y se deshacen o rehacen atómicamente.

Una edición nueva después de deshacer elimina la rama disponible para rehacer. Cerrar o recargar el mapa limpia el historial. Después de deshacer o rehacer también se recalculan la matriz de piezas y la tabla de gimnasios.

## 7. Nueva generación

Solicitar una nueva generación desde un mapa editado crea un mapa nuevo desde la configuración y el contexto histórico correspondiente. Las ediciones existentes se ignoran y no actúan como restricciones ni como punto de partida.
