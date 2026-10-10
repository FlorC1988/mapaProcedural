# Requisitos funcionales

## Estado

Los requisitos etiquetados como **Aprobado** provienen del borrador o de decisiones explícitas. Un detalle pendiente impide implementar solamente la parte que dependa de él.

## Generación

- **RF-GEN-001 — Aprobado:** el usuario podrá configurar la cantidad de filas y columnas.
- **RF-GEN-002 — Aprobado:** el usuario podrá indicar cuántos microbiomas desea incluir y elegir qué definiciones activas participan en el reparto (`DEC-091`).
- **RF-GEN-003 — Aprobado:** el usuario indicará una cantidad común `N` de gimnasios por cuadrante, con valor predeterminado 2, y un radio global de influencia para la generación.
- **RF-GEN-004 — Aprobado:** el sistema generará una configuración que satisfaga todas las restricciones obligatorias.
- **RF-GEN-005 — Aprobado:** todas las posiciones estarán ocupadas al terminar una generación correcta.
- **RF-GEN-006 — Aprobado:** si no puede colocar la cantidad solicitada de microbiomas o gimnasios, la generación fallará sin reducirla automáticamente.
- **RF-GEN-007 — Aprobado:** el resultado puede ser cualquier solución válida; no se exige calidad estética, variedad ni equilibrio.
- **RF-GEN-008 — Aprobado:** filas y columnas serán valores pares independientes entre 8 y 30, predeterminados en 16×16; microbiomas será 0..10, predeterminado en 2, repartidos entre las definiciones elegidas por el usuario; `N` será 1..4, predeterminado en 2; radio será 0..2, predeterminado en 1.
- **RF-GEN-009 — Aprobado:** la semilla será visible y editable; si el usuario no introduce una, el sistema la generará, mostrará y conservará con el mapa. Con la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo, el resultado será idéntico.
- **RF-GEN-010 — Aprobado:** el tablero se dividirá en cuatro cuadrantes iguales y requerirá cantidades pares de filas y columnas.
- **RF-GEN-011 — Aprobado:** el sistema seleccionará aleatoriamente `4 × N` tipos distintos del catálogo fijo de 18; por ello `N ≤ 4`.
- **RF-GEN-012 — Aprobado:** el sistema impedirá generar con cualquier parámetro fuera de rango; si con parámetros válidos no puede resolver el mapa, fallará sin reducir microbiomas, `N` ni radio.
- **RF-GEN-013 — Aprobado:** cada tipo de gimnasio conservará al menos un bioma compatible.
- **RF-GEN-014 — Aprobado:** el sistema resolverá la generación completa mediante backtracking global, seleccionará la siguiente decisión con MRV, propagará restricciones y ordenará las alternativas mediante el generador pseudoaleatorio sembrado.
- **RF-GEN-015 — Aprobado:** la búsqueda tendrá un presupuesto global y determinista; cada intento de asignar una alternativa contará como un nodo. Su valor numérico se fijará después de realizar benchmarks.
- **RF-GEN-016 — Aprobado:** la generación distinguirá éxito, ausencia de solución demostrada al agotar el espacio y presupuesto agotado; los errores internos se informarán por separado.
- **RF-GEN-017 — Aprobado:** cualquier candidato parcial se descartará y no se mostrará ni guardará como mapa.

## Visualización y recursos

- **RF-VIS-001 — Aprobado:** el sistema representará el tablero mediante una geometría hexagonal correcta.
- **RF-VIS-002 — Aprobado:** cada posición mostrará color e icono de bioma, nombre accesible, etiqueta persistente Z1, Z2 o Z3 y coordenadas visibles. En posiciones con gimnasio, la etiqueta del tipo sustituye al icono del bioma y la celda se distingue con trama y borde.
- **RF-VIS-003 — Aprobado:** el gimnasio se mostrará por encima del bioma mediante símbolo y etiqueta de tipo.
- **RF-VIS-004 — Aprobado:** cada instancia de microbioma tendrá contorno propio y, al seleccionarse, mostrará nombre e identidad.
- **RF-VIS-005 — Aprobado:** las áreas de influencia generadas podrán mostrarse en una capa conmutable, oculta inicialmente; un gimnasio sin área asociada no mostrará influencia.
- **RF-VIS-006 — Aprobado:** seleccionar una celda abrirá un panel con coordenadas, bioma, altura y sus asociaciones opcionales de gimnasio y microbioma.
- **RF-VIS-007 — Aprobado:** el tablero se ajustará inicialmente al espacio y permitirá zoom mediante controles y rueda, y desplazamiento por arrastre.
- **RF-VIS-008 — Aprobado:** los errores de campo aparecerán junto al control y en un resumen; los fallos de operación se mostrarán en un aviso persistente con causa y acción posible.
- **RF-REC-001 — Aprobado:** el sistema mostrará una matriz de piezas necesarias con filas por los biomas presentes ordenados por nombre, columnas Z1, Z2 y Z3, totales y una columna de total de estructura calculada como `Z1 + 2·Z2 + 3·Z3`.
- **RF-REC-002 — Aprobado:** la matriz no representa inventario disponible ni calcula por separado tapas y partes individuales; los microbiomas no tienen desglose separado.
- **RF-REC-003 — Aprobado:** una tabla separada mostrará una fila por cada tipo de gimnasio presente y el total; la cantidad de marcadores se muestra junto al nombre como `(N)` solo cuando supera 1.
- **RF-REC-004 — Aprobado:** después de editar, deshacer o rehacer, ambas tablas se recalcularán para representar el estado actual.

## Mapas guardados

- **RF-MAP-001 — Aprobado:** el usuario podrá guardar mapas.
- **RF-MAP-002 — Aprobado:** el usuario podrá consultar y volver a abrir mapas guardados compartidos por toda la instalación.
- **RF-MAP-003 — Aprobado:** cada mapa tendrá identificador estable, nombre obligatorio único sin distinguir mayúsculas, fecha de creación, fecha de última modificación y versión de concurrencia. El nombre tendrá entre 1 y 100 caracteres después de recortar espacios exteriores.
- **RF-MAP-004 — Aprobado:** la persistencia central utilizará una base relacional, catálogos operativos normalizados y, para cada mapa, una cabecera relacional y un snapshot estructurado y atómico.
- **RF-MAP-005 — Aprobado:** cada mapa conservará su configuración completa: filas, columnas, microbiomas solicitados, `N`, radio y semilla.
- **RF-MAP-006 — Aprobado:** el primer Guardar solicitará nombre; Guardar actualizará la misma identidad; Guardar como y Duplicar crearán otra identidad con un nombre único distinto. Una coincidencia de nombre se rechazará sin sobrescribir.
- **RF-MAP-007 — Aprobado:** Duplicar copiará el estado actual y el contexto histórico del mapa, pero asignará identificador, nombre, fechas y versión de concurrencia nuevos.
- **RF-MAP-008 — Aprobado:** eliminar un mapa será definitivo y requerirá una confirmación simple que muestre su nombre.
- **RF-MAP-009 — Aprobado:** el listado mostrará nombre y fechas, permitirá buscar parcialmente por nombre sin distinguir mayúsculas y ordenar por nombre, creación o modificación en ambos sentidos; inicialmente ordenará por modificación descendente.
- **RF-MAP-010 — Aprobado:** Guardar rechazará una actualización si la versión persistida cambió desde que se abrió el mapa, sin sobrescribir; el usuario deberá recargar o utilizar Guardar como.
- **RF-MAP-011 — Aprobado:** cada mapa conservará un contexto histórico completo e inmutable. Los cambios posteriores de catálogos no alterarán el mapa y regenerar desde él utilizará ese contexto.

## Edición

- **RF-EDI-001 — Aprobado:** el usuario podrá editar manualmente un mapa generado.
- **RF-EDI-002 — Aprobado:** el editor permitirá cambiar bioma y altura; agregar, quitar, mover y cambiar el tipo de gimnasios; y estampar, mover o desvincular instancias de microbioma.
- **RF-EDI-007 — Aprobado:** si se edita el bioma, solo podrán seleccionarse biomas activos.
- **RF-EDI-003 — Aprobado:** las ediciones no estarán sujetas a las restricciones de generación, no se rechazarán por ellas ni producirán errores de validez.
- **RF-EDI-004 — Aprobado:** editar una celda de microbioma desvinculará la instancia completa y conservará los valores actuales de sus celdas.
- **RF-EDI-005 — Aprobado:** guardar y abrir mapas editados no ejecutará validación ni les asignará un estado válido o inválido.
- **RF-EDI-006 — Aprobado:** solicitar una nueva generación desde un mapa editado creará un mapa nuevo e ignorará las ediciones anteriores.
- **RF-EDI-008 — Aprobado:** ninguna herramienta de edición permitirá dejar una posición vacía.
- **RF-EDI-009 — Aprobado:** editar un gimnasio no aplicará influencia ni cambiará biomas; agregarlo, moverlo o cambiar su tipo eliminará su área asociada, y quitarlo eliminará solo la entidad. Las celdas de origen o destino pertenecientes a microbiomas aplicarán la desvinculación de RF-EDI-004.
- **RF-EDI-010 — Aprobado:** estampar un microbioma activo exigirá que quepa completo, sobrescribirá bioma y altura sin rotar ni reflejar, conservará gimnasios y desvinculará instancias intersectadas.
- **RF-EDI-011 — Aprobado:** mover un microbioma desvinculará su ubicación anterior conservando sus valores y lo estampará desde la nueva ancla.
- **RF-EDI-012 — Aprobado:** el tablero podrá ampliarse por sus bordes sin recortarse, manteniendo dimensiones pares entre 8 y 30; las celdas nuevas recibirán el bioma activo y la altura elegidos y la configuración adoptará las nuevas dimensiones.
- **RF-EDI-013 — Aprobado:** el editor mantendrá durante la sesión un historial de múltiples operaciones para deshacer y rehacer; una nueva edición tras deshacer descartará la rama de rehacer y cerrar o recargar limpiará el historial.

## Catálogos y administración

- **RF-CAT-001 — Aprobado:** existirán exactamente 18 tipos fijos de gimnasio; no podrán crearse, eliminarse, activarse ni desactivarse.
- **RF-CAT-002 — Aprobado:** cualquier usuario podrá configurar la lista de biomas compatibles de cada tipo fijo.
- **RF-ADM-001 — Aprobado:** un administrador podrá crear, consultar, editar, activar y desactivar biomas; no podrá eliminarlos físicamente.
- **RF-ADM-002 — Aprobado:** un administrador podrá gestionar incompatibilidades simétricas entre biomas distintos.
- **RF-ADM-007 — Aprobado:** el sistema rechazará nombres de bioma duplicados sin distinguir mayúsculas y minúsculas.
- **RF-ADM-008 — Aprobado:** el sistema bloqueará la desactivación de un bioma usado por un microbioma activo o configurado como compatible en un tipo de gimnasio.
- **RF-ADM-003 — Aprobado:** un administrador podrá crear, consultar, editar, activar y desactivar definiciones de microbioma; no podrá eliminarlas físicamente.
- **RF-ADM-004 — Aprobado:** cada definición tendrá identidad estable, nombre obligatorio único sin distinguir mayúsculas de 1 a 100 caracteres, estado y versión de concurrencia; una definición nueva válida se creará activa.
- **RF-ADM-005 — Aprobado:** el MVP no protegerá ni distinguirá el acceso administrativo; cualquier usuario de la instalación podrá abrir el área administrativa.
- **RF-ADM-006 — Aprobado:** modificar o desactivar datos de catálogo no alterará el contenido ni el contexto histórico de mapas guardados existentes.
- **RF-ADM-009 — Aprobado:** toda definición guardada tendrá ancla axial `(0,0)`, entre 1 y 900 celdas con coordenadas relativas únicas, extensión máxima equivalente a 30×30 posiciones visibles y una forma conectada por lados.
- **RF-ADM-010 — Aprobado:** cada celda de definición tendrá un bioma activo y una altura Z1, Z2 o Z3; no se validarán incompatibilidades ni diferencias de altura entre celdas internas.
- **RF-ADM-011 — Aprobado:** el editor solo agregará celdas adyacentes y solo permitirá eliminarlas si la forma continúa conectada; podrá reanclar y editar bioma o altura por celda o selección múltiple.
- **RF-ADM-012 — Aprobado:** el listado mostrará nombre, estado y cantidad de celdas, permitirá búsqueda parcial por nombre, filtro activo/inactivo y orden por nombre.
- **RF-ADM-013 — Aprobado:** activar o desactivar tendrá efecto inmediato solo en selecciones y generaciones futuras; editar una definición activa no alterará snapshots existentes.
- **RF-ADM-014 — Aprobado:** Guardar rechazará una definición inválida y también una actualización cuya versión persistida haya cambiado desde que se abrió, sin sobrescribir.

## Autenticación

- **RF-AUT-001 — Aprobado:** la primera versión no tendrá cuentas de usuario.

## Validación e integridad

- **RF-VAL-001 — Aprobado:** toda regla de negocio se valida en el servidor y, cuando sea posible, también en la interfaz para feedback inmediato y en la base de datos para integridad estructural.
- **RF-VAL-002 — Aprobado:** el servidor rechaza cualquier operación que incumpla una regla de dominio aprobada, independientemente de lo que envíe la interfaz.

## Auditoría y observabilidad

- **RF-OBS-001 — Aprobado:** el sistema registra localmente los cambios administrativos con marca temporal, tipo de entidad, identificador afectado y tipo de cambio, sin asociarlos a un usuario personal.
- **RF-OBS-002 — Aprobado:** el sistema emite logs estructurados locales de errores, latencia de operaciones interactivas, generación y persistencia, sin incluir contenido de mapas, snapshots ni secretos.

## Trazabilidad

Las reglas que determinan el cumplimiento de RF-GEN-004 se encuentran en [Reglas de dominio](04-reglas-de-dominio.md) y el proceso conocido en [Generación de mapas](06-generacion-de-mapas.md).
