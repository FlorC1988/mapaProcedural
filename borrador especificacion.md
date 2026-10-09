# Especificación funcional

## Aplicación web para generación y gestión de tableros

**Versión:** 3
**Estado:** En definición
**Metodología:** Spec-Driven Development (SDD)

---

# 1. Objetivo

La aplicación será una aplicación web interactiva destinada a **gestionar y generar el tablero físico de un juego de mesa**.

La aplicación **no implementará la lógica del juego**. No se contemplan reglas de turnos, jugadores, puntuaciones, combate ni ninguna otra mecánica de gameplay.

Su responsabilidad será:

* Generar un tablero.
* Representar visualmente el tablero.
* Aplicar las restricciones estructurales definidas.
* Gestionar biomas, alturas y microbiomas.
* Ubicar gimnasios.
* Mostrar los recursos físicos necesarios para reproducir el tablero.

La documentación de especificación será la **fuente única de verdad** del proyecto.

No deberán introducirse decisiones conceptuales no documentadas. Ante cualquier ambigüedad, contradicción o ausencia de definición, deberá consultarse antes de implementar.

---

# 2. Modelo físico

El tablero físico está compuesto por piezas hexagonales apilables.

Una pieza física está formada por:

* 1, 2 o 3 partes hexagonales apiladas.
* Una tapa que determina el bioma.

La altura de la pieza se denomina **Z**:

* Z1
* Z2
* Z3

Las partes físicas son reutilizables. No existen piezas físicas permanentemente prearmadas como Z1, Z2 o Z3.

---

# 3. Posiciones y piezas

Las **posiciones del tablero** y las **piezas físicas** son entidades conceptualmente independientes.

Una posición representa una ubicación física dentro de la grilla.

Una posición puede estar vacía en el modelo de datos, aunque el generador inicial deberá llenar todas las posiciones.

Una pieza física:

* ocupa exactamente una posición;
* tiene una altura Z;
* tiene un bioma.

La altura pertenece a la pieza física y no a la posición como concepto físico original.

Sin embargo, para el modelo de la aplicación, la posición conservará el valor de altura correspondiente a la pieza colocada.

---

# 4. Tablero

El tablero tiene forma rectangular.

Está compuesto por una grilla de posiciones hexagonales.

El usuario podrá configurar:

* cantidad de filas;
* cantidad de columnas.

La grilla debe utilizar una geometría hexagonal correcta.

---

# 5. Adyacencia

Dos posiciones son adyacentes cuando comparten uno de sus seis lados.

Compartir únicamente un vértice **no constituye adyacencia**.

La adyacencia depende exclusivamente de la posición dentro de la grilla y no de:

* altura;
* bioma;
* gimnasio.

Una posición vacía puede existir en el modelo de datos, pero no participa en las restricciones entre piezas porque no contiene una pieza.

---

# 6. Generación inicial del mapa

Durante la generación inicial:

1. Se crea la grilla rectangular.
2. Se genera el mapa base.
3. Se colocan los microbiomas.
4. Se completan las posiciones restantes.
5. Se colocan los gimnasios.

El generador inicial **no permite posiciones vacías** como resultado final.

Todas las posiciones deben recibir una configuración de mapa base.

---

# 7. Alturas

Las piezas pueden tener alturas:

* Z1
* Z2
* Z3

## Restricción topográfica

Dos piezas adyacentes no pueden diferir en más de un nivel de altura.

Permitido:

* Z1-Z1
* Z1-Z2
* Z2-Z1
* Z2-Z2
* Z2-Z3
* Z3-Z2
* Z3-Z3

No permitido:

* Z1-Z3
* Z3-Z1

Las posiciones vacías no participan en esta restricción.

El término **“orgánico”** no debe utilizarse para describir esta propiedad. La regla formal es simplemente que dos posiciones adyacentes no pueden diferir en más de un nivel de altura.

---

# 8. Biomas

Cada pieza posee un bioma.

El sistema contempla biomas con reglas de incompatibilidad configurables.

Cada bioma tendrá una propiedad que permitirá determinar con qué otros biomas no puede ser adyacente.

Ejemplo conceptual:

> Hielo incompatible con Magma.

Estas incompatibilidades son **restricciones obligatorias**, no preferencias.

---

# 9. Tipos de reglas

Las reglas del generador se dividen conceptualmente en:

## 9.1. Restricciones estructurales

Son obligatorias y no configurables por el usuario final.

Ejemplo:

> Una pieza Z3 no puede ser adyacente a una pieza Z1.

## 9.2. Incompatibilidades entre biomas

Son restricciones configuradas en las entidades de los biomas.

Una incompatibilidad configurada debe respetarse obligatoriamente.

## 9.3. Preferencias blandas

La primera versión **no tendrá preferencias blandas**.

El generador no intentará conseguir:

* mapas más bonitos;
* distribución natural;
* variedad estética;
* agrupamientos;
* equilibrio visual;
* otras características que no estén expresamente definidas como restricciones.

El generador únicamente debe satisfacer las reglas explícitas.

---

# 10. Microbiomas

Un microbioma es una estructura predefinida e invariable.

Cada microbioma define:

* posiciones relativas;
* bioma de cada posición;
* altura Z de cada posición.

La distribución espacial es fija.

Los microbiomas no son parametrizables ni aleatorios en esta versión.

No pueden:

* rotarse;
* reflejarse;
* modificarse durante la generación.

La creación de un editor de microbiomas queda fuera del alcance actual, aunque podrá incorporarse posteriormente.

---

# 11. Ejemplo de microbioma

Ejemplo conceptual de un microbioma Volcán:

```text
       Roca Z3
    Roca Z3 Roca Z3
 Roca Z3 Magma Z3 Roca Z3
    Roca Z3 Roca Z3
       Roca Z3
```

La estructura espacial y los valores definidos por el microbioma son invariantes.

---

# 12. Excepción interna de los microbiomas

Durante la generación, los microbiomas actúan como estructuras especiales.

Las relaciones **internas** entre las piezas de un mismo microbioma quedan exentas de las reglas generales.

Esto incluye:

* restricciones de altura;
* incompatibilidades de biomas;
* demás restricciones generales aplicables entre piezas independientes.

Las relaciones **externas** del microbioma sí deben respetar las reglas generales.

Por lo tanto:

* microbioma → sus propias piezas: excepción;
* microbioma → piezas externas: reglas normales;
* microbioma → otro microbioma: no se permite adyacencia.

---

# 13. Selección de microbiomas

El usuario indica únicamente **cuántos microbiomas** quiere incluir.

No selecciona manualmente cuáles ni sus posiciones.

El sistema selecciona y coloca los microbiomas automáticamente.

Solo participan los microbiomas marcados como:

```text
Activo = Sí
```

Los microbiomas inactivos permanecen almacenados pero no participan en la generación.

---

# 14. Repetición de microbiomas

La selección de microbiomas sigue esta regla:

> Todos los microbiomas activos deben utilizarse al menos una vez antes de que cualquier microbioma pueda repetirse.

Por lo tanto:

* si la cantidad solicitada es menor o igual a la cantidad de microbiomas activos, se seleccionan microbiomas distintos;
* si la cantidad solicitada es mayor, primero se utilizan todos los microbiomas activos al menos una vez;
* las posiciones restantes se completan seleccionando aleatoriamente entre los microbiomas activos;
* a partir de ese momento pueden producirse repeticiones.

Inicialmente todos los microbiomas activos tienen la misma probabilidad.

No existe ponderación configurable en esta versión.

---

# 15. Colocación de microbiomas

El sistema intenta colocar todos los microbiomas solicitados.

Un microbioma no puede:

* salir del tablero;
* superponerse con otro microbioma;
* quedar adyacente a otro microbioma;
* impedir una configuración válida del mapa de acuerdo con las restricciones definidas.

Si no es posible colocar la cantidad solicitada:

**la generación falla y se informa un error.**

No se reduce automáticamente la cantidad solicitada.

---

# 16. Gimnasios

`Gimnasio` es un elemento especial del tablero.

Representa un punto de interés.

Cada gimnasio ocupa **exactamente una celda**.

El usuario configura antes de generar el mapa:

* cantidad de gimnasios.

Los gimnasios se colocan **después de generar el mapa base y los microbiomas**.

Pueden colocarse sobre cualquier celda válida, incluyendo una celda perteneciente a un microbioma.

Los gimnasios tienen prioridad sobre el resto de los elementos visuales del tablero.

---

# 17. Propiedad de gimnasio

La entidad Posición tendrá una propiedad:

```text
gimnasio : boolean
```

Valores:

```text
true  → la posición contiene un gimnasio
false → la posición no contiene un gimnasio
```

El gimnasio no modifica:

* bioma;
* altura.

---

# 18. Restricción entre gimnasios

Dos gimnasios **no pueden ser adyacentes**.

Esta restricción debe mantenerse en el resultado final.

Si no es posible colocar la cantidad solicitada de gimnasios respetando esta restricción:

**la generación falla y muestra un error.**

No se reduce automáticamente la cantidad de gimnasios.

---

# 19. Bioma y altura frente a gimnasios

`Gimnasio` es una propiedad adicional de una posición.

No sustituyen ni modifican el bioma ni la altura.

Por lo tanto:

```text
POSICIÓN
├── coordenadas
├── bioma
├── altura
└── gimnasio : boolean
```

La altura nunca se modifica durante la colocación de gimnasios.

El bioma tampoco se modifica.

Visualmente, la prioridad es:

```text
GIMNASIO
    ↑
BIOMA
```

Es decir:

* un gimnasio se muestra por encima de un bioma;
* el bioma original permanece almacenado.

---

# 20. Prioridad de generación

El orden general es:

```text
1. MAPA BASE + MICROBIOMAS
          ↓
2. GIMNASIOS

```

La prioridad conceptual es:

```text
GIMNASIO
    ↑
MAPA BASE / MICROBIOMAS
```

Los gimnasios tampoco modifican el bioma ni la altura de su posición.

---

# 21. Matriz de recursos físicos

La aplicación mostrará una matriz de piezas físicas necesarias:

| Bioma     |  Z1 |  Z2 |  Z3 | Total |
| --------- | --: | --: | --: | ----: |
| Pradera   | ... | ... | ... |   ... |
| Agua      | ... | ... | ... |   ... |
| Roca      | ... | ... | ... |   ... |
| Magma     | ... | ... | ... |   ... |
| Hielo     | ... | ... | ... |   ... |
| **Total** | ... | ... | ... |   ... |

La matriz representa la cantidad de piezas necesarias según:

* bioma;
* altura.

Actualmente no representa inventario disponible.

No se calculan separadamente:

* cantidad de tapas;
* cantidad de partes hexagonales individuales.

La inclusión de `Gimnasio` en esta matriz queda pendiente de definición.

---

# 22. Reutilización de componentes físicos

Las partes hexagonales físicas son reutilizables.

El sistema calcula las configuraciones de piezas necesarias para reproducir el mapa generado, pero no asume que existen piezas físicas permanentemente ensambladas en determinadas alturas.

---

# 23. Fuera de alcance actual

No forman parte de esta primera versión:

* implementación del juego;
* reglas de gameplay;
* turnos;
* jugadores;
* puntuación;
* combate;
* editor de microbiomas;
* microbiomas parametrizados;
* microbiomas rotables o reflejables;
* preferencias estéticas;
* optimización estética del mapa;
* ponderación de selección de microbiomas.

---

# 24. Reglas aún pendientes de definición

Las siguientes cuestiones todavía no están cerradas y **no deben ser inferidas durante la implementación**:

1. **Inclusión de gimnasios en la matriz de recursos.**

2. **Cantidad mínima/máxima de filas y columnas del tablero.**

3. **Valores por defecto de la configuración.**

4. **Lista definitiva de biomas.**

5. **Configuración definitiva de incompatibilidades entre biomas.**

6. **Algoritmo concreto de generación del mapa base.**

7. **Algoritmo concreto de colocación de microbiomas y estrategia de backtracking/reintentos.**

8. **Modelo de persistencia de microbiomas.**

9. **Persistencia de mapas generados.**

10. **Edición manual del mapa después de generarlo.**

11. **Semilla aleatoria y reproducibilidad de una generación.**

12. **Representación visual final de la propiedad `gimnasio`.**


---

# 25. Principio fundamental

La aplicación debe distinguir claramente entre:

```text
MAPA BASE
├── Bioma
├── Altura
└── Microbioma

ELEMENTOS ESPECIALES
└── Gimnasio
```

Los elementos especiales se superponen al mapa base sin destruir ni modificar sus propiedades fundamentales.

La generación debe respetar únicamente las reglas expresamente definidas en esta especificación.
