# Interfaz y flujos

## 1. Flujo de generación aprobado

1. El usuario accede a la configuración de generación.
2. Configura filas y columnas pares `8..30` (default 16), `N` `1..4` (default 2), radio `0..2` (default 1) y, opcionalmente, una semilla visible y editable.
3. La interfaz valida los rangos; si existe un error, muestra su causa e impide generar.
4. Al solicitar generar, un diálogo modal lista las definiciones activas de microbioma para que el usuario elija cuáles participan (predeterminado: todas) e indique la cantidad total a colocar `0..10` (default 2); confirmar inicia la generación.
5. Si la semilla está vacía, el sistema genera una y la muestra antes de iniciar la búsqueda.
6. El sistema intenta producir cualquier solución válida.
7. Si tiene éxito, muestra el tablero, la matriz de recursos y la semilla utilizada.
8. Si agota el espacio sin solución, informa que no existe una solución para ese contexto sin reducir microbiomas, `N` ni radio.
9. Si agota el presupuesto de nodos, informa que la búsqueda terminó sin demostrar que la configuración sea imposible.
10. Si ocurre un error interno, lo informa separadamente.

En cualquier terminación sin éxito, la interfaz no muestra ni ofrece guardar un mapa parcial.

## 2. Flujo de mapas guardados

Los mapas y catálogos son compartidos por todos los usuarios de una misma instalación.

### 2.1. Primer guardado y actualización

1. El primer Guardar solicita un nombre.
2. La interfaz recorta los espacios exteriores y exige entre 1 y 100 caracteres.
3. Si ya existe el nombre sin distinguir mayúsculas, rechaza la operación y solicita corregirlo; nunca sobrescribe por coincidencia de nombre.
4. Si es único, crea una identidad con fechas y versión de concurrencia.
5. Guardar nuevamente actualiza esa identidad si la versión abierta coincide con la persistida.
6. Si otra persona la modificó, rechaza la actualización sin sobrescribir y ofrece recargar o utilizar Guardar como.

### 2.2. Guardar como y duplicar

Guardar como crea otra identidad a partir del estado actual y exige un nombre único distinto. Duplicar realiza la misma copia del estado actual y del contexto histórico, también con otra identidad, nombre, fechas y versión de concurrencia. Ninguna de las dos operaciones modifica el mapa de origen.

### 2.3. Listado y reapertura

El listado muestra nombre, creación y última modificación. Permite búsqueda parcial por nombre sin distinguir mayúsculas y orden por nombre, creación o modificación, ascendente o descendente. Inicialmente usa modificación descendente.

Abrir recupera el estado guardado y su contexto histórico sin ejecutar validación. Los cambios posteriores de catálogos no alteran lo mostrado. Regenerar usa el snapshot del mapa.

### 2.4. Eliminación

Eliminar abre una confirmación simple que muestra el nombre y ofrece Cancelar o Eliminar. Confirmar elimina el mapa definitivamente.

## 3. Flujo de edición

1. El usuario abre un mapa generado o guardado.
2. Elige cambiar bioma o altura, editar un gimnasio, estampar, mover o desvincular un microbioma, o ampliar el tablero.
3. Para biomas y relleno de expansión solo puede seleccionar uno activo; ninguna operación deja posiciones vacías.
4. El sistema aplica la operación completa sin evaluar las restricciones de generación.
5. Si una celda editada pertenecía a un microbioma, desvincula primero la instancia completa y conserva los valores actuales de sus celdas.
6. El sistema recalcula la matriz de recursos.
7. La operación se incorpora al historial de sesión y puede deshacerse o rehacerse.
8. El usuario puede guardar el mapa sin validación ni estado válido o inválido mediante el flujo aprobado de guardado y concurrencia.

Editar un gimnasio permite agregar, quitar, mover o cambiar tipo sin aplicar influencia. Estampar un microbioma exige seleccionar una definición activa y un ancla válida. Ampliar exige indicar cantidades por borde, con sumas pares, dimensiones finales `8..30`, un bioma activo y una altura para las celdas nuevas.

Solicitar una nueva generación crea otro mapa desde la configuración actualizada y el contexto histórico, e ignora las ediciones del mapa anterior. Cerrar o recargar limpia el historial de deshacer y rehacer.

## 4. Flujos de catálogos

El área administrativa no requiere autenticación ni autorización; cualquier usuario de la instalación puede abrirla. Desde ella se gestionan biomas, incompatibilidades y microbiomas. Para cada bioma se configura nombre único, color, icono y estado. Las incompatibilidades se presentan como relaciones simétricas y no permiten seleccionar el mismo bioma en ambos extremos.

La interfaz bloquea la desactivación de un bioma con dependencias activas e informa la causa. No ofrece eliminación física de biomas.

Cualquier usuario puede configurar los biomas compatibles de los 18 tipos fijos de gimnasio. La interfaz no permite crear, eliminar, activar o desactivar tipos. Inicialmente todos admiten los cinco biomas.

El listado de microbiomas muestra nombre, estado y cantidad de celdas, con búsqueda parcial, filtro por estado y orden por nombre. Crear abre el editor con una celda ancla; Guardar crea la definición activa cuando nombre, forma, biomas y alturas cumplen todas las validaciones.

Al editar, el usuario agrega celdas adyacentes, elimina sin desconectar, reancla o aplica bioma y altura a una celda o selección. Guardar rechaza errores estructurales, nombres duplicados y conflictos de versión. Activar o desactivar se aplica inmediatamente desde el listado o detalle y solo afecta usos futuros.

## 5. Representación del tablero

La grilla utiliza hexágonos con lado horizontal arriba (flat-top). Las columnas se desplazan verticalmente y las columnas visibles pares quedan medio hexágono por debajo de las impares.

Cada posición muestra siempre sus coordenadas `(fila, columna)`, numeradas desde 1. El sistema utiliza coordenadas axiales internamente, sin exponerlas como coordenadas principales al usuario.

Cada celda usa el color de fondo y el icono configurados para su bioma, junto con una etiqueta persistente Z1, Z2 o Z3. El nombre del bioma está disponible como texto accesible y la identificación no depende únicamente del color.

Un gimnasio se superpone mediante una etiqueta con el símbolo distintivo y el nombre de su tipo, que ocupa el lugar del icono del bioma, más una trama diagonal y un borde que lo distinguen a simple vista. Cada instancia de microbioma se delimita con un contorno propio violeta punteado; al seleccionarla se muestran su nombre e identidad.

Las áreas de influencia generadas están ocultas inicialmente y se muestran mediante una capa conmutable. La capa solo dibuja áreas asociadas existentes; un gimnasio creado o editado manualmente sin área no muestra influencia.

Seleccionar una celda abre un panel con coordenadas, nombre de bioma, altura y, cuando correspondan, tipo e identidad de gimnasio y nombre e identidad de microbioma.

El tablero se ajusta inicialmente al espacio disponible. Ofrece controles de zoom, zoom con rueda y desplazamiento por arrastre.

Los errores de campo aparecen junto al control afectado y también en un resumen visible. Los fallos de operación se muestran mediante un aviso persistente que explica la causa conocida y la acción disponible.

## 6. Recursos físicos

La matriz de piezas contiene una fila por cada bioma presente en el mapa actual, incluido cualquier bioma histórico inactivo, ordenadas por nombre. Sus columnas son Z1, Z2, Z3 y Total, con una fila final de totales. No aparecen biomas con cantidad cero y no existe un desglose adicional por microbioma.

Una tabla separada de marcadores de gimnasio contiene una fila por cada tipo presente y una fila de total. No muestra tipos con cantidad cero.

Ambas tablas se recalculan después de editar, deshacer o rehacer. La matriz cuenta cada posición una sola vez por su bioma y altura actuales; la tabla cuenta cada gimnasio una sola vez por su tipo actual.
