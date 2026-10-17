# Expansión Pokémon

## Estado

Este documento fue **aprobado** el 2026-10-16 (`DEC-093`–`DEC-098`, `DEC-100`–`DEC-104`). La única cuestión abierta es `DEC-099` (vínculo especie–gimnasio, aplazado a una etapa posterior), registrada en [12-decisiones.md](12-decisiones.md); la sección 5 no puede implementarse hasta su resolución.

## 1. Propósito y alcance

**Aprobado** (`DEC-093`). Extender la aplicación con un catálogo Pokémon procedente del archivo `National Pokedex Gen 9.xlsx`, administrable por cualquier usuario de la instalación, e integrado al tablero mediante:

- aparición por bioma definida por **tipo elemental**: cada bioma declara qué tipos pueden aparecer en sus celdas, con un atributo que indica si la elegibilidad considera solo el Type I de la especie o también el Type II (ej.: si el bioma "Basurero" permite el tipo Veneno, el atributo decide si una especie Planta/Veneno es elegible);
- vinculación de especies a los gimnasios a través de sus tipos.

Quedan fuera de esta propuesta, salvo decisión expresa: combates, entrenadores, evoluciones aplicadas durante el juego, fichas imprimibles y cualquier mecánica de partida.

## 2. Fuente de datos

**Aprobado.** La fuente inicial es `National Pokedex Gen 9.xlsx`, que tras su depuración contiene dos hojas:

### Hoja `Pokedex-JuegoMesa` (1215 filas)

| Columna | Contenido | Cobertura |
|---|---|---|
| A — National Dex | Número de dex nacional; admite decimales (p. ej. `3.1` para formas) | 1215 |
| B — Pokemon Name | Nombre | 1215 |
| C — Type | Categorías de la especie (Starter, Fossil, Legendary, Mythical, formas regionales, etc.); admite varias separadas por coma (p. ej. `Starter, Mega Evolution`); vacío = sin categoría | 412 |
| D — Type I | Primer tipo elemental | 1215 |
| E — Type II | Segundo tipo elemental | 668 |
| F — HP | Puntos de vida del juego de mesa | 345 |
| G — INICIATIVA | Iniciativa del juego de mesa | 345 |
| H — PUNTOS EVOLUCION | Puntos de evolución del juego de mesa | 345 |
| I–L — TIPO COMP 1–4 | Tipos elementales de los ataques que la especie puede usar | 345 |
| M — ATAQUE INICIAL | Nombre del ataque inicial (referencia a `Atques-JuegoMesa`) | 345 |

Observaciones sobre los datos:

- Toda especie tiene Type I; 668 tienen Type II. TIPO COMP 1–4 es un dato aparte (tipos de ataque usables), solo presente en las 344 especies con datos de juego.
- Solo 344 especies tienen los datos propios del juego de mesa (HP, iniciativa, puntos de evolución, TIPO COMP, ataque inicial). Cobertura aprobada en `DEC-100`.

### Hoja `Atques-JuegoMesa` (237 ataques)

| Columna | Contenido | Cobertura |
|---|---|---|
| A — NOMBRE | Nombre del ataque | 237 |
| B — TIPO | Tipo elemental | 237 |
| C — DESCRIPCIÓN | Efecto en lenguaje natural | 237 |
| D — DAÑO | Daño base numérico | 237 |
| E — ESTADO OBJETIVO | Estado alterado infligido al objetivo | 68 |
| F — ESTADO AUTO | Estado alterado infligido al usuario | 6 |
| G | Marca editorial `REVISAR` en 10 ataques; no es un dato a importar | 10 |

Los estados alterados aparecen como texto libre (`Quemadura`, `Confusion`, etc.); se modelan como catálogo normativo propio (`DEC-097`).

## 3. Entidades propuestas

### 3.1. Especie Pokémon — Aprobado (`DEC-095`)

```text
Especie
├── identidad estable
├── número de dex nacional (admite decimales para formas)
├── nombre
├── categorías (conjunto de 0..n, catálogo normalizado, `DEC-104`)
├── tipo I y tipo II (tipos elementales; Type II opcional)
├── HP (opcional)
├── iniciativa (opcional)
├── puntos de evolución (opcional)
├── tipos de ataque compatibles (1..4 tipos elementales)
├── ataque inicial (referencia a Ataque, opcional)
├── PreEvolucion
├── Evolucion
├── Etapa (estado evolutivo)
├── Sprite URL (URL de imagen o gif de la especie)
├── Grito (URL de archivo de sonido con el grito de la especie)
├── Generación (entero de hasta 2 dígitos: generación en que se introdujo)
├── probabilidad de aparición en un bioma
├── probabilidad de ser shiny
└── estado activo/inactivo, versión de concurrencia, fechas
```

El origen de los datos de estos atributos es mixto: parte provendrá de nuevas columnas del xlsx, parte se administrará en la aplicación y parte se obtendrá de PokéAPI (`https://pokeapi.co/`, `DEC-103`). La distribución exacta por columna se detalla al implementar la importación (`DEC-101`).

Reglas aprobadas (`DEC-095`):

- la identidad es el número de dex nacional más la distinción de forma cuando el número es decimal;
- el nombre es único sin distinguir mayúsculas (mismo criterio que biomas y microbiomas);
- sin eliminación física; la desactivación queda bloqueada cuando la especie es referenciada por dependencias activas (ataque inicial de otras especies, apariciones configuradas o asignaciones existentes, según se detalle al implementar);
- concurrencia optimista por versión, coherente con `DEC-058`.

### 3.2. Ataque — Aprobado

```text
Ataque
├── identidad estable
├── nombre único sin distinguir mayúsculas
├── tipo elemental
├── descripción del efecto
├── daño base
├── estado sobre el objetivo (opcional)
└── estado sobre el usuario (opcional)
```

Los estados alterados se modelan como catálogo normativo propio (entidad Estado con identidad y nombre único); los campos de estado sobre objetivo y sobre usuario lo referencian (`DEC-097`).

### 3.3. Tipo elemental — Aprobado

El catálogo de 18 tipos elementales (Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno, Volador) es la misma tabla fija de tipos de gimnasio (`DEC-032`). Se mantiene una única tabla compartida que no variará: servirá de referencia para los tipos de las especies, los tipos de ataque, los tipos compatibles de ataque (TIPO COMP), la aparición por bioma y los tipos de gimnasio (`DEC-094`).

## 4. Aparición por bioma — Aprobado

La aparición se define **por tipo elemental, no por especie**: cada bioma declara los tipos que pueden aparecer en sus celdas. Tabla administrable aprobada:

```text
Aparición
├── bioma (referencia)
├── tipo elemental (referencia)
└── incluyeTipoII: si las especies con ese tipo como Type II también son elegibles
```

Una especie es elegible para un bioma cuando su Type I coincide con algún tipo habilitado del bioma, o cuando su Type II coincide y el bioma marcó `incluyeTipoII` para ese tipo. La rareza relativa entre especies elegibles la aporta la probabilidad de aparición definida en la especie (sección 3.1).

Materialización (`DEC-098`): la aparición es un **cálculo derivado a demanda**. Al consultar un mapa se computan las especies elegibles para cada bioma presente; no se asignan especies a celdas, no interviene la generación, no consume presupuesto ni semilla y no forma parte del snapshot ni del contexto histórico. La consulta refleja siempre el estado actual de los catálogos. Una especie cuyo tipo no está habilitado en ningún bioma simplemente no aparece en ninguna consulta, y un bioma sin tipos habilitados produce una lista vacía.

## 5. Pokémon en gimnasios — Pendiente (`DEC-099`)

La generación de pokémon de los gimnasios queda **aplazada a una etapa posterior**. Cuando se aborde, `DEC-099` definirá:

- si la asociación es automática (todas las especies activas del tipo) o una selección por gimnasio;
- si representa un equipo del líder, una reserva, o solo elegibilidad;
- si se asigna durante la generación, se edita manualmente, o se deriva al consultar;
- si el tipo II de una especie también la hace elegible.

## 6. Administración — Aprobado

Siguiendo el modelo aprobado para catálogos (`DEC-054`, sin autenticación en el MVP):

- listados con búsqueda parcial por nombre, filtros (tipo, categoría, estado) y orden;
- creación, edición, activación y desactivación de especies y ataques; sin eliminación física;
- administración de la tabla de aparición por bioma (tipo elemental + flag `incluyeTipoII`);
- concurrencia optimista por versión en todas las escrituras;
- registro en `auditoria_admin` coherente con `DEC-068`;
- los cambios no alteran mapas ni snapshots existentes, coherente con `DEC-047`.

## 7. Importación — Aprobado

Cobertura (`DEC-100`): la carga inicial importa las **1215 especies** de `Pokedex-JuegoMesa`. Solo las 344 especies con datos de juego completos se crean activas; el resto se crea inactivo. Las categorías vacías equivalen a sin categoría especial y los datos ausentes quedan nulos.

Mecanismo (`DEC-101`): inicialmente un **script de una vez** lee el xlsx y vuelca a Postgres; el archivo queda en el repositorio como fuente canónica de la carga inicial. En etapas posteriores se permitirá importar CSV y, más adelante, carga por interfaz.

Fuentes externas (`DEC-103`): la API pública aprobada es **PokéAPI** (`https://pokeapi.co/`) para sprite, grito, generación y cadena evolutiva según corresponda. Los datos obtenidos quedan sujetos a edición administrativa posterior.

Reproducibilidad (`DEC-102`): los datos Pokémon no participan en la semilla, el snapshot ni el contexto histórico; la reproducibilidad exacta no es requerida para ellos.

## 8. Requisitos funcionales

Prefijos: `RF-PKM` (especies), `RF-ATQ` (ataques), `RF-ENC` (aparición), `RF-GYM-P` (gimnasios).

- **RF-PKM-001 — Aprobado:** un administrador podrá crear, consultar, editar, activar y desactivar especies; no podrá eliminarlas físicamente.
- **RF-PKM-002 — Aprobado:** cada especie tendrá identidad estable, número de dex nacional con decimales permitidos, nombre único sin distinguir mayúsculas de 1 a 100 caracteres, conjunto de categorías (`DEC-104`), tipos elementales, datos de juego opcionales (HP, iniciativa, puntos de evolución), hasta 4 tipos de ataque compatibles, ataque inicial opcional, cadena evolutiva (PreEvolucion, Evolucion, Etapa), Sprite URL, Grito (URL de sonido), Generación (entero de hasta 2 dígitos), probabilidad de aparición, probabilidad shiny, estado y versión de concurrencia.
- **RF-PKM-003 — Aprobado:** el listado de especies permitirá búsqueda parcial por nombre, filtros por tipo, categoría (cualquiera del conjunto), generación y estado, y orden.
- **RF-PKM-006 — Aprobado:** el sistema podrá obtener o completar datos de especie desde PokéAPI (`DEC-103`); los datos así obtenidos quedan sujetos a edición administrativa posterior.
- **RF-ATQ-001 — Aprobado:** un administrador podrá crear, consultar, editar, activar y desactivar ataques; no podrá eliminarlos físicamente.
- **RF-ATQ-002 — Aprobado:** cada ataque tendrá nombre único sin distinguir mayúsculas, tipo elemental, descripción, daño numérico y estados opcionales sobre objetivo y usuario referenciados al catálogo de estados (`DEC-097`).
- **RF-ATQ-003 — Aprobado:** existirá un catálogo normativo de estados alterados con identidad y nombre único, administrable con las mismas reglas que el resto de catálogos.
- **RF-ENC-001 — Aprobado:** un administrador podrá administrar qué tipos elementales son elegibles para aparecer en cada bioma, indicando por tipo si la elegibilidad incluye también a las especies que lo tienen como Type II.
- **RF-ENC-002 — Aprobado:** la consulta de un mapa mostrará, calculado a demanda, el conjunto de especies activas elegibles por cada bioma presente, según el mecanismo de la sección 4 (`DEC-098`); no habrá asignación de especies a celdas.
- **RF-GYM-P-001 — Pendiente:** (según `DEC-099`) cada gimnasio podrá mostrar o recibir especies asociadas a su tipo elemental.
- **RF-PKM-004 — Aprobado:** las escrituras sobre especies, ataques y apariciones serán atómicas, con concurrencia optimista y registro en auditoría administrativa.
- **RF-PKM-005 — Aprobado:** los cambios de los catálogos Pokémon no alterarán mapas ni snapshots existentes.
- **RF-IMP-001 — Aprobado:** la carga inicial importará las 1215 especies desde el xlsx mediante un script; solo las especies con datos de juego completos se crearán activas (`DEC-100`, `DEC-101`).
- **RF-IMP-002 — Aprobado:** en etapas posteriores el sistema admitirá importación desde CSV y, más adelante, carga por interfaz (`DEC-101`).

## 9. Decisiones asociadas

| ID | Tema |
|---|---|
| DEC-093 | Alcance aprobado de la expansión Pokémon — **Aprobada** |
| DEC-094 | Unificación del catálogo de tipos elementales con tipos de gimnasio — **Aprobada** |
| DEC-095 | Estructura y ciclo de vida de la entidad Especie — **Aprobada** |
| DEC-096 | Interpretación de columnas fuente — **Aprobada** |
| DEC-097 | Estados alterados como catálogo normativo — **Aprobada** |
| DEC-098 | Aparición como cálculo derivado a demanda — **Aprobada** |
| DEC-099 | Naturaleza del vínculo especie–gimnasio (etapa posterior) — Pendiente |
| DEC-100 | Cobertura de la importación: 1215 especies, activas solo las 344 con datos de juego — **Aprobada** |
| DEC-101 | Importación: script desde xlsx, luego CSV, después interfaz — **Aprobada** |
| DEC-102 | Sin reproducibilidad para datos Pokémon — **Aprobada** |
| DEC-103 | PokéAPI como fuente externa — **Aprobada** |
| DEC-104 | Categorías multivalor de Especie (enmienda DEC-095) — **Aprobada** |
