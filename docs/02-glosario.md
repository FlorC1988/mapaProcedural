# Glosario

## Términos aprobados

**Adyacencia:** relación entre dos posiciones que comparten uno de sus seis lados. Compartir solo un vértice no constituye adyacencia.

**Altura Z:** cantidad de partes hexagonales apiladas que forman una pieza. Sus valores son Z1, Z2 y Z3.

**Bioma:** entidad de terreno con identidad, nombre único, color, icono y estado activo/inactivo que determina la tapa de una pieza.

**Bioma activo:** bioma disponible para nuevas generaciones y configuraciones.

**Bioma inactivo:** bioma conservado únicamente en datos históricos y excluido de nuevas configuraciones.

**Gimnasio:** instancia identificable de un tipo de gimnasio que ocupa una posición, hereda su altura y altera biomas dentro de un radio de influencia.

**Tipo de gimnasio:** uno de los 18 tipos fijos e inmutables, con una lista configurable de biomas compatibles. Los tipos colocados en una generación son distintos entre sí.

**Área de influencia:** celda del gimnasio y todas las celdas dentro del radio global de distancia hexagonal configurado para la generación.

**Cuadrante:** una de las cuatro regiones iguales obtenidas al dividir por la mitad las filas y columnas visibles del tablero.

**Grilla:** conjunto rectangular de posiciones hexagonales organizado por filas y columnas.

**Orientación flat-top:** disposición en la que cada hexágono tiene un lado horizontal en la parte superior. Las columnas se desplazan verticalmente.

**Coordenada axial:** par interno `(q, r)` utilizado para representar posiciones y calcular relaciones en la grilla hexagonal.

**Coordenada visible:** par `(fila, columna)` numerado desde 1 y mostrado siempre al usuario. Las columnas visibles pares se desplazan medio hexágono hacia abajo.

**Mapa o tablero:** configuración identificable de posiciones hexagonales que representa el tablero físico. En esta documentación ambos términos se usan para el mismo resultado, salvo indicación expresa.

**Snapshot de mapa:** representación estructurada y atómica del estado actual del mapa y de su contexto histórico completo. El contexto queda aislado de cambios posteriores en los catálogos.

**Mapa base:** bioma, altura y eventual pertenencia a un microbioma de las posiciones, antes de colocar gimnasios y aplicar sus áreas de influencia.

**Definición de microbioma:** entidad identificable y administrable que asigna bioma y altura a una forma conectada de posiciones axiales relativas respecto de un ancla. Una instancia colocada no cambia cuando posteriormente se edita la definición.

**Instancia de microbioma:** colocación identificable de una definición. Puede recibir cambios de bioma causados por gimnasios sin modificar la definición ni perder sus excepciones internas.

**Pieza física:** conjunto de una, dos o tres partes hexagonales apiladas y una tapa de bioma, que ocupa exactamente una posición.

**Posición:** ubicación dentro de la grilla. Puede estar vacía en el modelo conceptual, aunque la generación inicial debe completar todas las posiciones.

**Restricción estructural:** regla obligatoria y no configurable por el usuario final.

**Incompatibilidad de biomas:** prohibición obligatoria y simétrica de adyacencia entre dos biomas distintos.

**Mapa generado válido:** resultado de generación automática que satisface simultáneamente todas las condiciones estructurales, de terreno, microbiomas y gimnasios. La clasificación válido o inválido no se aplica a mapas editados manualmente.

**Preferencia blanda:** objetivo deseable que no determina la validez. No se utiliza en la primera versión.

**Administrador:** rol funcional de quien utiliza el área administrativa para gestionar catálogos. En el MVP cualquier usuario de la instalación puede asumirlo sin autenticación ni autorización.
