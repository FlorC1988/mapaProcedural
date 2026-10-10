# Criterios de aceptación

Estos criterios cubren únicamente comportamientos suficientemente definidos. Los criterios de capacidades pendientes se añadirán después de su aprobación.

## Generación

### CA-GEN-001 — Tablero completo

Dada una configuración para la que el sistema produce un resultado, cuando finaliza la generación, entonces todas las posiciones de la grilla tienen bioma y altura.

Trazabilidad: RF-GEN-004, RF-GEN-005, RD-TAB-003.

### CA-GEN-002 — Restricción de altura

Dado un mapa generado, para toda pareja de piezas adyacentes que no esté cubierta por la excepción interna de un mismo microbioma, la diferencia de altura es como máximo un nivel.

Trazabilidad: RD-ALT-002, RD-MIC-004, RD-MIC-005.

### CA-GEN-003 — Incompatibilidades

Dado un mapa generado, ninguna pareja adyacente fuera de la excepción interna de un mismo microbioma utiliza una incompatibilidad configurada.

Trazabilidad: RD-BIO-006, RD-MIC-004, RD-MIC-005.

### CA-GEN-013 — Solo biomas activos

Dada una nueva generación, el mapa base y los microbiomas nuevos usan biomas activos, y cada compatibilidad configurada en los tipos de gimnasio referencia un bioma activo.

Trazabilidad: RD-BIO-004, RD-BIO-005, DEC-029.

### CA-GEN-014 — Reserva de microbiomas

Durante la generación, las posiciones de microbiomas se reservan antes de completar el mapa base y no son sobrescritas por esa etapa.

Trazabilidad: DEC-031, sección 2 de `06-generacion-de-mapas.md`.

### CA-GEN-004 — Microbiomas completos

Dado un microbioma colocado, conserva su distribución y alturas sin rotación ni reflexión. Sus biomas solo pueden diferir de la definición cuando una influencia prioritaria de gimnasio los modifica sin desvincular la instancia.

Trazabilidad: RD-MIC-001, RD-MIC-002, RD-MIC-003, RD-GIM-014.

### CA-GEN-005 — Separación de microbiomas

Dado un mapa generado, ningún microbioma sale del tablero, se superpone con otro o queda adyacente a otro.

Trazabilidad: RD-MIC-006, RD-MIC-007.

### CA-GEN-006 — Selección antes de repetición

Dados microbiomas activos y una cantidad solicitada, ningún tipo se repite hasta haber seleccionado una vez todos los tipos activos, salvo que la cantidad solicitada sea menor que su número.

Trazabilidad: sección 3 de `06-generacion-de-mapas.md`.

### CA-GEN-007 — Gimnasios por cuadrante

Dado un valor común `N ≤ 4`, el mapa generado contiene exactamente `N` gimnasios en cada cuadrante y `4 × N` en total, todos de tipos distintos del catálogo fijo.

Trazabilidad: RF-GEN-003, RF-GEN-011, RD-GIM-003, RD-GIM-004.

### CA-GEN-008 — Fallo sin reducción

Dada una configuración con `N > 4` o en la que el sistema no puede colocar la cantidad solicitada de microbiomas, gimnasios o áreas de influencia, la generación informa un fallo y no entrega silenciosamente un mapa con una cantidad menor.

Trazabilidad: RF-GEN-006, RF-GEN-012, RD-GIM-005.

### CA-GEN-009 — Áreas separadas por cuadrante

Dado un mapa generado, ninguna pareja de gimnasios es adyacente, ninguna pareja de áreas se superpone y cada área permanece completamente dentro del cuadrante de su gimnasio.

Trazabilidad: RD-GIM-006, RD-GIM-009, RD-GIM-010, DEC-024.

### CA-GEN-010 — Influencia elemental

Dado un gimnasio colocado, su propia celda y todas las celdas a distancia hexagonal menor o igual al radio global tienen un bioma compatible configurado directamente en su tipo y respetan las incompatibilidades aplicables.

Trazabilidad: RD-GIM-007, RD-GIM-008, RD-GIM-011, RD-GIM-012.

### CA-GEN-011 — Alturas heredadas

Dado un gimnasio y su área de influencia, ninguna altura cambia y el gimnasio conserva la altura de la celda que ocupa.

Trazabilidad: RD-GIM-002, RD-GIM-013, DEC-023.

### CA-GEN-012 — Prioridad sobre microbioma

Dada un área de influencia que toca un microbioma, las celdas afectadas reciben biomas compatibles con el gimnasio y la instancia conserva identidad, pertenencia, alturas y excepciones internas.

Trazabilidad: RD-GIM-014, DEC-025.

### CA-GEN-015 — Parámetros y valores iniciales

El formulario inicia en 16×16, 2 microbiomas, `N = 2` y radio 1; acepta dimensiones pares independientes `8..30`, microbiomas `0..10`, `N = 1..4` y radio `0..2`.

Trazabilidad: DEC-036, DEC-037, DEC-038, RF-GEN-008.

### CA-GEN-016 — Bloqueo previo

Con cualquier parámetro fuera de rango o dimensión impar, la interfaz muestra el error y no inicia la búsqueda.

Trazabilidad: DEC-039, RF-GEN-012.

### CA-GEN-017 — Radio cero

Con radio 0, el área de influencia de cada gimnasio contiene únicamente su propia celda.

Trazabilidad: DEC-038, RD-GIM-007.

### CA-GEN-018 — Fallo sin ajuste

Con parámetros válidos pero una configuración irresoluble, la generación falla sin reducir microbiomas, `N` ni radio.

Trazabilidad: DEC-039, RF-GEN-012.

### CA-GEN-019 — Semilla automática

Dada una configuración sin semilla introducida, cuando el usuario solicita generar, el sistema crea y muestra una semilla antes de iniciar la búsqueda y la conserva con el mapa si tiene éxito.

Trazabilidad: DEC-042, RF-GEN-009.

### CA-GEN-020 — Reproducibilidad

Dadas la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo, dos generaciones recorren las mismas alternativas y terminan con el mismo resultado; si tienen éxito, producen exactamente el mismo mapa.

Trazabilidad: DEC-042, RF-GEN-009, RD-REG-005, RD-REG-006.

### CA-GEN-021 — Backtracking global

Dada una decisión de una fase anterior que impide completar una fase posterior, mientras quede presupuesto y existan alternativas, la búsqueda puede deshacer esa decisión y probar otra respetando la secuencia aprobada.

Trazabilidad: DEC-040, RF-GEN-014.

### CA-GEN-022 — Presupuesto determinista

Cada intento de asignar una alternativa en cualquier fase consume exactamente un nodo del presupuesto global; con contexto idéntico, la búsqueda alcanza los mismos estados y consume el mismo número de nodos.

Trazabilidad: DEC-041, RF-GEN-015.

### CA-GEN-023 — Resultados diferenciados

Cuando la búsqueda agota todo el espacio, informa que no existe solución para ese contexto; cuando alcanza el presupuesto antes de agotarlo, informa presupuesto agotado sin afirmar imposibilidad; un error interno se informa separadamente.

Trazabilidad: DEC-041, RF-GEN-016.

### CA-GEN-024 — Sin resultado parcial

Cuando la generación termina sin éxito, el sistema descarta el candidato parcial y no lo muestra ni permite guardarlo como mapa.

Trazabilidad: DEC-041, RF-GEN-017.

## Recursos

### CA-REC-001 — Matriz

Dado un mapa generado, la suma de cada celda de la matriz coincide con el número de posiciones de esa combinación de bioma y altura, y los totales coinciden con sus sumas correspondientes.

Trazabilidad: RF-REC-001, RD-REC-001.

### CA-REC-002 — Recálculo tras edición

Dada una edición manual, cuando se aplica el cambio, la matriz se recalcula y sus cantidades coinciden con los biomas y alturas actuales.

Trazabilidad: RF-REC-004, DEC-018.

## Edición

### CA-EDI-001 — Edición sin restricciones

Dado un mapa generado o guardado, cuando el usuario realiza una modificación admitida por las herramientas de edición, el sistema la aplica aunque el resultado incumpla una restricción del generador y no muestra un error de validez por ello.

Trazabilidad: RF-EDI-003, DEC-014, DEC-015.

### CA-EDI-002 — Desvinculación de microbioma

Dada una celda asociada a una instancia de microbioma, cuando el usuario la edita, todas las celdas de esa instancia quedan desvinculadas, conservan sus valores actuales y se aplica el cambio solicitado a la celda editada.

Trazabilidad: RF-EDI-004, DEC-016.

### CA-EDI-003 — Guardado sin validación

Dado un mapa editado, cuando se guarda o se vuelve a abrir, el sistema no ejecuta las restricciones de generación ni le asigna una clasificación válida o inválida.

Trazabilidad: RF-EDI-005, DEC-014, DEC-015.

### CA-EDI-004 — Nueva generación independiente

Dado un mapa editado, cuando el usuario solicita generar nuevamente, el sistema crea otro mapa desde la configuración sin usar las ediciones anteriores como restricciones o punto de partida.

Trazabilidad: RF-EDI-006, DEC-017.

## Visualización

### CA-VIS-001 — Superposición de gimnasio

Dada una posición con gimnasio, la interfaz muestra la instancia y su tipo sobre el bioma actual de la celda sin cambiar la altura heredada.

Trazabilidad: RF-VIS-003, RD-GIM-001, RD-GIM-002, RD-GIM-015.

## Geometría

### CA-GEO-001 — Cantidad de posiciones

Dado un tablero configurado con `F` filas y `C` columnas, la grilla contiene exactamente `F × C` posiciones.

Trazabilidad: RD-TAB-005.

### CA-GEO-002 — Cuadrantes iguales

Dado un tablero generado, sus cantidades de filas y columnas son pares y cada cuadrante contiene exactamente `(F / 2) × (C / 2)` posiciones según los índices visibles.

Trazabilidad: RD-TAB-009, RD-TAB-010, DEC-019.

### CA-GEO-003 — Orientación y desplazamiento

Dada la grilla visible, cada hexágono tiene un lado horizontal arriba y las columnas visibles pares están desplazadas medio hexágono hacia abajo respecto de las impares.

Trazabilidad: RD-TAB-006, RD-TAB-007, DEC-013.

### CA-GEO-004 — Coordenadas visibles

Dada cualquier posición del tablero, su coordenada `(fila, columna)` se muestra siempre; ambas dimensiones comienzan en 1 y permanecen dentro de los límites configurados.

Trazabilidad: DEC-013, `09-interfaz-y-flujos.md`.

### CA-GEO-005 — Conversión de coordenadas

Dada cualquier posición válida, convertir su coordenada visible a axial y nuevamente a visible produce la coordenada original; la misma propiedad se cumple en el recorrido axial-visible-axial.

Trazabilidad: DEC-013, `05-modelo-de-datos.md`.

## Catálogo de biomas

### CA-BIO-001 — Catálogo inicial

Al inicializar la aplicación, existen Pradera, Agua, Roca, Magma e Hielo y los cinco están activos.

Trazabilidad: RD-BIO-002, DEC-026.

### CA-BIO-002 — Nombre único

Dado un bioma llamado `Magma`, el sistema rechaza crear o renombrar otro como `magma`, independientemente de las mayúsculas utilizadas.

Trazabilidad: RD-BIO-003, RF-ADM-007, DEC-027.

### CA-BIO-003 — Incompatibilidad simétrica

Al configurar Hielo incompatible con Magma, la restricción se aplica también a Magma respecto de Hielo sin crear una segunda relación manual.

Trazabilidad: RD-BIO-006, RD-BIO-007, DEC-028.

### CA-BIO-004 — Sin autoincompatibilidad

El sistema rechaza configurar un bioma como incompatible consigo mismo.

Trazabilidad: RD-BIO-008, DEC-028.

### CA-BIO-005 — Ciclo de vida

La interfaz no ofrece eliminación física. Un bioma desactivado permanece en datos históricos y deja de estar disponible para nuevas configuraciones.

Trazabilidad: RD-BIO-004, RD-BIO-005, RD-BIO-010, DEC-029.

### CA-BIO-006 — Dependencias activas

Dado un bioma utilizado por un microbioma activo o configurado como compatible en un tipo de gimnasio, el sistema rechaza su desactivación e informa la dependencia.

Trazabilidad: RD-BIO-011, RF-ADM-008, DEC-030.

## Catálogo de gimnasios

### CA-GIM-001 — Catálogo fijo

La aplicación contiene exactamente los 18 tipos aprobados y no ofrece crear, eliminar, activar ni desactivar tipos.

Trazabilidad: DEC-032, RF-CAT-001.

### CA-GIM-002 — Compatibilidad inicial

Al inicializar la aplicación, cada uno de los 18 tipos admite Pradera, Agua, Roca, Magma e Hielo.

Trazabilidad: DEC-033, RF-CAT-002.

### CA-GIM-003 — Lista no vacía

Dado un tipo con un solo bioma compatible, la interfaz impide quitarlo hasta agregar otro bioma activo.

Trazabilidad: DEC-039, RF-GEN-013.

### CA-EDI-005 — Biomas activos

Al editar el bioma de una celda, solo se ofrecen biomas activos; un bioma histórico inactivo permanece visible sin estar disponible para asignación.

Trazabilidad: DEC-034, RF-EDI-007.

### CA-EDI-006 — Propiedades y ocupación

El editor permite cambiar bioma y altura, editar gimnasios y gestionar instancias de microbioma, pero ninguna operación permite dejar una posición sin bioma o altura.

Trazabilidad: DEC-049, RF-EDI-002, RF-EDI-008.

### CA-EDI-007 — Gimnasio sin influencia

Al agregar, mover o cambiar el tipo de un gimnasio, ningún bioma cambia y la instancia queda sin área asociada; quitarlo conserva el bioma y la altura de su posición. Si una celda de origen o destino pertenecía a un microbioma, su instancia completa queda desvinculada.

Trazabilidad: DEC-016, DEC-050, RF-EDI-004, RF-EDI-009, RD-GIM-016.

### CA-EDI-008 — Estampado de microbioma

Al estampar una definición activa que cabe completa, el sistema crea una instancia sin rotación ni reflexión, desvincula las instancias intersectadas, reemplaza bioma y altura y conserva los gimnasios de las celdas ocupadas.

Trazabilidad: DEC-051, RF-EDI-010, RD-MIC-010.

### CA-EDI-009 — Movimiento de microbioma

Al mover una instancia, sus celdas de origen quedan desvinculadas y conservan sus valores; la definición se estampa completa desde la nueva ancla.

Trazabilidad: DEC-051, RF-EDI-011, RD-MIC-011.

### CA-EDI-010 — Expansión por bordes

La interfaz solo permite agregar cantidades no negativas por borde cuando las sumas vertical y horizontal son pares y las dimensiones resultantes permanecen entre 8 y 30. Las celdas nuevas reciben el bioma activo y la altura elegidos.

Trazabilidad: DEC-052, RF-EDI-012, RD-TAB-012.

### CA-EDI-011 — Coordenadas y configuración tras expansión

Al agregar arriba o a la izquierda, las coordenadas de las posiciones existentes se desplazan sin cambiar contenidos ni asociaciones, y la configuración adopta las nuevas filas y columnas para regeneraciones posteriores.

Trazabilidad: DEC-052, RF-EDI-012.

### CA-EDI-012 — Historial de sesión

Durante una sesión pueden deshacerse y rehacerse múltiples operaciones completas. Una nueva edición después de deshacer elimina la rama de rehacer; cerrar o recargar elimina el historial.

Trazabilidad: DEC-053, RF-EDI-013.

### CA-EDI-013 — Recursos tras historial

Después de deshacer o rehacer, la matriz de recursos coincide con los biomas y alturas resultantes.

Trazabilidad: DEC-053, RF-REC-004.

### CA-ADM-001 — Acceso administrativo abierto

Cualquier usuario de la instalación puede abrir el área administrativa y ejecutar las operaciones disponibles sin autenticación ni autorización.

Trazabilidad: DEC-054, RF-ADM-005.

### CA-ADM-002 — Ciclo de vida de microbiomas

La interfaz permite crear, consultar, editar, activar y desactivar definiciones, no ofrece eliminación física y crea activa toda definición nueva guardada correctamente.

Trazabilidad: DEC-055, RF-ADM-003, RF-ADM-004.

### CA-ADM-003 — Nombre de microbioma

Guardar recorta los espacios exteriores y acepta únicamente un nombre de 1 a 100 caracteres que no coincida, sin distinguir mayúsculas, con otra definición.

Trazabilidad: DEC-055, RF-ADM-004.

### CA-ADM-004 — Estructura de microbioma

Guardar exige una celda ancla `(0,0)`, entre 1 y 900 coordenadas axiales relativas únicas, extensión máxima equivalente a 30×30 posiciones visibles y una forma completamente conectada por lados.

Trazabilidad: DEC-056, RF-ADM-009, RD-MIC-012, RD-MIC-013.

### CA-ADM-005 — Contenido de celdas

Cada celda guardada tiene un bioma activo y una altura Z1, Z2 o Z3. Las incompatibilidades y diferencias de altura entre celdas internas no bloquean el guardado.

Trazabilidad: DEC-056, RF-ADM-010, RD-MIC-014.

### CA-ADM-006 — Herramientas de forma

El editor comienza con el ancla, solo agrega celdas adyacentes y solo elimina cuando permanece al menos una celda y la forma sigue conectada. Reanclar conserva la forma y recalcula los offsets respecto de la nueva `(0,0)`.

Trazabilidad: DEC-057, RF-ADM-011.

### CA-ADM-007 — Edición de contenido

El usuario puede seleccionar una o varias celdas y aplicarles un bioma activo, una altura o ambos valores antes de guardar.

Trazabilidad: DEC-057, RF-ADM-011.

### CA-ADM-008 — Listado de microbiomas

El listado muestra nombre, estado y cantidad de celdas, permite búsqueda parcial por nombre sin distinguir mayúsculas, filtro activo/inactivo y orden por nombre.

Trazabilidad: DEC-057, RF-ADM-012.

### CA-ADM-009 — Estado, historial y concurrencia

Editar, activar o desactivar una definición afecta inmediatamente solo usos futuros y no cambia instancias ni snapshots existentes. Si la versión persistida cambió desde que se abrió, Guardar rechaza la actualización sin sobrescribir.

Trazabilidad: DEC-058, RF-ADM-013, RF-ADM-014, RD-MIC-015.

### CA-MAP-001 — Configuración conservada

Al guardar y abrir un mapa, se conservan filas, columnas, microbiomas solicitados, `N`, radio y semilla.

Trazabilidad: DEC-035, RF-MAP-005.

### CA-MAP-002 — Nombre válido y único

El primer guardado recorta espacios exteriores y acepta únicamente un nombre de 1 a 100 caracteres que no coincida, sin distinguir mayúsculas, con otro mapa de la instalación. Una coincidencia se rechaza sin sobrescribir.

Trazabilidad: DEC-044, DEC-045, RF-MAP-003, RF-MAP-006.

### CA-MAP-003 — Identidad y actualización

Después del primer guardado, Guardar mantiene el identificador y la fecha de creación, y actualiza atómicamente el estado, la fecha de modificación y la versión de concurrencia.

Trazabilidad: DEC-044, DEC-045, RF-MAP-003, RF-MAP-006.

### CA-MAP-004 — Guardar como y duplicar

Guardar como y Duplicar crean una identidad con nombre, fechas y versión nuevos sin modificar el origen; Duplicar conserva el estado actual y el contexto histórico del mapa de origen.

Trazabilidad: DEC-045, DEC-047, RF-MAP-006, RF-MAP-007.

### CA-MAP-005 — Listado compartido

Un mapa guardado aparece para los demás usuarios de la misma instalación con su nombre y fechas. El listado permite búsqueda parcial por nombre sin distinguir mayúsculas y orden por nombre, creación o modificación en ambos sentidos; inicialmente ordena por modificación descendente.

Trazabilidad: DEC-043, DEC-046, RF-MAP-002, RF-MAP-009.

### CA-MAP-006 — Eliminación definitiva

Al solicitar eliminar, la interfaz muestra el nombre y permite cancelar. Al confirmar, elimina definitivamente el mapa y deja de aparecer en el listado compartido.

Trazabilidad: DEC-045, RF-MAP-008.

### CA-MAP-007 — Conflicto de concurrencia

Dado un mapa modificado en la persistencia después de abrirse, Guardar con la versión anterior rechaza la actualización sin sobrescribir y permite recargar o utilizar Guardar como.

Trazabilidad: DEC-048, RF-MAP-010.

### CA-MAP-008 — Aislamiento histórico

Dado un mapa guardado, modificar o desactivar posteriormente biomas, microbiomas, incompatibilidades o compatibilidades de gimnasio no cambia su estado ni su contexto histórico al volver a abrirlo.

Trazabilidad: DEC-047, RF-MAP-011, RF-ADM-006.

### CA-MAP-009 — Regeneración histórica

Al regenerar desde un mapa guardado, el sistema usa la configuración, catálogos, definiciones y versión del algoritmo de su snapshot, no los catálogos operativos actuales.

Trazabilidad: DEC-047, RF-MAP-011, RD-REG-007.

## Criterios pendientes

El producto y esquema físico de persistencia, el desglose de recursos, la representación visual, los mensajes exactos de generación, la accesibilidad y el rendimiento requieren decisiones adicionales antes de contar con criterios verificables completos.
