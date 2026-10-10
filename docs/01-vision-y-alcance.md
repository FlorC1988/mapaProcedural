# Visión y alcance

## Estado

Aprobado, salvo las secciones marcadas como pendientes.

## 1. Objetivo

La aplicación será una aplicación web interactiva destinada a gestionar y generar el tablero físico de un juego de mesa compuesto por piezas hexagonales apilables.

La aplicación será responsable de:

- generar un tablero;
- representarlo visualmente;
- aplicar las restricciones estructurales definidas;
- gestionar biomas, alturas y microbiomas;
- ubicar gimnasios;
- mostrar los recursos físicos necesarios para reproducirlo;
- guardar y volver a abrir mapas;
- permitir la edición manual de mapas generados;
- permitir a un administrador gestionar biomas, incompatibilidades y microbiomas;
- permitir a cualquier usuario configurar los biomas compatibles de los tipos fijos de gimnasio.

## 2. MVP aprobado

La primera versión utilizable incluirá:

1. Generación y visualización de mapas.
2. Consulta de recursos físicos.
3. Persistencia central compartida, listado y reapertura de mapas.
4. Edición manual de mapas.
5. Administración de biomas, incompatibilidades y microbiomas.
6. Configuración de biomas compatibles de los 18 tipos fijos de gimnasio.
7. Uso sin cuentas de usuario.
8. Generación de cualquier solución válida, sin objetivos estéticos.

Los detalles de estas capacidades se encuentran en los documentos especializados. La inclusión general de una capacidad no aprueba automáticamente sus comportamientos todavía pendientes.

## 3. Fuera de alcance actual

- lógica del juego;
- reglas de gameplay;
- turnos;
- jugadores;
- puntuación;
- combate;
- microbiomas parametrizados;
- rotación o reflexión de microbiomas durante la generación;
- preferencias u optimización estética;
- ponderación de selección de microbiomas;
- cuentas de usuario;
- exportación o impresión en el MVP.

El editor administrativo de microbiomas forma parte del MVP aprobado y reemplaza la exclusión que figuraba en el borrador inicial.

## 4. Principio funcional

El mapa base contiene bioma, altura y pertenencia eventual a un microbioma. Los gimnasios son entidades especiales superpuestas que heredan la altura de su celda y modifican los biomas dentro de su área de influencia sin modificar alturas.

## 5. Actores

- **Usuario:** genera, visualiza, guarda y edita mapas, y configura compatibilidades de tipos fijos de gimnasio, sin iniciar sesión.
- **Administrador:** rol funcional asumido por cualquier usuario que accede al área administrativa para gestionar los catálogos de biomas, incompatibilidades y microbiomas. En el MVP no se distingue ni protege este acceso.
