# Handoff del proyecto

Última actualización: 2026-10-10

## Estado actual y fase

El proyecto está en implementación por fases. Fases completadas: Fase 1 (base técnica), Fase 2 (generador y endpoint), Fase 3 (visualización completa), Fase 4 (persistencia de mapas), Fase 5 (editor manual) y Fase 6 (administración de catálogos).

La documentación es la única fuente de verdad. Toda decisión requiere aprobación explícita antes de documentarse como definitiva o implementarse.

## Objetivo vigente

Completar y aprobar la especificación del MVP de una aplicación web que genera, visualiza, guarda y permite editar tableros hexagonales físicos, además de administrar biomas, incompatibilidades y microbiomas.

## Trabajo completado

- Conservación del borrador original como antecedente no normativo (posteriormente eliminado del repositorio por `DEC-089`).
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
- Cierre de `PEN-014` y `PEN-015`: matriz y tabla de recursos, codificación visual de celdas, gimnasios y microbiomas, capa de influencia, inspector, navegación y errores.
- Cierre de `PEN-016`: requisitos no funcionales aprobados para rendimiento, compatibilidad, accesibilidad, seguridad, privacidad, auditoría, validación, integridad, observabilidad, respaldo, migraciones, pruebas y metodología de benchmark para fijar el presupuesto de nodos.
- Cierre de `PEN-019`: stack tecnológico aprobado — Supabase autohospedado con Postgres, Node.js/Express backend, React frontend, contenedores Docker propios, driver `pg` directo, migraciones imperativas de Supabase, snapshot JSONB, RLS con rol de servicio y respaldo como responsabilidad de la infraestructura.
- Aprobación de `DEC-087` (TypeScript en frontend y backend) y `DEC-088` (monorepo `server/`+`web/`, Vite, Supabase CLI local, implementación por fases).
- Aprobación de `DEC-089` y eliminación formal del borrador del repositorio.
- Aprobación de `DEC-090` y ajustes visuales: gimnasio con nombre de tipo en lugar del icono + trama y borde, contornos de microbioma violeta punteado uniforme, anillo de selección inset, capa de influencia reforzada, columna "Total estructura" en la matriz, marcadores inline `(N)` cuando superan 1 y conmutador de modo oscuro (no afecta al tablero).
- Aprobación de `DEC-091` y rediseño de administración: los formularios de biomas, compatibilidades de tipos de gimnasio y definiciones de microbioma pasaron a diálogos modales (`web/src/componentes/Modal.tsx`, `<dialog>` nativo). Además, al pulsar Generar se abre un modal donde el usuario elige qué definiciones activas participan y la cantidad total a colocar; `ConfigGeneracion` gana `microbiomasElegidos?: string[]` (ausente en snapshots anteriores = todas las activas, preservando la reproducibilidad histórica). El reparto aleatorio se limita al subconjunto elegido.
- Implementación de la Fase 2: dominio hexagonal (`server/src/dominio/hex.ts`, conversiones visible↔axial, distancia, vecinos, radio, cuadrantes), PRNG mulberry32 sembrado con hash FNV-1a (`server/src/generador/prng.ts`), generador con backtracking global entre fases mediante generadores resumibles, MRV, propagación (forward checking) y presupuesto determinista de nodos (`server/src/generador/generador.ts`, `VERSION_ALGORITMO = 1`, presupuesto provisional 500 000 pendiente de benchmark), `POST /api/generar` con validación de rangos en servidor y resultados diferenciados (`exito`/`sin_solucion`/`presupuesto_agotado`), y frontend con formulario conectado, render SVG provisional de hexágonos flat-top y matriz de recursos. Verificado: 5 semillas → mapas válidos según script `server/scripts/validar-mapa.mjs`, reproducibilidad exacta por semilla, rechazo de parámetros inválidos, `sin_solucion` sin definiciones activas.
- Implementación de la Fase 3: `web/src/componentes/Tablero.tsx` con hexágonos flat-top, coordenadas visibles siempre, color + icono + etiqueta Z persistente, símbolo y tipo de gimnasio superpuesto, contornos de microbioma por instancia (bordes calculados por dirección axial), capa de influencia conmutable oculta inicialmente, inspector de celda (coordenadas, bioma, altura, gimnasio, microbioma), ajuste inicial al espacio, zoom por botones y rueda, desplazamiento por arrastre (pointer events) y navegación por teclado de celdas. Se insertó una definición de microbioma de prueba (`Bosquecito`, 3 celdas) en la base local para verificar contornos y generación con microbiomas (resultado válido).
- Implementación de la Fase 4: endpoints `GET/POST /api/mapas`, `GET/PUT/DELETE /api/mapas/:id`, `POST /api/mapas/:id/regenerar` (usa el contexto histórico del snapshot, `RD-REG-007`), nombre único case-insensitive con rechazo 409, concurrencia optimista por versión, validación estructural mínima del snapshot. Frontend: componente `VistaMapa` compartido (Guardar / Guardar como / Duplicar / Regenerar / Eliminar con confirmación), página Mapas con búsqueda parcial, orden y reapertura.
- Implementación de la Fase 6: `server/src/dominio/microbioma.ts` (validación estructural de definiciones: ancla (0,0), 1–900 celdas únicas, conectividad BFS, extensión ≤30×30 en ambas paridades del ancla, biomas activos); mutaciones en `server/src/routes/catalogos.ts` (POST/PUT biomas con incompatibilidades simétricas transaccionales y bloqueo de desactivación RF-ADM-008, PUT tipos-gimnasio con al menos un bioma activo, POST/PUT microbiomas con concurrencia optimista, registro en `auditoria_admin`); frontend `web/src/admin/` (`BiomasAdmin`, `TiposAdmin`, `MicrobiomasAdmin` con búsqueda/filtro/orden, `EditorMicrobioma` con herramientas agregar/eliminar/ancla/editar y selección múltiple).
- Implementación de la Fase 5: `web/src/editor/operaciones.ts` (funciones puras: cambiar bioma/altura con desvinculación de instancia, agregar/quitar/mover/cambiar tipo de gimnasio sin reaplicar influencia, estampar/mover/desvincular microbioma con validación de encaje, expansión por bordes con desplazamiento de coordenadas), `web/src/componentes/Editor.tsx` (selector de herramienta + parámetros + formulario de expansión), historial de sesión deshacer/rehacer en `VistaMapa` (botones + Ctrl+Z/Y), recálculo automático de recursos. El estado del mapa en curso vive en `web/src/estado.tsx` (contexto global) y sobrevive a la navegación entre páginas.
- Implementación de la Fase 1: `supabase init` con dos migraciones (`catalogos_iniciales` crea `biomas`, `incompatibilidades`, `tipos_gimnasio`, `tipo_gimnasio_biomas`, `microbiomas`, `auditoria_admin` y `mapas` con snapshot JSONB y RLS completo; `semilla_catalogos` inserta los 5 biomas, Hielo–Magma, los 18 tipos y las 90 compatibilidades). Backend Express+TS con `pg`, logs estructurados, `/health` y `GET /api/biomas|tipos-gimnasio|microbiomas`. Frontend Vite+React+TS con navegación, formulario de generación con rangos y defaults aprobados (validación de cliente), y página de administración que lista los catálogos. Verificado: migraciones aplican limpio, API responde con datos semilla, typecheck sin errores. Comandos en `DESARROLLO.md`.
- Auditoría de consistencia documental: detección y cierre de `PEN-021`, `PEN-022` y `PEN-023`, y corrección de textos obsoletos que contradecían decisiones ya aprobadas.
- Cierre de `PEN-021`: la pieza física no es una entidad persistente independiente; la posición almacena directamente bioma y altura (`DEC-084`).
- Cierre de `PEN-022`: el contenido exacto de los mensajes de resultado de generación es un detalle de implementación calibrable, debe distinguir las cuatro categorías aprobadas (`DEC-085`).
- Cierre de `PEN-023`: fórmula estándar de distancia axial hexagonal aprobada y documentada para el radio de influencia de gimnasios (`DEC-086`).

## Trabajo en curso

- Implementación por fases del MVP aprobado. Fases 1 a 6 completadas.

## Próximos pasos

1. Benchmark de generación para fijar el presupuesto numérico de nodos (`DEC-072`).
2. Cobertura de pruebas automatizadas y accesibilidad (RNF).

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
- presupuesto global determinista, con un nodo por intento de asignación, valor numérico por calibrar mediante benchmarks;
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
- editor administrativo con adición adyacente, eliminación conectada, reanclaje, selección múltiple, listado y concurrencia optimista;
- matriz de piezas por bioma y altura y tabla separada de marcadores por tipo de gimnasio;
- celdas con color, icono, altura y coordenadas; gimnasios con símbolo y tipo; microbiomas con contorno;
- capa conmutable de influencia, panel de detalle, ajuste inicial, zoom, desplazamiento y errores persistentes;
- rendimiento: generación normal ≤5 s, difícil ≤30 s, interfaz ≤100 ms, persistencia ≤2 s;
- compatibilidad: escritorio Chromium, viewport mínimo 1280×720, 10 usuarios concurrentes;
- accesibilidad: WCAG 2.2 AA, teclado completo, tecnologías de asistencia, respeto a preferencia de reducir movimiento;
- seguridad y privacidad: red privada, HTTPS no obligatorio, sin datos personales, sin analíticas ni telemetría;
- auditoría administrativa sin identidad de usuario, retención mínima 30 días;
- validación en cliente, servidor y base de datos, con autoridad en el servidor;
- observabilidad local: logs estructurados y métricas sin contenido sensible;
- respaldo y migraciones: responsabilidad de la infraestructura, migraciones versionadas hacia adelante;
- pruebas: pirámide completa con unitarias, integración, contratos, end-to-end y accesibilidad;
- benchmark de generación: casos de referencia en estación de desarrollo, percentil 99 en 5 s y 30 s;
- pieza física sin entidad independiente, mensajes de resultado de generación como detalle calibrable y fórmula estándar de distancia axial hexagonal para el radio de influencia de gimnasios.

## Contexto técnico

Está aprobado el stack tecnológico: **Supabase autohospedado** con Postgres como base relacional, **Node.js/Express** como backend, **React** como frontend, todos desplegados en contenedores Docker en la red privada. El backend se conecta a Postgres mediante el driver `pg` con un rol de servicio; el frontend solo se comunica con el backend. Se habilita RLS en todas las tablas del esquema `public` y solo el rol de servicio del backend tiene permisos. El Data API de Supabase no se expone al cliente.

Cada mapa tiene identidad estable, nombre único, fechas y versión de concurrencia. El contexto histórico del snapshot no cambia con los catálogos operativos y se usa al regenerar. Las actualizaciones desactualizadas se rechazan sin sobrescribir.

El editor no admite posiciones vacías. Permite modificar bioma, altura, gimnasios e instancias de microbioma, ampliar por bordes y deshacer o rehacer durante la sesión. Editar gimnasios no reaplica influencia; estampar microbiomas sobrescribe bioma y altura y conserva gimnasios.

El área administrativa no tiene protección en el MVP y está disponible para cualquier usuario de la instalación. Las definiciones de microbioma tienen identidad, nombre único, estado y versión; usan coordenadas axiales relativas conectadas respecto de un ancla y solo se guardan si cumplen todas las validaciones. No se eliminan físicamente y las nuevas se crean activas.

Los recursos se presentan como matriz de piezas por bioma y altura y tabla separada de gimnasios por tipo. La visualización combina color, iconos y texto; superpone gimnasios, contornea microbiomas y ofrece una capa de influencia conmutable, inspector de celda, zoom y desplazamiento.

El generador usa backtracking global entre las fases aprobadas, MRV y propagación de restricciones. Cada alternativa intentada consume un nodo de un presupuesto global determinista cuyo valor se calibrará mediante benchmarks en una estación de desarrollo típica con Chromium. El límite normal se fijará en el percentil 99 de ejecuciones exitosas dentro de 5 s; el límite difícil, en el percentil 99 dentro de 30 s. Agotar el espacio demuestra ausencia de solución; agotar el presupuesto no. Los candidatos parciales se descartan.

Toda aleatoriedad procede de una semilla visible y editable. Si se omite, se genera y muestra antes de buscar. La repetición exacta exige la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo.

La geometría aprobada usa coordenadas axiales `(q, r)` para la lógica y `(fila, columna)` para la interfaz. Las columnas visibles pares se desplazan medio hexágono hacia abajo y las coordenadas visibles se muestran siempre.

La validación es una operación del generador, no del editor ni de la persistencia. Los mapas conservan instancias de microbiomas hasta que se edita manualmente una de sus celdas; entonces la instancia completa se desvincula. La influencia de un gimnasio durante la generación sí puede cambiar sus biomas sin desvincularla.

Cada gimnasio es una entidad con identidad y uno de 18 tipos fijos. La generación selecciona `4 × N` tipos sin repetición, distribuye `N` por cuadrante y aplica un radio global configurado por el usuario. Las áreas no se superponen ni cruzan cuadrantes. No existe entidad Elemento; cada tipo contiene sus compatibilidades.

Los biomas tienen identidad, nombre único sin sensibilidad a mayúsculas, color, icono y estado. Solo los activos participan en configuraciones nuevas. Las incompatibilidades son pares simétricos entre biomas distintos.

Los requisitos no funcionales están completos: rendimiento, compatibilidad, accesibilidad, seguridad, privacidad, auditoría, validación, integridad, observabilidad, respaldo, migraciones, pruebas y benchmark. El stack de persistencia y despliegue también está aprobado: Supabase autohospedado, Postgres, Node.js/Express, React, Docker, driver `pg`, migraciones imperativas de Supabase, snapshot JSONB, RLS con rol de servicio y respaldo como responsabilidad de la infraestructura.

Archivos relevantes:

- `server/`, `web/`, `supabase/migrations/`, `DESARROLLO.md`: código de la Fase 1 y comandos de desarrollo.
- `README.md`: índice y autoridad documental.
- `borrador especificacion.md`: eliminado del repositorio (`DEC-089`), ya no es parte del proyecto.
- `docs/00-gobierno.md`: proceso obligatorio.
- `docs/03-requisitos-funcionales.md`: capacidades y estados.
- `docs/04-reglas-de-dominio.md`: restricciones del tablero.
- `docs/05-modelo-de-datos.md`: estructura conceptual y modelo de persistencia.
- `docs/08-administracion-de-catalogos.md`: operación e integridad histórica de catálogos.
- `docs/09-interfaz-y-flujos.md`: flujos de generación, guardado, reapertura y edición.
- `docs/10-requisitos-no-funcionales.md`: requisitos de calidad aprobados.
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
- borrador eliminado del repositorio por decisión `DEC-089` (2026-10-10);
- revisión residual completada: requisitos de edición separados, `N > 4` rechazado y alcance actualizado;
- límites y valores predeterminados propagados de forma consistente; `PEN-001` y `PEN-018` solo permanecen como trazabilidad de decisiones resueltas;
- algoritmo, búsqueda, fallos y semilla propagados; `PEN-005`, `PEN-006` y `PEN-007` solo permanecen como trazabilidad de decisiones resueltas;
- persistencia, mapas guardados e integridad histórica propagados; `PEN-008`, `PEN-009` y `PEN-013` solo permanecen como trazabilidad de decisiones resueltas;
- herramientas de edición y acceso administrativo propagados; `PEN-010` y `PEN-012` solo permanecen como trazabilidad de decisiones resueltas;
- administración de microbiomas propagada; `PEN-020` solo permanece como trazabilidad de una decisión resuelta;
- recursos y representación visual propagados; `PEN-014` y `PEN-015` solo permanecen como trazabilidad de decisiones resueltas;
- requisitos no funcionales, seguridad, privacidad, auditoría, observabilidad, respaldo, migraciones, pruebas y benchmark propagados; `PEN-016` solo permanece como trazabilidad de una decisión resuelta;
- stack tecnológico de persistencia, backend, frontend, despliegue, migraciones y modelo de acceso propagado; `PEN-019` solo permanece como trazabilidad de una decisión resuelta;
- auditoría de consistencia cruzando identificadores `RF-*`, `RD-*`, `RNF-*`, `CA-*` y `DEC-*` entre todos los documentos: sin huecos de numeración en `DEC-*`, sin `CA-*` duplicados, sin referencias a `DEC-*` inexistentes;
- textos obsoletos corregidos en `01`, `05`, `06`, `08` y `11` que contradecían decisiones ya aprobadas (persistencia, editor de microbiomas, criterios pendientes);
- pieza física, mensajes de resultado y fórmula de distancia hexagonal propagados; `PEN-021`, `PEN-022` y `PEN-023` solo permanecen como trazabilidad de decisiones resueltas;
- no existe código que verificar en esta fase.

## Problemas conocidos

- No hay decisiones técnicas pendientes del MVP. El valor numérico exacto del presupuesto de nodos se calibrará durante la construcción según `DEC-072`, y el contenido exacto de los mensajes de resultado según `DEC-085`.

## Deuda técnica

No existe implementación, por lo que todavía no hay deuda técnica de código. Se registra como deuda documental:

- completar trazabilidad integral entre requisitos, reglas y criterios;
- calibrar e implementar el benchmark para fijar el presupuesto numérico de nodos durante la construcción.

## Instrucciones para el siguiente agente

1. Leer `README.md`, `docs/00-gobierno.md`, `docs/12-decisiones.md` y este archivo antes de actuar.
2. El borrador fue eliminado del repositorio (`DEC-089`); la fuente de verdad es únicamente `docs/`.
3. No elegir ninguna opción pendiente sin presentarla y obtener aprobación explícita.
4. Registrar primero las decisiones aprobadas y actualizar después los documentos afectados.
5. Mantener este handoff actualizado al cambiar estado, decisiones, verificaciones, contexto, problemas o deuda técnica.
