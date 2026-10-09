# Handoff del proyecto

Última actualización: 2026-10-08

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

## Trabajo en curso

- Desarrollo progresivo de la especificación mediante decisiones explícitas.
- No existe trabajo de implementación iniciado.

## Próximos pasos

1. Presentar y resolver las decisiones pendientes por bloques, sin inferir respuestas.
2. Resolver a continuación generación (`PEN-005`, `PEN-006`, `PEN-007`).
3. Definir después edición, persistencia y administración.
4. Definir posteriormente los flujos de edición, persistencia y administración.
5. Aprobar requisitos no funcionales y criterios de aceptación faltantes.
6. Elegir arquitectura y tecnologías solo cuando los requisitos necesarios estén aprobados.
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
- dimensiones pares 8..30 (default 16×16), microbiomas 0..10 (default 2), `N` 1..4 (default 2) y radio 0..2 (default 1).

## Contexto técnico

Todavía no hay arquitectura, lenguaje, framework, base de datos ni estrategia de despliegue aprobados. No deben seleccionarse por inferencia.

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
- `docs/12-decisiones.md`: decisiones aprobadas y pendientes.

## Verificación

Última verificación documental: 2026-10-08.

- 16 archivos Markdown esperados;
- enlaces relativos sin errores;
- identificadores de criterios de aceptación sin duplicados;
- conversión visible↔axial verificada sobre 400 posiciones;
- decisiones reemplazadas conservadas como obsoletas;
- referencias normativas alineadas con catálogo fijo, sin entidad Elemento;
- borrador intacto: 12 970 bytes, SHA-256 `5dd152cab33ba7f4334e2d33c9c5673eb0b06b1ca1d0d3ec7dff7be08ff66436`;
- revisión residual completada: requisitos de edición separados, `N > 4` rechazado, alcance actualizado y semilla condicionada a `PEN-007`;
- límites y valores predeterminados propagados de forma consistente; `PEN-001` y `PEN-018` solo permanecen como trazabilidad de decisiones resueltas;
- no existe código que verificar en esta fase.

## Problemas conocidos

- El actor administrador no tiene un mecanismo de acceso aprobado.
- Las propiedades y herramientas exactas de edición todavía no están definidas.
- La persistencia está aprobada funcionalmente, pero no su comportamiento ni tecnología.
- El algoritmo y los límites de búsqueda no están definidos.
- Los límites numéricos están cerrados, pero el algoritmo y los límites de búsqueda aún no garantizan qué combinaciones válidas resultarán resolubles.

## Deuda técnica

No existe implementación, por lo que todavía no hay deuda técnica de código. Se registra como deuda documental:

- completar trazabilidad integral entre requisitos, reglas y criterios;
- convertir decisiones pendientes en especificaciones verificables;
- definir versionado e integridad histórica de catálogos y mapas;
- definir requisitos no funcionales medibles.

## Instrucciones para el siguiente agente

1. Leer `README.md`, `docs/00-gobierno.md`, `docs/12-decisiones.md` y este archivo antes de actuar.
2. Tratar `borrador especificacion.md` solo como antecedente.
3. No elegir ninguna opción pendiente sin presentarla y obtener aprobación explícita.
4. Registrar primero las decisiones aprobadas y actualizar después los documentos afectados.
5. Mantener este handoff actualizado al cambiar estado, decisiones, verificaciones, contexto, problemas o deuda técnica.
