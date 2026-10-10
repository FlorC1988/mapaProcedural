# Interfaz y flujos

## 1. Flujo de generación aprobado

1. El usuario accede a la configuración de generación.
2. Configura filas y columnas pares `8..30` (default 16), microbiomas `0..10` (default 2), `N` `1..4` (default 2), radio `0..2` (default 1) y, opcionalmente, una semilla visible y editable.
3. La interfaz valida los rangos; si existe un error, muestra su causa e impide generar.
4. Con parámetros válidos, solicita generar.
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
2. Realiza una modificación sobre una propiedad editable; para bioma solo puede seleccionar uno activo.
3. El sistema aplica el cambio sin evaluar las restricciones de generación.
4. Si la celda pertenecía a un microbioma, desvincula primero la instancia completa y conserva los valores actuales de todas sus celdas.
5. El sistema recalcula la matriz de recursos para reflejar el mapa actual.
6. El usuario puede guardar el mapa sin validación ni estado válido o inválido.

Solicitar una nueva generación crea otro mapa desde la configuración e ignora las ediciones del mapa anterior.

**Pendiente:** herramientas, selección de propiedades editables, deshacer y comportamiento exacto de guardado.

## 4. Flujos de catálogos

El administrador gestiona biomas, incompatibilidades y microbiomas. Para cada bioma configura nombre único, color, icono y estado. Las incompatibilidades se presentan como relaciones simétricas y no permiten seleccionar el mismo bioma en ambos extremos.

La interfaz bloquea la desactivación de un bioma con dependencias activas e informa la causa. No ofrece eliminación física de biomas.

Cualquier usuario puede configurar los biomas compatibles de los 18 tipos fijos de gimnasio. La interfaz no permite crear, eliminar, activar o desactivar tipos. Inicialmente todos admiten los cinco biomas.

**Pendiente:** navegación, acceso, formularios, validaciones y operaciones exactas.

## 5. Representación del tablero

La grilla utiliza hexágonos con lado horizontal arriba (flat-top). Las columnas se desplazan verticalmente y las columnas visibles pares quedan medio hexágono por debajo de las impares.

Cada posición muestra siempre sus coordenadas `(fila, columna)`, numeradas desde 1. El sistema utiliza coordenadas axiales internamente, sin exponerlas como coordenadas principales al usuario.

Deben poder identificarse bioma, altura y gimnasio; este último se muestra superpuesto sin ocultar la existencia lógica del bioma.

**Pendiente:**

- zoom, desplazamiento y adaptación a distintos tamaños;
- colores, iconos y accesibilidad visual;
- representación de alturas y gimnasios;
- indicación visual de microbiomas y errores.
