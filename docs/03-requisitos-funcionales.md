# Requisitos funcionales

## Estado

Los requisitos etiquetados como **Aprobado** provienen del borrador o de decisiones explícitas. Un detalle pendiente impide implementar solamente la parte que dependa de él.

## Generación

- **RF-GEN-001 — Aprobado:** el usuario podrá configurar la cantidad de filas y columnas.
- **RF-GEN-002 — Aprobado:** el usuario podrá indicar cuántos microbiomas desea incluir.
- **RF-GEN-003 — Aprobado:** el usuario indicará una cantidad común `N` de gimnasios por cuadrante, con valor predeterminado 2, y un radio global de influencia para la generación.
- **RF-GEN-004 — Aprobado:** el sistema generará una configuración que satisfaga todas las restricciones obligatorias.
- **RF-GEN-005 — Aprobado:** todas las posiciones estarán ocupadas al terminar una generación correcta.
- **RF-GEN-006 — Aprobado:** si no puede colocar la cantidad solicitada de microbiomas o gimnasios, la generación fallará sin reducirla automáticamente.
- **RF-GEN-007 — Aprobado:** el resultado puede ser cualquier solución válida; no se exige calidad estética, variedad ni equilibrio.
- **RF-GEN-008 — Aprobado:** filas y columnas serán valores pares independientes entre 8 y 30, predeterminados en 16×16; microbiomas será 0..10, predeterminado en 2; `N` será 1..4, predeterminado en 2; radio será 0..2, predeterminado en 1.
- **RF-GEN-009 — Pendiente:** semilla y reproducibilidad.
- **RF-GEN-010 — Aprobado:** el tablero se dividirá en cuatro cuadrantes iguales y requerirá cantidades pares de filas y columnas.
- **RF-GEN-011 — Aprobado:** el sistema seleccionará aleatoriamente `4 × N` tipos distintos del catálogo fijo de 18; por ello `N ≤ 4`.
- **RF-GEN-012 — Aprobado:** el sistema impedirá generar con cualquier parámetro fuera de rango; si con parámetros válidos no puede resolver el mapa, fallará sin reducir microbiomas, `N` ni radio.
- **RF-GEN-013 — Aprobado:** cada tipo de gimnasio conservará al menos un bioma compatible.

## Visualización y recursos

- **RF-VIS-001 — Aprobado:** el sistema representará el tablero mediante una geometría hexagonal correcta.
- **RF-VIS-002 — Aprobado:** la visualización representará el bioma y la altura de cada posición.
- **RF-VIS-003 — Aprobado:** el gimnasio se mostrará por encima del bioma actual de su celda y conservará su identidad y tipo.
- **RF-REC-001 — Aprobado:** el sistema mostrará una matriz de piezas necesarias agrupada por bioma y altura Z1, Z2 y Z3, con totales.
- **RF-REC-002 — Aprobado:** la matriz no representa inventario disponible ni calcula por separado tapas y partes individuales.
- **RF-REC-003 — Pendiente:** inclusión de gimnasios en la matriz.
- **RF-REC-004 — Aprobado:** después de cualquier edición manual, la matriz se recalculará para representar los biomas y alturas actuales.

## Mapas guardados

- **RF-MAP-001 — Aprobado:** el usuario podrá guardar mapas.
- **RF-MAP-002 — Aprobado:** el usuario podrá consultar y volver a abrir mapas guardados.
- **RF-MAP-003 — Pendiente:** nombre, metadatos, listado, eliminación, duplicación y política de sobrescritura.
- **RF-MAP-004 — Pendiente:** medio y modelo técnico de persistencia.
- **RF-MAP-005 — Aprobado:** cada mapa conservará su configuración completa: filas, columnas, microbiomas solicitados, `N`, radio y futura semilla.

## Edición

- **RF-EDI-001 — Aprobado:** el usuario podrá editar manualmente un mapa generado.
- **RF-EDI-002 — Pendiente:** propiedades concretas editables.
- **RF-EDI-007 — Aprobado:** si se edita el bioma, solo podrán seleccionarse biomas activos.
- **RF-EDI-003 — Aprobado:** las ediciones no estarán sujetas a las restricciones de generación, no se rechazarán por ellas ni producirán errores de validez.
- **RF-EDI-004 — Aprobado:** editar una celda de microbioma desvinculará la instancia completa y conservará los valores actuales de sus celdas.
- **RF-EDI-005 — Aprobado:** guardar y abrir mapas editados no ejecutará validación ni les asignará un estado válido o inválido.
- **RF-EDI-006 — Aprobado:** solicitar una nueva generación desde un mapa editado creará un mapa nuevo e ignorará las ediciones anteriores.

## Catálogos y administración

- **RF-CAT-001 — Aprobado:** existirán exactamente 18 tipos fijos de gimnasio; no podrán crearse, eliminarse, activarse ni desactivarse.
- **RF-CAT-002 — Aprobado:** cualquier usuario podrá configurar la lista de biomas compatibles de cada tipo fijo.
- **RF-ADM-001 — Aprobado:** un administrador podrá crear, consultar, editar, activar y desactivar biomas; no podrá eliminarlos físicamente.
- **RF-ADM-002 — Aprobado:** un administrador podrá gestionar incompatibilidades simétricas entre biomas distintos.
- **RF-ADM-007 — Aprobado:** el sistema rechazará nombres de bioma duplicados sin distinguir mayúsculas y minúsculas.
- **RF-ADM-008 — Aprobado:** el sistema bloqueará la desactivación de un bioma usado por un microbioma activo o configurado como compatible en un tipo de gimnasio.
- **RF-ADM-003 — Aprobado:** un administrador podrá gestionar microbiomas.
- **RF-ADM-004 — Pendiente:** operaciones exactas disponibles para cada catálogo.
- **RF-ADM-005 — Pendiente:** protección del acceso administrativo.
- **RF-ADM-006 — Pendiente:** efecto de modificar o desactivar datos utilizados por mapas guardados.

## Autenticación

- **RF-AUT-001 — Aprobado:** la primera versión no tendrá cuentas de usuario.

## Trazabilidad

Las reglas que determinan el cumplimiento de RF-GEN-004 se encuentran en [Reglas de dominio](04-reglas-de-dominio.md) y el proceso conocido en [Generación de mapas](06-generacion-de-mapas.md).
