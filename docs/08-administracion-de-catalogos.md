# Administración de catálogos

## Estado

Está aprobada la administración de biomas, incompatibilidades y microbiomas, además de la configuración de compatibilidades de tipos fijos de gimnasio.

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

Cualquier usuario puede crear, consultar, editar, activar y desactivar definiciones; no existe eliminación física. Cada definición tiene identidad estable, nombre único sin distinguir mayúsculas, estado y versión de concurrencia. El nombre se recorta y contiene entre 1 y 100 caracteres. Una definición nueva válida se crea activa.

Cada celda usa coordenadas axiales relativas `(dq, dr)`, un bioma activo y una altura Z1, Z2 o Z3. La definición incluye una única celda `(0,0)` como ancla, contiene entre 1 y 900 coordenadas únicas, forma un conjunto conectado por lados y no supera una extensión equivalente a 30×30 posiciones visibles. Las excepciones internas permiten cualquier combinación de biomas y alturas admitidos sin validar incompatibilidades ni diferencias de nivel.

El editor:

1. inicia una definición con su ancla;
2. permite agregar únicamente celdas adyacentes;
3. solo elimina una celda si la forma restante continúa conectada y conserva al menos una;
4. permite seleccionar otra celda como ancla y recalcula todos los offsets;
5. permite editar bioma y altura en una celda o selección múltiple;
6. bloquea Guardar ante cualquier incumplimiento estructural o nombre duplicado.

El listado muestra nombre, estado y cantidad de celdas. Permite búsqueda parcial por nombre sin distinguir mayúsculas, filtro activo/inactivo y orden por nombre.

Editar una definición activa válida afecta generaciones futuras inmediatamente. Activar o desactivar también tiene efecto inmediato y no requiere confirmación. Los cambios nunca alteran instancias ni snapshots existentes.

Guardar usa control optimista: si la versión persistida cambió desde que se abrió el editor, rechaza la actualización sin sobrescribir y exige recargar.

La administración de definiciones no cambia la regla de generación: una vez seleccionada para una instancia, la distribución no se rota ni refleja; sus biomas solo pueden alterarse por la influencia prioritaria aprobada de un gimnasio.

## 3. Tipos de gimnasio

Existen exactamente 18 tipos fijos: Acero, Agua, Bicho, Dragón, Eléctrico, Fantasma, Fuego, Hada, Hielo, Lucha, Normal, Planta, Psíquico, Roca, Siniestro, Tierra, Veneno y Volador.

No pueden crearse, eliminarse, activarse ni desactivarse. Cualquier usuario, sin cuenta, puede configurar únicamente la lista de biomas compatibles activos de cada tipo. Inicialmente, los cinco biomas son compatibles con los 18 tipos.

La interfaz impide guardar un cambio que deje un tipo sin biomas compatibles. Cambiar compatibilidades afecta únicamente al catálogo operativo y a contextos creados posteriormente; los snapshots de mapas existentes no cambian.

## 4. Acceso administrativo

La aplicación no tiene cuentas y el MVP no distingue ni protege al actor administrador. Cualquier usuario de la instalación puede abrir el área administrativa y ejecutar las operaciones de catálogo disponibles.

Las operaciones exactas y las validaciones del editor administrativo de microbiomas están aprobadas en `RF-ADM-009` a `RF-ADM-014` y en `DEC-055` a `DEC-058`.

## 5. Integridad histórica

Los catálogos operativos son compartidos por toda la instalación. Cada mapa guarda un snapshot de la configuración, los catálogos y definiciones elegibles con sus propiedades y estados, las incompatibilidades, las compatibilidades de gimnasio y la versión del algoritmo. Modificar o desactivar una entrada operativa no altera ningún snapshot existente.

Abrir un mapa muestra su estado guardado aunque incluya datos actualmente inactivos. Regenerar desde él usa su contexto histórico. Las restricciones sobre datos activos continúan aplicándose a configuraciones nuevas y a las herramientas de edición manual.
