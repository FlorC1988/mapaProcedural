# Administración de catálogos

## Estado

Está aprobada la administración de biomas, incompatibilidades y microbiomas, además de la configuración de compatibilidades de tipos fijos de gimnasio. Persisten detalles pendientes indicados en cada sección.

## 1. Biomas

El catálogo inicial contiene Pradera, Agua, Roca, Magma e Hielo, todos activos. El administrador puede crear, consultar, editar, activar y desactivar biomas; no puede eliminarlos físicamente.

Cada bioma requiere identidad, nombre único, color configurable, icono configurable y estado activo/inactivo. La comparación de nombres únicos ignora mayúsculas y minúsculas.

Las incompatibilidades:

- se configuran entre dos biomas distintos;
- se aplican automáticamente en ambos sentidos;
- no permiten relacionar un bioma consigo mismo;
- comienzan únicamente con el par Hielo–Magma.

Un bioma inactivo solo puede aparecer en datos históricos. No puede utilizarse en una nueva generación, un microbioma nuevo o una compatibilidad nueva de gimnasio.

La desactivación se bloquea si el bioma está utilizado por un microbioma activo o configurado como compatible en un tipo de gimnasio.

## 2. Microbiomas

El administrador podrá gestionar microbiomas. Cada definición debe expresar posiciones relativas con bioma y altura. La generación solo utiliza microbiomas activos y conserva los inactivos almacenados.

**Pendiente:**

- operaciones administrativas exactas;
- interfaz de edición;
- validación estructural antes de activar;
- formato de coordenadas relativas.

Los cambios de una definición no alteran las copias históricas conservadas dentro de mapas existentes.

Un microbioma nuevo solo puede utilizar biomas activos. La administración de definiciones no cambia la regla de generación: una vez seleccionado, un microbioma no se rota ni refleja; sus biomas solo pueden alterarse por la influencia prioritaria aprobada de un gimnasio.

## 3. Tipos de gimnasio

Existen exactamente 18 tipos fijos: Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno y Volador.

No pueden crearse, eliminarse, activarse ni desactivarse. Cualquier usuario, sin cuenta, puede configurar únicamente la lista de biomas compatibles activos de cada tipo. Inicialmente, los cinco biomas son compatibles con los 18 tipos.

La interfaz impide guardar un cambio que deje un tipo sin biomas compatibles. Cambiar compatibilidades afecta únicamente al catálogo operativo y a contextos creados posteriormente; los snapshots de mapas existentes no cambian.

## 4. Acceso administrativo

La aplicación no tendrá cuentas de usuario, pero existe un actor administrador.

**Pendiente crítico:** aprobar cómo se distingue o protege el acceso administrativo. No se implementará un mecanismo por inferencia.

## 5. Integridad histórica

Los catálogos operativos son compartidos por toda la instalación. Cada mapa guarda un snapshot de la configuración, los catálogos y definiciones elegibles con sus propiedades y estados, las incompatibilidades, las compatibilidades de gimnasio y la versión del algoritmo. Modificar o desactivar una entrada operativa no altera ningún snapshot existente.

Abrir un mapa muestra su estado guardado aunque incluya datos actualmente inactivos. Regenerar desde él usa su contexto histórico. Las restricciones sobre datos activos continúan aplicándose a configuraciones nuevas y a las herramientas de edición manual.
