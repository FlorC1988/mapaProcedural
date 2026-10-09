# Registro central de decisiones

Este es el registro obligatorio de decisiones. Una fila aprobada autoriza únicamente el alcance expresado; los detalles no mencionados continúan pendientes.

## Decisiones aprobadas

| ID | Fecha | Tema | Resolución | Documentos afectados | Estado |
|---|---|---|---|---|---|
| DEC-001 | 2026-10-08 | Fuente de verdad | La documentación normativa es la única fuente de verdad. | Todos | Aprobada |
| DEC-002 | 2026-10-08 | Aprobaciones | Toda decisión funcional, técnica, visual o documental requiere aprobación explícita. | `00-gobierno.md` | Aprobada |
| DEC-003 | 2026-10-08 | Continuidad | Crear y mantener `handoff.md` con estado, decisiones, verificación, contexto técnico, problemas y deuda técnica. | `handoff.md`, `00-gobierno.md` | Aprobada |
| DEC-004 | 2026-10-08 | Raíz del proyecto | Usar `C:\Users\Florencia\Documents\Proyectos\mapa`. | Todos | Aprobada |
| DEC-005 | 2026-10-08 | Organización | Dividir la fuente de verdad en una estructura documental completa. | `README.md`, `docs/` | Aprobada |
| DEC-006 | 2026-10-08 | Borrador | Conservar `borrador especificacion.md` intacto como antecedente no normativo. | `README.md`, `00-gobierno.md` | Aprobada |
| DEC-007 | 2026-10-08 | Registro | Mantener las aprobaciones en un registro central de decisiones. | Este archivo | Aprobada |
| DEC-008 | 2026-10-08 | Alcance MVP | Incluir generación, visualización, guardado, reapertura y edición manual de mapas. | `01`, `03`, `07`, `09` | Aprobada |
| DEC-009 | 2026-10-08 | Catálogos | Un administrador gestionará biomas, incompatibilidades y microbiomas. | `01`, `03`, `08` | Aprobada |
| DEC-010 | 2026-10-08 | Usuarios | La primera versión no tendrá cuentas de usuario. | `01`, `03`, `08` | Aprobada |
| DEC-011 | 2026-10-08 | Objetivo de generación | El mapa base puede ser cualquier solución válida, sin objetivos estéticos o de variedad. | `01`, `03`, `04`, `06` | Aprobada |
| DEC-012 | 2026-10-08 | Exportación | Exportar o imprimir no forma parte del MVP aprobado. | `01-vision-y-alcance.md` | Aprobada |
| DEC-013 | 2026-10-08 | Geometría hexagonal | Usar hexágonos con lado horizontal arriba (flat-top), columnas desplazadas verticalmente y columnas visibles pares desplazadas medio hexágono hacia abajo. La lógica usa coordenadas axiales `(q, r)`; la interfaz muestra siempre `(fila, columna)` desde 1. Resuelve `PEN-004`. | `02`, `04`, `05`, `09`, `11` | Aprobada |
| DEC-014 | 2026-10-08 | Validez | La validez se aplica exclusivamente al resultado de la generación automática. El generador entrega un mapa que satisface todas las reglas o falla. Los mapas editados no se clasifican como válidos o inválidos. Resuelve `PEN-017`. | `03`, `04`, `06`, `07`, `09`, `11` | Aprobada |
| DEC-015 | 2026-10-08 | Edición libre | Después de generar, las ediciones manuales no están sujetas a restricciones, no se rechazan ni producen errores de validez. Guardar o abrir no ejecuta validación. Resuelve la política de validación de `PEN-010`. | `03`, `07`, `09`, `11` | Aprobada |
| DEC-016 | 2026-10-08 | Edición de microbiomas | Editar una celda perteneciente a un microbioma desvincula la instancia completa; sus celdas conservan los valores actuales. Resuelve `PEN-011`. | `02`, `05`, `07`, `09`, `11` | Aprobada |
| DEC-017 | 2026-10-08 | Regeneración | Solicitar una nueva generación desde un mapa editado crea un mapa nuevo desde la configuración e ignora las ediciones anteriores. | `06`, `07`, `09`, `11` | Aprobada |
| DEC-018 | 2026-10-08 | Recursos tras edición | La matriz de recursos se recalcula siempre después de una edición y representa el estado actual del mapa. | `03`, `07`, `09`, `11` | Aprobada |
| DEC-019 | 2026-10-08 | Cuadrantes | Dividir el tablero por la mitad de sus filas y columnas visibles en cuatro cuadrantes iguales; filas y columnas deben ser pares. | `03`, `04`, `05`, `06`, `09`, `11` | Aprobada |
| DEC-020 | 2026-10-08 | Cantidad de gimnasios | El usuario configura un valor común `N`, predeterminado en 2, y el generador coloca exactamente `N` gimnasios en cada cuadrante, `4 × N` en total. | `03`, `04`, `06`, `09`, `11` | Aprobada |
| DEC-021 | 2026-10-08 | Catálogo de gimnasios | Reemplazada por `DEC-032` y `DEC-033`: ya no se crean tipos ni existe un catálogo de elementos separado. | `02`, `03`, `05`, `08`, `09` | Obsoleta |
| DEC-022 | 2026-10-08 | Selección de gimnasios | Reemplazada por `DEC-032`: la selección sin repetición se realiza sobre el catálogo fijo, sin estado activo. | `03`, `04`, `06`, `11` | Obsoleta |
| DEC-023 | 2026-10-08 | Influencia de gimnasio | Reemplazada por `DEC-033` en lo relativo al elemento; se conservan radio, influencia, alturas y compatibilidad directa del tipo. | `02`, `03`, `04`, `05`, `06`, `09`, `11` | Obsoleta |
| DEC-024 | 2026-10-08 | Colocación de gimnasios | Los gimnasios no son adyacentes, sus áreas de influencia no se superponen y cada área permanece dentro del cuadrante asignado. Si no es posible colocarlos, la generación falla. | `03`, `04`, `06`, `11` | Aprobada |
| DEC-025 | 2026-10-08 | Prioridad sobre microbiomas | La influencia de un gimnasio puede cambiar biomas de celdas de microbioma sin cambiar alturas ni desvincular la instancia. La pertenencia y excepciones internas continúan vigentes. Esto no altera `DEC-016`, que se aplica a ediciones manuales. | `02`, `04`, `05`, `06`, `07`, `11` | Aprobada |
| DEC-026 | 2026-10-08 | Catálogo inicial de biomas | Iniciar con Pradera, Agua, Roca, Magma e Hielo, todos activos. Resuelve la lista de `PEN-002`. | `02`, `04`, `05`, `08`, `11` | Aprobada |
| DEC-027 | 2026-10-08 | Propiedades de bioma | Cada bioma tiene identidad, nombre único sin distinguir mayúsculas, color configurable, icono configurable y estado activo/inactivo. Resuelve las propiedades de `PEN-002`. | `02`, `03`, `05`, `08`, `09`, `11` | Aprobada |
| DEC-028 | 2026-10-08 | Incompatibilidades | Las incompatibilidades son simétricas automáticamente y un bioma no puede ser incompatible consigo mismo. La única incompatibilidad inicial es Hielo–Magma. Resuelve `PEN-003`. | `02`, `04`, `05`, `08`, `11` | Aprobada |
| DEC-029 | 2026-10-08 | Ciclo de vida de biomas | Los biomas no se eliminan físicamente; solo se desactivan. Un bioma inactivo queda limitado a datos históricos y no participa en nuevas configuraciones. | `03`, `04`, `05`, `08`, `11` | Aprobada |
| DEC-030 | 2026-10-08 | Dependencias de bioma | Reemplazada por `DEC-033`: sin elementos ni estados de tipo, se bloquea la desactivación si un tipo fijo referencia el bioma. | `03`, `05`, `08`, `11` | Obsoleta |
| DEC-031 | 2026-10-08 | Secuencia de generación | Crear la grilla, seleccionar y colocar microbiomas reservando sus celdas, completar el mapa base restante y colocar gimnasios. | `04`, `06`, `11` | Aprobada |
| DEC-032 | 2026-10-08 | Tipos fijos de gimnasio | El catálogo definitivo e inmutable contiene Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno y Volador. Todos participan; no se crean, eliminan, activan ni desactivan. | `02`, `03`, `04`, `05`, `06`, `08`, `09`, `11` | Aprobada |
| DEC-033 | 2026-10-08 | Compatibilidades de gimnasio | No existe entidad Elemento. Cada tipo fijo contiene directamente sus biomas compatibles; cualquier usuario puede configurar solo esa lista. Inicialmente, los cinco biomas son compatibles con los 18 tipos. | `01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`, `11` | Aprobada |
| DEC-034 | 2026-10-08 | Edición de bioma | La edición manual solo permite asignar biomas activos; los inactivos históricos permanecen visibles donde ya existan. | `03`, `07`, `09`, `11` | Aprobada |
| DEC-035 | 2026-10-08 | Configuración del mapa | El mapa conserva filas, columnas, cantidad solicitada de microbiomas, N, radio y futura semilla, además del resultado generado. | `03`, `05`, `07`, `09`, `11` | Aprobada |
| DEC-036 | 2026-10-08 | Dimensiones | Filas y columnas se configuran independientemente con valores pares entre 8 y 30; el valor predeterminado es 16×16. Resuelve `PEN-001`. | `03`, `04`, `05`, `06`, `09`, `11` | Aprobada |
| DEC-037 | 2026-10-08 | Cantidades | La cantidad de microbiomas es 0..10, predeterminada en 2; N es 1..4, predeterminado en 2. | `03`, `04`, `05`, `06`, `09`, `11` | Aprobada |
| DEC-038 | 2026-10-08 | Radio | El radio global es 0..2, predeterminado en 1; radio 0 afecta solo la celda del gimnasio. | `03`, `04`, `05`, `06`, `09`, `11` | Aprobada |
| DEC-039 | 2026-10-08 | Validación de configuración | Cada tipo debe conservar al menos un bioma compatible. Los valores fuera de rango bloquean la generación; una configuración válida pero irresoluble falla sin reducir cantidades ni radio. Resuelve `PEN-018`. | `03`, `04`, `06`, `08`, `09`, `11` | Aprobada |

## Decisiones pendientes

| ID | Tema | Opciones o pregunta | Impacto | Estado |
|---|---|---|---|---|
| PEN-005 | Generación base | Algoritmo concreto. | Arquitectura, rendimiento, pruebas | Pendiente |
| PEN-006 | Búsqueda | Backtracking, reintentos, límites y tipos de fallo. | Generación, UX | Pendiente |
| PEN-007 | Semilla | Reproducibilidad y exposición al usuario. | Datos, generación, UX | Pendiente |
| PEN-008 | Persistencia | Tecnología y modelo para mapas y catálogos. | Arquitectura, datos | Pendiente |
| PEN-009 | Mapas guardados | Nombre, metadatos, listado, borrado, duplicación y sobrescritura. | Producto, datos, UI | Pendiente |
| PEN-010 | Edición | Propiedades y herramientas editables, posiciones vacías, deshacer y modificación de dimensiones. La política de validación fue resuelta por `DEC-015`. | Producto, dominio, UI | Pendiente |
| PEN-012 | Administración | Protección del acceso sin cuentas. | Seguridad, arquitectura | Pendiente |
| PEN-013 | Catálogos históricos | Efecto de modificar o desactivar entradas de catálogo usadas por mapas guardados. | Integridad, datos | Pendiente |
| PEN-014 | Recursos | Inclusión de gimnasios y otros desgloses físicos. | Producto, UI | Pendiente |
| PEN-015 | Representación visual | Gimnasios, alturas, biomas, microbiomas y errores. | UI, accesibilidad | Pendiente |
| PEN-016 | Requisitos no funcionales | Rendimiento, compatibilidad, accesibilidad, seguridad y confiabilidad. | Arquitectura, aceptación | Pendiente |

## Plantilla para nuevas decisiones

| Campo | Contenido |
|---|---|
| ID | Siguiente identificador disponible |
| Fecha | Fecha de aprobación, si corresponde |
| Tema | Problema concreto |
| Opciones | Alternativas presentadas |
| Resolución | Opción aprobada y alcance exacto |
| Documentos afectados | Archivos que deben actualizarse |
| Estado | Pendiente, Aprobada, Rechazada, Obsoleta o Fuera de alcance |
