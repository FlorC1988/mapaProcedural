# Handoff del proyecto

Última actualización: 2026-10-09

## Estado actual y fase

El proyecto se encuentra en definición documental previa al diseño técnico y a la implementación. Se creó la estructura normativa inicial a partir del borrador y de las decisiones aprobadas en conversación.

La documentación es la única fuente de verdad. Toda decisión requiere aprobación explícita antes de documentarse como definitiva o implementarse.

## Objetivo vigente

Completar y aprobar la especificación del MVP de una aplicación web que genera, visualiza, guarda y permite editar tableros hexagonales físicos, además de administrar biomas, incompatibilidades y microbiomas.

## Trabajo completado

- Conservación del borrador original como antecedente no normativo.
- Creación del índice documental.
- Definición del gobierno y flujo obligatorio de aprobación.
- Separación inicial de visión, glosario, requisitos, reglas, datos, generación, edición, administración, interfaz, calidad y aceptación.
- Creación del registro central de decisiones.
- Registro de decisiones aprobadas y cuestiones pendientes conocidas.
- Resolución de `PEN-004`: geometría flat-top, columnas visibles pares desplazadas hacia abajo, coordenadas axiales internas y coordenadas visibles desde 1.
- Resolución de `PEN-017`: la validez se aplica exclusivamente a la generación automática.
- Definición de edición libre, desvinculación completa de microbiomas editados, regeneración independiente y recálculo automático de recursos.
- División del tablero en cuatro cuadrantes iguales con `N` gimnasios por cuadrante.
- Conversión de gimnasio booleano a entidad identificable con tipo fijo y área de influencia.
- Definición de selección de tipos distintos, radio global, compatibilidad de biomas y prioridad sobre microbiomas.
- Resolución de `PEN-002` y `PEN-003`: catálogo inicial de biomas, propiedades, ciclo de vida e incompatibilidades simétricas.
- Corrección integral de inconsistencias: secuencia de generación, definición/instancia de microbioma, configuración persistida y catálogo fijo de 18 tipos de gimnasio.
- Separación de requisitos pendientes y aprobados de edición, rechazo explícito de `N > 4`, alcance completo del MVP y aclaración del carácter futuro de la semilla.
- Cierre de `PEN-001` y `PEN-018`: límites, valores predeterminados, compatibilidades no vacías y validación previa.
- Cierre de `PEN-005`, `PEN-006` y `PEN-007`: backtracking global con MRV y propagación, presupuesto determinista por asignaciones, resultados diferenciados, descarte de parciales y semilla visible y editable.
- Cierre de `PEN-008`, `PEN-009` y `PEN-013`: persistencia relacional compartida, cabecera y snapshot, identidad y nombres de mapa, operaciones, listado, concurrencia optimista e integridad histórica.
- Cierre de `PEN-010` y `PEN-012`: herramientas completas de edición, expansión, historial de sesión y acceso administrativo abierto sin autenticación ni autorización.
- Cierre de `PEN-020`: ciclo de vida, identidad, coordenadas axiales, validación, herramientas, listado y concurrencia del editor administrativo de microbiomas.

## Trabajo en curso

- Desarrollo progresivo de la especificación mediante decisiones explícitas.
- No existe trabajo de implementación iniciado.

## Próximos pasos

1. Presentar y resolver las decisiones pendientes por bloques, sin inferir respuestas.
2. Resolver recursos y representación visual (`PEN-014`, `PEN-015`).
3. Aprobar requisitos no funcionales y fijar mediante benchmarks el valor del presupuesto de nodos (`PEN-016`).
4. Elegir el producto, esquema físico, migraciones y despliegue de la base relacional (`PEN-019`) cuando los requisitos necesarios estén aprobados.
5. Elegir el resto de la arquitectura y tecnologías solo cuando los requisitos necesarios estén aprobados.
6. Completar la trazabilidad integral y revisar suficiencia de la especificación.
7. Iniciar implementación únicamente con una especificación suficiente y aprobada.

## Decisiones

El registro autoritativo es [`docs/12-decisiones.md`](docs/12-decisiones.md).

Decisiones rectoras:

- documentación como única fuente de verdad;
- aprobación explícita para toda decisión;
- estructura documental completa;
- registro central de decisiones;
- proyecto sin cuentas de usuario en el MVP;
- generación de cualquier solución válida;
- administración de biomas, incompatibilidades y microbiomas;
- guardado y edición de mapas dentro del MVP;
- geometría flat-top con columnas pares desplazadas, coordenadas axiales internas y coordenadas visibles desde 1;
- validez exclusiva de la generación automática y edición manual sin restricciones;
- desvinculación de toda la instancia al editar una celda de microbioma;
- nueva generación independiente de las ediciones y recálculo automático de recursos;
- cuatro cuadrantes iguales, con filas y columnas pares;
- `N` gimnasios de tipos distintos por cuadrante, con `N = 2` como valor predeterminado;
- áreas de influencia no superpuestas y contenidas en su cuadrante;
- catálogo inmutable de 18 tipos de gimnasio con compatibilidades configurables directamente;
- catálogo inicial activo de Pradera, Agua, Roca, Magma e Hielo;
- incompatibilidades simétricas, inicialmente Hielo–Magma;
- biomas sin eliminación física y desactivación bloqueada por dependencias activas;
- dimensiones pares 8..30 (default 16×16), microbiomas 0..10 (default 2), `N` 1..4 (default 2) y radio 0..2 (default 1);
- generación mediante backtracking global, MRV y propagación de restricciones;
- presupuesto global determinista, con un nodo por intento de asignación y valor numérico pendiente de benchmarks;
- resultados diferenciados entre éxito, ausencia de solución demostrada y presupuesto agotado, con errores internos aparte y descarte de parciales;
- semilla visible y editable, generada si se omite, con reproducibilidad exacta bajo contexto idéntico;
- persistencia central compartida en base relacional, con catálogos normalizados y mapas mediante cabecera y snapshot atómico;
- mapas con identidad estable, nombre único de 1..100 caracteres, fechas y versión de concurrencia;
- Guardar, Guardar como, Duplicar, listado con búsqueda y orden, y eliminación definitiva confirmada;
- snapshots históricos aislados de cambios de catálogo y usados para regenerar mapas guardados;
- rechazo de actualizaciones desactualizadas mediante concurrencia optimista;
- edición de bioma, altura, gimnasios e instancias de microbioma sin posiciones vacías;
- gimnasios editados sin reaplicar influencia y microbiomas estampados desde definiciones activas;
- expansión por bordes con dimensiones pares y actualización de la configuración;
- historial múltiple de deshacer y rehacer limitado a la sesión;
- área administrativa abierta a cualquier usuario, sin autenticación ni autorización;
- definiciones de microbioma identificables, sin eliminación física, siempre válidas y nuevas activas;
- formas axiales conectadas de 1..900 celdas, con ancla, biomas activos y extensión máxima equivalente a 30×30;
- editor administrativo con adición adyacente, eliminación conectada, reanclaje, selección múltiple, listado y concurrencia optimista.

## Contexto técnico

Está aprobada una base relacional central y compartida como clase de persistencia, con catálogos normalizados y cabecera más snapshot estructurado para mapas. Todavía no hay producto concreto de base de datos, esquema físico, migraciones, lenguaje, framework, arquitectura general ni estrategia de despliegue aprobados. No deben seleccionarse por inferencia.

Cada mapa tiene identidad estable, nombre único, fechas y versión de concurrencia. El contexto histórico del snapshot no cambia con los catálogos operativos y se usa al regenerar. Las actualizaciones desactualizadas se rechazan sin sobrescribir.

El editor no admite posiciones vacías. Permite modificar bioma, altura, gimnasios e instancias de microbioma, ampliar por bordes y deshacer o rehacer durante la sesión. Editar gimnasios no reaplica influencia; estampar microbiomas sobrescribe bioma y altura y conserva gimnasios.

El área administrativa no tiene protección en el MVP y está disponible para cualquier usuario de la instalación. Las definiciones de microbioma tienen identidad, nombre único, estado y versión; usan coordenadas axiales relativas conectadas respecto de un ancla y solo se guardan si cumplen todas las validaciones. No se eliminan físicamente y las nuevas se crean activas.

El generador usa backtracking global entre las fases aprobadas, MRV y propagación de restricciones. Cada alternativa intentada consume un nodo de un presupuesto global determinista cuyo valor se fijará tras benchmarks. Agotar el espacio demuestra ausencia de solución; agotar el presupuesto no. Los candidatos parciales se descartan.

Toda aleatoriedad procede de una semilla visible y editable. Si se omite, se genera y muestra antes de buscar. La repetición exacta exige la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo.

La geometría aprobada usa coordenadas axiales `(q, r)` para la lógica y `(fila, columna)` para la interfaz. Las columnas visibles pares se desplazan medio hexágono hacia abajo y las coordenadas visibles se muestran siempre.

La validación es una operación del generador, no del editor ni de la persistencia. Los mapas conservan instancias de microbiomas hasta que se edita manualmente una de sus celdas; entonces la instancia completa se desvincula. La influencia de un gimnasio durante la generación sí puede cambiar sus biomas sin desvincularla.

Cada gimnasio es una entidad con identidad y uno de 18 tipos fijos. La generación selecciona `4 × N` tipos sin repetición, distribuye `N` por cuadrante y aplica un radio global configurado por el usuario. Las áreas no se superponen ni cruzan cuadrantes. No existe entidad Elemento; cada tipo contiene sus compatibilidades.

Los biomas tienen identidad, nombre único sin sensibilidad a mayúsculas, color, icono y estado. Solo los activos participan en configuraciones nuevas. Las incompatibilidades son pares simétricos entre biomas distintos.

Archivos relevantes:

- `README.md`: índice y autoridad documental.
- `borrador especificacion.md`: antecedente intacto, no normativo.
- `docs/00-gobierno.md`: proceso obligatorio.
- `docs/03-requisitos-funcionales.md`: capacidades y estados.
- `docs/04-reglas-de-dominio.md`: restricciones del tablero.
- `docs/05-modelo-de-datos.md`: estructura conceptual y modelo de persistencia.
- `docs/08-administracion-de-catalogos.md`: operación e integridad histórica de catálogos.
- `docs/09-interfaz-y-flujos.md`: flujos de generación, guardado, reapertura y edición.
- `docs/11-criterios-de-aceptacion.md`: comportamientos verificables.
- `docs/12-decisiones.md`: decisiones aprobadas y pendientes.

## Verificación

Última verificación documental: 2026-10-09.

- 16 archivos Markdown esperados;
- enlaces relativos sin errores;
- identificadores de criterios de aceptación sin duplicados;
- conversión visible↔axial verificada sobre 400 posiciones;
- decisiones reemplazadas conservadas como obsoletas;
- referencias normativas alineadas con catálogo fijo, sin entidad Elemento;
- borrador intacto: 12 970 bytes, SHA-256 `5dd152cab33ba7f4334e2d33c9c5673eb0b06b1ca1d0d3ec7dff7be08ff66436`;
- revisión residual completada: requisitos de edición separados, `N > 4` rechazado y alcance actualizado;
- límites y valores predeterminados propagados de forma consistente; `PEN-001` y `PEN-018` solo permanecen como trazabilidad de decisiones resueltas;
- algoritmo, búsqueda, fallos y semilla propagados; `PEN-005`, `PEN-006` y `PEN-007` solo permanecen como trazabilidad de decisiones resueltas;
- persistencia, mapas guardados e integridad histórica propagados; `PEN-008`, `PEN-009` y `PEN-013` solo permanecen como trazabilidad de decisiones resueltas;
- herramientas de edición y acceso administrativo propagados; `PEN-010` y `PEN-012` solo permanecen como trazabilidad de decisiones resueltas;
- administración de microbiomas propagada; `PEN-020` solo permanece como trazabilidad de una decisión resuelta;
- no existe código que verificar en esta fase.

## Problemas conocidos

- El producto, esquema físico, formato técnico del snapshot, migraciones, copias de seguridad y despliegue de la base relacional no están aprobados.
- El valor numérico del presupuesto de nodos depende de benchmarks y requisitos de rendimiento aún no aprobados.

## Deuda técnica

No existe implementación, por lo que todavía no hay deuda técnica de código. Se registra como deuda documental:

- completar trazabilidad integral entre requisitos, reglas y criterios;
- convertir las decisiones pendientes de recursos, representación y calidad en especificaciones verificables;
- definir el producto, esquema físico, migraciones y operación de la persistencia relacional;
- definir requisitos no funcionales medibles y fijar mediante benchmarks el presupuesto de nodos.

## Instrucciones para el siguiente agente

1. Leer `README.md`, `docs/00-gobierno.md`, `docs/12-decisiones.md` y este archivo antes de actuar.
2. Tratar `borrador especificacion.md` solo como antecedente.
3. No elegir ninguna opción pendiente sin presentarla y obtener aprobación explícita.
4. Registrar primero las decisiones aprobadas y actualizar después los documentos afectados.
5. Mantener este handoff actualizado al cambiar estado, decisiones, verificaciones, contexto, problemas o deuda técnica.
