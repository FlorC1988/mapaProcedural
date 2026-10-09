# Edición y validación

## Estado

La edición manual pertenece al MVP y es libre de las restricciones aplicadas por el generador. Las propiedades concretas que podrán editarse todavía requieren aprobación.

## 1. Validez

La validez se aplica exclusivamente al resultado de la generación automática. El generador entrega un mapa que satisface todas las reglas documentadas o falla.

Después de generado, el mapa puede modificarse libremente. Un mapa editado no se clasifica como válido o inválido y no se valida al editar, guardar o volver a abrir.

## 2. Edición libre

- Las restricciones espaciales y de validez de generación no se aplican a las ediciones manuales.
- Si la propiedad editada es el bioma, solo se ofrecen biomas activos; los inactivos históricos permanecen visibles donde ya existen.
- Un cambio no se rechaza por romper restricciones de altura, biomas, microbiomas o gimnasios.
- La interfaz no presenta esas diferencias como errores de validez.
- Guardar o abrir no ejecuta una validación.
- La matriz de recursos se recalcula después de cada edición y representa los biomas y alturas actuales.

## 3. Microbiomas

Cada colocación generada conserva inicialmente la identidad de su instancia y las celdas asociadas.

La alteración de biomas causada por un gimnasio durante la generación no se considera una edición manual y no desvincula el microbioma.

Cuando el usuario edita manualmente una celda perteneciente a un microbioma:

1. se desvincula la instancia completa;
2. todas sus celdas dejan de pertenecer a esa instancia;
3. las celdas conservan sus valores actuales de bioma, altura y gimnasio;
4. el cambio solicitado se aplica a la celda editada.

La desvinculación evita representar como microbioma una estructura que ya no coincide necesariamente con su definición.

## 4. Nueva generación

Solicitar una nueva generación desde un mapa editado crea un mapa nuevo desde la configuración. Las ediciones existentes se ignoran y no actúan como restricciones ni como punto de partida.

## 5. Decisiones pendientes

- propiedades editables: bioma, altura, gimnasio u otras;
- posibilidad de vaciar una posición;
- deshacer y rehacer;
- modificación directa de dimensiones;
- creación de una nueva versión o sobrescritura al guardar;
- resolución de cambios concurrentes, si llegaran a existir.

## 6. Restricciones que no deben inferirse

Hasta que se aprueben las decisiones pendientes, no se asumirá que todas las propiedades son editables, que pueden existir posiciones vacías por edición, ni que guardar sobrescribe o crea una versión nueva.
