# Interfaz y flujos

## 1. Flujo de generación aprobado

1. El usuario accede a la configuración de generación.
2. Configura filas y columnas pares `8..30` (default 16), microbiomas `0..10` (default 2), `N` `1..4` (default 2) y radio `0..2` (default 1).
3. La interfaz valida los rangos; si existe un error, muestra su causa e impide generar.
4. Con parámetros válidos, solicita generar.
5. El sistema intenta producir cualquier solución válida.
6. Si tiene éxito, muestra el tablero y la matriz de recursos.
7. Si la configuración válida es irresoluble, informa un fallo sin reducir microbiomas, `N` ni radio.

## 2. Flujo de mapas guardados

Está aprobado que el usuario pueda guardar y volver a abrir mapas. Cada mapa conserva la configuración completa usada para generarlo.

**Pendiente:** pantallas, búsqueda, orden, nombres, confirmaciones, eliminación, duplicación y sobrescritura.

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
