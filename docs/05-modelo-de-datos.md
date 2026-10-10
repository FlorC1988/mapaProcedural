# Modelo de datos

## Estado

Este documento consolida conceptos del borrador y decisiones aprobadas. La tecnología y forma técnica de persistencia están pendientes.

## 1. Posición

Propiedades confirmadas:

```text
Posición
├── coordenadas
├── bioma
├── altura
└── gimnasio : referencia opcional a una instancia
```

Reglas:

- representa una ubicación de la grilla;
- puede estar vacía conceptualmente, aunque el generador inicial la completa;
- conserva la altura y el bioma de la pieza colocada;
- puede referenciar una instancia de gimnasio que ocupa esa celda;
- el gimnasio hereda la altura de la posición;
- la influencia del gimnasio puede cambiar el bioma de la posición sin cambiar su altura.

Las coordenadas internas son axiales `(q, r)`, con origen interno `(0, 0)`. La interfaz usa `(fila, columna)` desde 1 y aplica una disposición offset por columnas.

Para una coordenada visible `(fila, columna)`:

```text
q = columna - 1
r = fila - 1 - floor(q / 2)
```

Para una coordenada axial `(q, r)`:

```text
columna = q + 1
fila = r + floor(q / 2) + 1
```

Esta conversión corresponde a columnas visibles pares desplazadas medio hexágono hacia abajo. Las coordenadas visibles se mantienen dentro de `1..filas` y `1..columnas`; las axiales pueden contener valores negativos de `r` sin quedar fuera del tablero si su conversión visible está dentro de esos límites.

La edición no admite posiciones vacías. Al ampliar por arriba o por la izquierda, las posiciones existentes cambian sus coordenadas visibles y axiales de acuerdo con el desplazamiento; sus contenidos y asociaciones se conservan.

## 2. Pieza física

Conceptualmente una pieza:

```text
Pieza física
├── posición ocupada
├── altura: Z1 | Z2 | Z3
└── bioma
```

**Pendiente:** decidir si requiere una entidad persistente independiente o si la posición almacena directamente su configuración.

## 3. Tablero o mapa

Datos confirmados:

```text
Mapa
├── identidad estable
├── nombre único
├── creadoEn
├── modificadoEn
├── versión de concurrencia
├── cantidad de filas (par)
├── cantidad de columnas (par)
├── configuración de generación
│   ├── filas pares: 8..30, default 16
│   ├── columnas pares: 8..30, default 16
│   ├── microbiomas solicitados: 0..10, default 2
│   ├── N gimnasios por cuadrante: 1..4, default 2
│   ├── radio global: 0..2, default 1
│   └── semilla
├── posiciones
├── instancias de microbioma
├── instancias de gimnasio
└── contexto histórico
    ├── catálogos y definiciones elegibles, con propiedades y estados
    ├── incompatibilidades
    ├── compatibilidades de tipos de gimnasio
    └── versión del algoritmo
```

El nombre se recorta en sus extremos, debe contener entre 1 y 100 caracteres y es único en toda la instalación sin distinguir mayúsculas y minúsculas. La identidad no depende del nombre. `creadoEn` no cambia; `modificadoEn` y la versión de concurrencia cambian con cada actualización correcta.

La semilla es visible y editable. Si el usuario no introduce una, el sistema genera una antes de buscar y la conserva con el mapa. La reproducción exacta requiere la misma semilla, configuración, estado de catálogos y definiciones, y versión del algoritmo.

El contexto histórico es inmutable para la identidad del mapa: los cambios posteriores de catálogos no lo modifican. Guardar una edición reemplaza atómicamente el estado actual del snapshot, pero conserva ese contexto. Guardar como y Duplicar crean otra identidad; Duplicar copia el estado actual y el contexto, y ambos reciben nombre, fechas y versión de concurrencia nuevos.

## 4. Bioma

Datos confirmados:

```text
Bioma
├── identidad
├── nombre único
├── color
├── icono
├── activo : boolean
└── incompatibilidades[]
```

El bioma determina la tapa de una pieza. La unicidad del nombre no distingue mayúsculas y minúsculas. Color e icono son configurables.

Cada incompatibilidad se almacena conceptualmente como un único par no ordenado de biomas distintos; por ello se aplica en ambos sentidos y no admite una relación del bioma consigo mismo.

Los biomas no se eliminan físicamente. Un bioma inactivo solo permanece en datos históricos y no puede usarse en nuevas configuraciones. Su desactivación se bloquea mientras exista una dependencia activa aprobada.

## 5. Microbioma

Datos confirmados:

```text
Microbioma
├── identidad estable
├── nombre único
├── activo : boolean
├── versión de concurrencia
└── celdas[1..900]
    ├── coordenada axial relativa (dq, dr)
    ├── bioma activo
    └── altura Z1 | Z2 | Z3
```

El nombre se recorta en sus extremos, contiene entre 1 y 100 caracteres y es único sin distinguir mayúsculas. La celda `(0,0)` es el ancla. Las coordenadas no se repiten, la forma está conectada por lados y su extensión no supera el equivalente visible de 30×30. Reanclar selecciona otra celda, la convierte en `(0,0)` y recalcula todos los offsets sin cambiar la forma.

Para medir la extensión, el ancho es `max(dq) - min(dq) + 1`. Para cada paridad posible `p ∈ {0, 1}` de la columna axial del ancla, el offset de fila visible de una celda es `dr + floor((p + dq) / 2) - floor(p / 2)`; su rango `máximo - mínimo + 1` no puede superar 30 para ninguna de las dos paridades. El ancho tampoco puede superar 30.

Solo los microbiomas activos participan en generación. Los inactivos permanecen almacenados y no se eliminan físicamente. Toda definición persistida es estructuralmente válida; una nueva se crea activa.

Cada colocación se representa separadamente:

```text
InstanciaMicrobioma
├── identidad
├── definición de origen
├── posición de anclaje
└── posiciones asociadas[]
```

La instancia permite reconocer relaciones internas y cambios de bioma causados por gimnasios sin modificar su copia histórica de la definición. Editar, activar o desactivar el registro operativo de origen no cambia instancias ni snapshots existentes. Si el usuario edita manualmente una de sus celdas, se elimina la asociación de la instancia completa y sus celdas conservan los valores actuales.

En el editor, estampar una definición activa crea una identidad de instancia y asocia todas sus posiciones. Antes de sobrescribir bioma y altura se desvincula por completo cada instancia intersectada. Los gimnasios permanecen asociados a sus posiciones. Mover una instancia desvincula primero el origen y crea la colocación en la nueva ancla.

Guardar una edición compara la versión abierta con la persistida. Una diferencia rechaza la actualización sin sobrescribir; una actualización correcta incrementa la versión.

## 6. Cuadrante

El cuadrante de una posición se deriva de sus coordenadas visibles:

- superior izquierdo: filas `1..F/2`, columnas `1..C/2`;
- superior derecho: filas `1..F/2`, columnas `C/2+1..C`;
- inferior izquierdo: filas `F/2+1..F`, columnas `1..C/2`;
- inferior derecho: filas `F/2+1..F`, columnas `C/2+1..C`.

## 7. Tipo de gimnasio

```text
TipoGimnasio
├── identidad fija
├── nombre fijo
└── biomasCompatibles[1..n]
```

Existen exactamente 18 tipos inmutables: Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno y Volador. No tienen estado activo y solo puede modificarse su lista de biomas compatibles.

## 8. Instancia de gimnasio

```text
Gimnasio
├── identidad única
├── tipo
├── posición
├── cuadrante
└── área de influencia[] : opcional
```

La instancia ocupa una sola posición, hereda su altura y conserva su identidad y tipo. Durante la generación, el área de influencia se calcula con el radio global e incluye la posición del gimnasio. Agregar, mover o cambiar el tipo en edición manual elimina esa asociación sin cambiar ningún bioma; una instancia creada manualmente no tiene área asociada.

## 9. Persistencia

La persistencia es central y compartida por todos los usuarios de una misma instalación. Utiliza una base relacional con dos modelos complementarios:

- los catálogos operativos se almacenan como entidades normalizadas con sus relaciones e integridad;
- cada mapa tiene una cabecera relacional y un snapshot estructurado que agrupa atómicamente su estado actual y su contexto histórico completo.

Guardar una identidad existente compara la versión de concurrencia recibida con la persistida. Si difieren, la actualización se rechaza sin sobrescribir. Si coinciden, el estado, `modificadoEn` y la versión se actualizan en una única operación atómica.

**Pendiente:** producto concreto de base relacional, tipos físicos, esquema detallado, formato y versión técnica del snapshot, migraciones, copias de seguridad y despliegue.
