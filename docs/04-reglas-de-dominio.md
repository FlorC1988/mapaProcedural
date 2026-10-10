# Reglas de dominio

## 1. Modelo físico

- **RD-FIS-001:** el tablero físico se compone de piezas hexagonales apilables.
- **RD-FIS-002:** una pieza tiene una, dos o tres partes hexagonales y una tapa que determina el bioma.
- **RD-FIS-003:** las partes son reutilizables y no existen piezas permanentemente prearmadas como Z1, Z2 o Z3.
- **RD-FIS-004:** una pieza ocupa exactamente una posición y tiene una altura y un bioma.

## 2. Tablero y posiciones

- **RD-TAB-001:** el tablero tiene forma rectangular y está compuesto por posiciones hexagonales.
- **RD-TAB-002:** filas y columnas se configuran independientemente con valores pares entre 8 y 30; ambas tienen valor predeterminado 16.
- **RD-TAB-003:** una posición puede estar vacía en el modelo de datos, pero no en el resultado de la generación inicial.
- **RD-TAB-004:** la posición conserva en la aplicación la altura de la pieza colocada, aunque físicamente la altura pertenezca a la pieza.
- **RD-TAB-005:** un tablero de `F` filas y `C` columnas contiene exactamente `F × C` posiciones.
- **RD-TAB-006:** los hexágonos tienen un lado horizontal en la parte superior (orientación flat-top).
- **RD-TAB-007:** las columnas se desplazan verticalmente; las columnas visibles pares quedan medio hexágono por debajo de las impares.
- **RD-TAB-008:** el desplazamiento geométrico no agrega ni elimina posiciones ni altera la definición de adyacencia.
- **RD-TAB-009:** filas y columnas deben ser pares para dividir el tablero en cuatro cuadrantes iguales.
- **RD-TAB-010:** los cuadrantes se forman dividiendo por la mitad los índices visibles de filas y columnas; cada cuadrante contiene `(F / 2) × (C / 2)` posiciones.
- **RD-TAB-011:** la edición manual no puede dejar una posición vacía.
- **RD-TAB-012:** un mapa editado puede ampliarse por cualquiera de sus bordes sin recortarse; la suma agregada al eje vertical y al horizontal debe ser par y las dimensiones resultantes permanecen entre 8 y 30.

## 3. Adyacencia

- **RD-ADY-001:** dos posiciones son adyacentes si comparten uno de sus seis lados.
- **RD-ADY-002:** compartir únicamente un vértice no constituye adyacencia.
- **RD-ADY-003:** la adyacencia depende solo de la ubicación en la grilla, no de altura, bioma o gimnasio.
- **RD-ADY-004:** una posición vacía no participa en restricciones entre piezas.

## 4. Alturas

- **RD-ALT-001:** las alturas permitidas son Z1, Z2 y Z3.
- **RD-ALT-002:** dos piezas adyacentes no pueden diferir en más de un nivel.
- **RD-ALT-003:** se permiten Z1-Z1, Z1-Z2, Z2-Z1, Z2-Z2, Z2-Z3, Z3-Z2 y Z3-Z3.
- **RD-ALT-004:** se prohíben Z1-Z3 y Z3-Z1.

## 5. Biomas

- **RD-BIO-001:** cada pieza posee un bioma.
- **RD-BIO-002:** el catálogo inicial contiene Pradera, Agua, Roca, Magma e Hielo, todos activos.
- **RD-BIO-003:** cada bioma tiene identidad, nombre único sin distinguir mayúsculas, color, icono y estado activo/inactivo.
- **RD-BIO-004:** solo los biomas activos participan en nuevas generaciones, nuevas configuraciones de microbiomas, compatibilidades de gimnasio y ediciones manuales.
- **RD-BIO-005:** un bioma inactivo solo puede permanecer en datos históricos existentes.
- **RD-BIO-006:** una incompatibilidad es una restricción obligatoria y simétrica entre dos biomas distintos.
- **RD-BIO-007:** configurar A incompatible con B establece automáticamente B incompatible con A.
- **RD-BIO-008:** un bioma no puede ser incompatible consigo mismo.
- **RD-BIO-009:** la incompatibilidad inicial es Hielo–Magma; no existen otros pares iniciales.
- **RD-BIO-010:** un bioma no se elimina físicamente; puede activarse o desactivarse.
- **RD-BIO-011:** no puede desactivarse mientras lo use un microbioma activo o figure como compatible en un tipo de gimnasio.

## 6. Tipos de reglas

- **RD-REG-001:** las restricciones estructurales son obligatorias y no configurables por el usuario final.
- **RD-REG-002:** las incompatibilidades configuradas en los biomas son obligatorias.
- **RD-REG-003:** la primera versión no utiliza preferencias blandas.
- **RD-REG-004:** el generador solo debe satisfacer reglas explícitas; no debe buscar belleza, naturalidad, variedad, agrupamiento o equilibrio visual.
- **RD-REG-005:** toda elección aleatoria de la generación se obtiene del mismo generador pseudoaleatorio inicializado con la semilla conservada en la configuración.
- **RD-REG-006:** con la misma semilla, configuración, catálogos y definiciones, y versión del algoritmo, la generación recorre las mismas alternativas y produce exactamente el mismo resultado.
- **RD-REG-007:** al regenerar desde un mapa guardado, los catálogos y definiciones de su snapshot constituyen el contexto de generación y no se sustituyen por los catálogos operativos actuales.

## 7. Microbiomas

- **RD-MIC-001:** una definición de microbioma establece posiciones relativas, bioma y altura de cada posición.
- **RD-MIC-002:** la distribución seleccionada para una instancia es fija, no parametrizable ni aleatoria; la instancia conserva una copia histórica de la definición usada y puede recibir cambios de bioma causados por gimnasios.
- **RD-MIC-003:** durante la colocación no puede rotarse ni reflejarse. Su bioma solo puede modificarse posteriormente por la influencia prioritaria de un gimnasio, sin alterar altura ni pertenencia.
- **RD-MIC-004:** las relaciones internas de una instancia quedan exentas de restricciones generales de altura e incompatibilidad, incluso después de cambios de bioma causados por un gimnasio.
- **RD-MIC-005:** sus relaciones con piezas externas deben respetar las reglas generales.
- **RD-MIC-006:** dos microbiomas no pueden ser adyacentes.
- **RD-MIC-007:** un microbioma no puede salir del tablero ni superponerse con otro.
- **RD-MIC-008:** su colocación no puede impedir una configuración válida del resto del mapa.
- **RD-MIC-009:** el usuario solicita entre 0 y 10 microbiomas, con valor predeterminado 2.
- **RD-MIC-010:** en edición manual, estampar una definición activa crea una instancia completa sin rotación ni reflexión, reemplaza bioma y altura, conserva gimnasios y desvincula por completo cualquier instancia intersectada.
- **RD-MIC-011:** mover una instancia desvincula primero su ubicación anterior conservando los valores de sus celdas y luego aplica el estampado en la nueva ancla.
- **RD-MIC-012:** una definición guardada contiene entre 1 y 900 celdas con coordenadas axiales relativas únicas, incluye el ancla `(0,0)` y no supera una extensión equivalente a 30×30 posiciones visibles para ninguna de las dos paridades posibles de la columna del ancla.
- **RD-MIC-013:** todas sus celdas forman un único conjunto conectado mediante adyacencias por lado.
- **RD-MIC-014:** cada celda usa un bioma activo y una altura Z1, Z2 o Z3; las incompatibilidades y diferencias de altura internas no invalidan una definición.
- **RD-MIC-015:** activar, desactivar o editar una definición operativa solo afecta selecciones e instancias creadas posteriormente; las instancias y snapshots existentes conservan su copia histórica.

## 8. Gimnasios

- **RD-GIM-001:** cada gimnasio colocado es una entidad con identidad propia, uno de los 18 tipos fijos, posición y cuadrante.
- **RD-GIM-002:** un gimnasio ocupa exactamente una posición y hereda la altura de esa celda.
- **RD-GIM-003:** el usuario configura un valor común `N` entre 1 y 4, predeterminado en 2, y cada cuadrante contiene exactamente `N` gimnasios.
- **RD-GIM-004:** los `4 × N` gimnasios usan tipos distintos del catálogo fijo de 18, seleccionados aleatoriamente sin repetición; por ello `N ≤ 4`.
- **RD-GIM-005:** el catálogo fijo contiene Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno y Volador.
- **RD-GIM-006:** dos gimnasios no pueden ser adyacentes, incluso si pertenecen a cuadrantes distintos.
- **RD-GIM-007:** el usuario configura un radio global entre 0 y 2, predeterminado en 1, medido en distancia hexagonal; radio 0 incluye únicamente la celda del gimnasio.
- **RD-GIM-008:** el área de influencia incluye la celda ocupada por el gimnasio y todas las celdas cuya distancia hexagonal sea menor o igual al radio.
- **RD-GIM-009:** toda el área de influencia debe permanecer dentro del cuadrante asignado al gimnasio.
- **RD-GIM-010:** las áreas de influencia de dos gimnasios no pueden superponerse.
- **RD-GIM-011:** cada celda del área recibe aleatoriamente uno de los biomas compatibles configurados directamente en el tipo de gimnasio; inicialmente los cinco biomas son compatibles con todos los tipos y ninguna lista puede quedar vacía.
- **RD-GIM-012:** la asignación de biomas del área debe respetar las incompatibilidades con todas las celdas adyacentes aplicables.
- **RD-GIM-013:** la influencia no cambia alturas; solo cambia biomas.
- **RD-GIM-014:** la influencia puede modificar biomas de un microbioma sin desvincularlo. Sus alturas, identidad, pertenencia y excepciones internas se conservan.
- **RD-GIM-015:** la representación visual del gimnasio tiene prioridad sobre la del bioma de su celda y muestra un símbolo con su tipo sin ocultar los datos lógicos del bioma y la altura.
- **RD-GIM-016:** agregar, mover o cambiar el tipo de un gimnasio durante la edición manual no modifica biomas y deja la instancia sin área de influencia asociada; quitarlo elimina solo la instancia. Las celdas de origen o destino asociadas a microbiomas aplican la desvinculación completa de la instancia.
- **RD-GIM-017:** las restricciones de tipos distintos, adyacencia, cuadrante y áreas pertenecen a la generación y no limitan la edición manual de gimnasios.

## 9. Recursos físicos

- **RD-REC-001:** los recursos se contabilizan por combinación de bioma y altura.
- **RD-REC-002:** el cálculo representa configuraciones necesarias y no piezas permanentemente ensambladas ni inventario disponible.
- **RD-REC-003:** cada posición del mapa actual contribuye exactamente una unidad a la matriz de piezas, incluso si pertenece a un microbioma o contiene un gimnasio.
- **RD-REC-004:** cada gimnasio actual contribuye exactamente un marcador a la tabla separada de gimnasios, agrupado por tipo.
- **RD-REC-005:** los biomas históricos inactivos presentes se incluyen; no se muestran filas de biomas ni tipos de gimnasio con cantidad cero.

## 10. Validez de la generación automática

La validez se aplica exclusivamente al resultado de una generación automática.

Un resultado generado es válido si y solo si:

1. sus cantidades de filas y columnas son pares y contiene exactamente la cantidad de posiciones determinada por ellas;
2. sus cuatro cuadrantes tienen igual cantidad de posiciones;
3. todas sus posiciones contienen bioma y una altura admitida;
4. toda adyacencia externa a un mismo microbioma respeta la diferencia máxima de altura;
5. toda adyacencia externa a un mismo microbioma respeta las incompatibilidades de biomas, incluidas las asignaciones realizadas por gimnasios;
6. contiene la cantidad solicitada de microbiomas, cada uno dentro del tablero, sin superposición ni adyacencia con otro;
7. cada microbioma conserva su distribución y alturas, salvo los cambios de bioma autorizados por la influencia prioritaria de gimnasios;
8. cada cuadrante contiene exactamente `N` gimnasios de tipos fijos distintos y ningún par es adyacente;
9. cada área de influencia permanece dentro de su cuadrante y no se superpone con otra;
10. cada celda influida usa un bioma compatible con el tipo de gimnasio correspondiente;
11. ningún gimnasio o su influencia modifica alturas.

El generador entrega un resultado que cumple todas estas condiciones o informa un fallo. No entrega resultados parcialmente válidos.

Después de la generación, la edición manual no está sujeta a estas condiciones. Un mapa editado no se clasifica como válido o inválido y no se valida al guardar o abrir.
