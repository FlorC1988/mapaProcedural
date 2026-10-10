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
| DEC-040 | 2026-10-09 | Algoritmo de generación | Usar backtracking global entre las fases de la secuencia aprobada, selección de la siguiente decisión mediante MRV y propagación de restricciones. Las alternativas se ordenan mediante el generador pseudoaleatorio sembrado. Resuelve `PEN-005`. | `03`, `04`, `06`, `11` | Aprobada |
| DEC-041 | 2026-10-09 | Búsqueda y fallos | Aplicar a la generación completa un presupuesto determinista de nodos; cada intento de asignar una alternativa cuenta como un nodo. El valor se fijará tras benchmarks junto con los requisitos de rendimiento. Los resultados funcionales son éxito, ausencia de solución demostrada al agotar el espacio y presupuesto agotado; los errores internos se informan aparte. Todo candidato parcial se descarta. Resuelve `PEN-006`, salvo el valor numérico aplazado. | `03`, `06`, `09`, `10`, `11` | Aprobada |
| DEC-042 | 2026-10-09 | Semilla y reproducibilidad | La semilla es visible y editable. Si el usuario no introduce una, el sistema la genera, muestra y conserva con el mapa. Toda elección aleatoria usa el generador pseudoaleatorio sembrado. La misma semilla, configuración, catálogos y definiciones, y versión del algoritmo produce exactamente el mismo resultado. Resuelve `PEN-007`. | `03`, `04`, `05`, `06`, `09`, `11` | Aprobada |
| DEC-043 | 2026-10-09 | Alcance y modelo de persistencia | Los datos son compartidos por todos los usuarios de una misma instalación y se almacenan centralmente en una base relacional. Los catálogos operativos se representan como entidades normalizadas; cada mapa usa una cabecera relacional y un snapshot estructurado y atómico de su contenido y contexto. Resuelve `PEN-008` salvo el producto, esquema físico, migraciones y despliegue. | `01`, `03`, `05`, `08`, `09`, `10`, `11` | Aprobada |
| DEC-044 | 2026-10-09 | Identidad y nombre de mapa | Cada mapa tiene identificador estable independiente del nombre, nombre obligatorio de 1 a 100 caracteres tras recortar espacios exteriores, fecha de creación, fecha de última modificación y versión de concurrencia. El nombre es único en la instalación sin distinguir mayúsculas. | `02`, `03`, `05`, `09`, `11` | Aprobada |
| DEC-045 | 2026-10-09 | Operaciones sobre mapas | El primer guardado solicita nombre; Guardar actualiza la misma identidad; Guardar como y Duplicar crean otra identidad y exigen otro nombre único. Una coincidencia se rechaza sin sobrescribir. El borrado es definitivo tras una confirmación simple que muestra el nombre. Junto con `DEC-044` y `DEC-046`, resuelve `PEN-009`. | `03`, `05`, `09`, `11` | Aprobada |
| DEC-046 | 2026-10-09 | Listado de mapas | El listado muestra nombre y fechas, permite búsqueda parcial por nombre sin distinguir mayúsculas y orden por nombre, creación o modificación en ambos sentidos. El orden inicial es última modificación descendente. | `03`, `09`, `11` | Aprobada |
| DEC-047 | 2026-10-09 | Integridad histórica | Cada mapa conserva un snapshot inmutable del contexto completo: configuración, catálogos y definiciones elegibles con sus propiedades y estados, incompatibilidades, compatibilidades de gimnasio y versión del algoritmo, además de su resultado actual. Los cambios de catálogos no alteran mapas existentes. Regenerar desde un mapa usa su snapshot. Duplicar copia el estado actual y el snapshot. Resuelve `PEN-013`. | `03`, `04`, `05`, `06`, `08`, `09`, `11` | Aprobada |
| DEC-048 | 2026-10-09 | Concurrencia de mapas | Guardar utiliza control optimista mediante la versión persistida. Si el mapa cambió desde que se abrió, el sistema rechaza la actualización sin sobrescribir y exige recargar o usar Guardar como. | `03`, `05`, `09`, `11` | Aprobada |

## Decisiones pendientes

| ID | Tema | Opciones o pregunta | Impacto | Estado |
|---|---|---|---|---|
| PEN-010 | Edición | Propiedades y herramientas editables, posiciones vacías, deshacer y modificación de dimensiones. La política de validación fue resuelta por `DEC-015`. | Producto, dominio, UI | Pendiente |
| PEN-012 | Administración | Protección del acceso sin cuentas. | Seguridad, arquitectura | Pendiente |
| PEN-014 | Recursos | Inclusión de gimnasios y otros desgloses físicos. | Producto, UI | Pendiente |
| PEN-015 | Representación visual | Gimnasios, alturas, biomas, microbiomas y errores. | UI, accesibilidad | Pendiente |
| PEN-016 | Requisitos no funcionales | Rendimiento, compatibilidad, accesibilidad, seguridad y confiabilidad. | Arquitectura, aceptación | Pendiente |
| PEN-019 | Tecnología de persistencia | Producto de base relacional, esquema físico, migraciones, copias de seguridad y despliegue. | Arquitectura, datos, operación | Pendiente |

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
