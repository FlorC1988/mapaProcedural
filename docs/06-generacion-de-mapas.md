# Generación de mapas

## 1. Entradas confirmadas

- filas pares entre 8 y 30, predeterminadas en 16;
- columnas pares entre 8 y 30, predeterminadas en 16;
- microbiomas entre 0 y 10, predeterminados en 2;
- `N` gimnasios por cuadrante entre 1 y 4, predeterminado en 2;
- radio global entre 0 y 2, predeterminado en 1;
- semilla visible y editable.

Si el usuario no introduce una semilla, el sistema genera y muestra una antes de iniciar la búsqueda. La semilla forma parte de la configuración conservada. Antes de buscar, el sistema valida todos los rangos y bloquea la generación si alguno es inválido. Radio 0 afecta únicamente la celda del gimnasio.

## 2. Secuencia aprobada

1. Crear la grilla rectangular vacía.
2. Seleccionar los microbiomas.
3. Colocar los microbiomas y reservar sus posiciones.
4. Generar el mapa base completando únicamente las posiciones restantes.
5. Colocar los gimnasios y aplicar sus influencias.

El resultado correcto no contiene posiciones vacías y satisface todas las condiciones de validez definidas en `04-reglas-de-dominio.md`. El generador entrega un mapa válido o falla; la validez no se aplica posteriormente a la edición manual.

## 3. Selección de microbiomas

1. Solo participan microbiomas activos.
2. El usuario indica la cantidad, no los tipos ni las ubicaciones.
3. Todos los microbiomas activos deben utilizarse al menos una vez antes de repetir cualquiera.
4. Si la cantidad solicitada no supera la cantidad activa, se seleccionan tipos distintos.
5. Si la supera, se utilizan primero todos al menos una vez y los restantes se eligen aleatoriamente entre los activos.
6. Todos tienen igual probabilidad; no existe ponderación configurable en esta versión.

## 4. Colocación de microbiomas

Cada microbioma solicitado debe:

- permanecer dentro del tablero;
- no superponerse con otro;
- no ser adyacente a otro;
- permitir una configuración válida del mapa restante;
- conservar sin rotación ni reflexión su distribución definida durante la colocación.

Las relaciones internas se exceptúan de las reglas generales. La frontera con piezas externas sí debe cumplirlas.

Si no pueden colocarse todos los microbiomas solicitados, la generación falla y no reduce automáticamente la cantidad.

## 5. Mapa base restante

Todas las posiciones no ocupadas por microbiomas deben recibir bioma y altura respetando las restricciones estructurales y las incompatibilidades.

El generador puede aceptar cualquier solución válida. No tiene objetivos de estética, diversidad, naturalidad, agrupamiento o equilibrio.

La asignación forma parte de la búsqueda global descrita en la sección 8. Para cada posición se consideran las combinaciones de bioma activo y altura que sobreviven a la propagación de las restricciones aplicables.

## 6. Gimnasios

### 6.1. Cuadrantes y selección

1. El tablero se divide por la mitad de sus filas y columnas visibles en cuatro cuadrantes iguales.
2. El sistema requiere cantidades pares de filas y columnas.
3. Cada cuadrante debe recibir exactamente `N` gimnasios; el total es `4 × N`.
4. El sistema selecciona aleatoriamente y sin repetición `4 × N` tipos del catálogo fijo de 18.
5. Como los tipos no se repiten, `N` no puede superar 4.

### 6.2. Colocación

Los gimnasios se colocan después del mapa base y los microbiomas. Para cada gimnasio:

- su celda debe pertenecer al cuadrante asignado;
- su área completa de influencia debe permanecer en ese cuadrante;
- no puede ser adyacente a otro gimnasio, incluso a través de la frontera entre cuadrantes;
- su área de influencia no puede superponerse con la de otro gimnasio;
- ocupa una sola celda y hereda su altura.

Si no pueden colocarse todos conforme a estas reglas, la generación falla y no reduce automáticamente `N` ni el radio.

### 6.3. Influencia sobre biomas

El área de influencia contiene la celda del gimnasio y las celdas a distancia hexagonal menor o igual al radio global indicado por el usuario.

Cada celda del área recibe aleatoriamente un bioma incluido en la lista de compatibilidad del tipo de gimnasio. La asignación debe respetar las incompatibilidades de biomas con las adyacencias aplicables. Las alturas no cambian.

La influencia tiene prioridad sobre microbiomas: puede cambiar el bioma de sus celdas sin desvincular la instancia, cambiar alturas ni eliminar sus excepciones internas. Las adyacencias internas siguen exentas incluso después del cambio. Esta operación de generación no se considera una edición manual y no activa la desvinculación definida para el editor.

## 7. Nueva generación desde un mapa editado

Solicitar una nueva generación crea un mapa nuevo a partir de la configuración de generación. Las ediciones del mapa anterior no se utilizan como restricciones ni como punto de partida. Si el origen es un mapa guardado, la generación utiliza los catálogos, definiciones y versión del algoritmo de su snapshot histórico, no los catálogos operativos actuales. El mapa nuevo recibe identidad y nombre únicamente cuando se guarda.

## 8. Algoritmo y búsqueda

La generación completa utiliza backtracking global y respeta la secuencia aprobada. Una decisión tomada al seleccionar o colocar microbiomas, completar el mapa base, seleccionar o colocar gimnasios, o asignar biomas a sus áreas puede deshacerse si bloquea una fase posterior.

En cada paso:

1. se propagan las restricciones aprobadas para eliminar alternativas incompatibles;
2. entre las decisiones disponibles de la fase actual, se selecciona mediante MRV la que conserva menos alternativas;
3. sus alternativas se ordenan mediante el generador pseudoaleatorio inicializado con la semilla;
4. cada intento de asignar una alternativa consume un nodo del presupuesto global;
5. si una asignación deja alguna decisión sin alternativas, se deshace y se prueba la siguiente.

Toda elección aleatoria de selección, colocación o asignación usa el mismo generador pseudoaleatorio sembrado. Con la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo, se recorre la misma búsqueda y se obtiene exactamente el mismo resultado.

El presupuesto de nodos es determinista y cubre la generación completa. Su valor numérico se fijará tras realizar benchmarks y aprobar los requisitos de rendimiento.

La búsqueda termina con uno de estos resultados funcionales:

- **Éxito:** encontró un mapa completo y válido.
- **Sin solución:** agotó todo el espacio de búsqueda sin encontrar un mapa válido.
- **Presupuesto agotado:** alcanzó el límite de nodos antes de agotar el espacio; no afirma que la configuración sea imposible.

Un error interno se informa por separado y no se clasifica como resultado funcional. Ante cualquier terminación sin éxito, el sistema descarta el candidato parcial y no lo muestra ni lo guarda como mapa.

**Pendiente:** valor numérico del presupuesto y contenido exacto de los mensajes.
