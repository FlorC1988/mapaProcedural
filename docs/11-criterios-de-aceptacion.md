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

### CA-MAP-001 — Configuración conservada

Al guardar y abrir un mapa, se conservan filas, columnas, microbiomas solicitados, `N`, radio y semilla cuando esta exista.

Trazabilidad: DEC-035, RF-MAP-005.

## Criterios pendientes

Persistencia, propiedades y herramientas exactas de edición, detalles restantes de administración, errores de generación, accesibilidad y rendimiento requieren decisiones adicionales antes de contar con criterios verificables completos.
