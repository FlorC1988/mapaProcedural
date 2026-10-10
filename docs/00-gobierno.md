# Gobierno documental

## 1. Principios obligatorios

1. La documentación normativa es la única fuente de verdad del proyecto.
2. Toda decisión funcional, técnica, visual o documental requiere aprobación explícita de la responsable del proyecto.
3. Ningún agente o implementador puede completar una ambigüedad por inferencia.
4. El código, las pruebas y la interfaz deben ajustarse a la documentación aprobada.
5. Ante una contradicción entre implementación y documentación, prevalece la documentación y se detiene el trabajo afectado hasta resolver la discrepancia.
6. El borrador original fue eliminado del repositorio (`DEC-089`); todo su contenido relevante quedó capturado en la documentación normativa y las decisiones aprobadas.

## 2. Documentos normativos

Son normativos los archivos dentro de `docs/` que declaren contenido aprobado y el registro central `12-decisiones.md`. `README.md` actúa como índice. `handoff.md` es operativo: resume el estado, pero no reemplaza a la especificación ni al registro de decisiones.

## 3. Flujo de decisión

1. Detectar una decisión necesaria.
2. Formular el problema y las opciones sin seleccionar una silenciosamente.
3. Registrar la decisión como **Pendiente** en `12-decisiones.md`.
4. Presentarla para aprobación explícita.
5. Registrar la resolución, fecha y documentos afectados.
6. Actualizar los documentos normativos correspondientes.
7. Solo entonces diseñar o implementar lo aprobado.

Una conversación, propuesta o ejemplo no se considera aprobación salvo que la responsable acepte explícitamente una opción o un plan que la contenga.

## 4. Cambios documentales

- Toda afirmación normativa debe poder rastrearse a una decisión aprobada o a la documentación normativa vigente.
- Una reorganización puede mejorar claridad, pero no alterar significado.
- Las propuestas se etiquetan como **Pendiente** y no se redactan como requisitos vigentes.
- Si dos documentos divergen, se registra la contradicción y se solicita una decisión.
- Los identificadores de requisitos y decisiones no se reutilizan.

## 5. Estados

- **Aprobado:** autorizado expresamente y utilizable para implementación.
- **Pendiente:** propuesto o detectado, pero todavía no autorizado.
- **Rechazado:** evaluado y descartado; se conserva para trazabilidad.
- **Fuera de alcance:** excluido de la versión actual.
- **Obsoleto:** reemplazado por una decisión posterior identificada.

## 6. Mantenimiento de `handoff.md`

`handoff.md` debe actualizarse después de cada cambio aprobado que afecte al estado, trabajo completado o en curso, próximos pasos, decisiones, arquitectura, archivos relevantes, verificaciones, problemas conocidos o deuda técnica.

Antes de finalizar una sesión de trabajo se comprobará que otro agente pueda continuar sin depender del historial de conversación.

## 7. Regla de implementación

No se iniciará una tarea de implementación que dependa de una decisión pendiente. Si una tarea descubre una nueva decisión, la parte afectada se detendrá y seguirá el flujo de aprobación.
