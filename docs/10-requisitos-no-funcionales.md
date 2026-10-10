# Requisitos no funcionales

## Estado

Todos los requisitos de este documento están aprobados. El valor numérico del presupuesto de nodos se fijará durante la implementación siguiendo la metodología de benchmark aprobada; hasta entonces, el límite se documenta como parámetro calibrable.

## Rendimiento

- **RNF-PER-001 — Aprobado:** una generación de referencia normal debe completarse en 5 segundos o menos, medida desde que el usuario solicita generar hasta que el sistema entrega un resultado o un fallo determinístico.
- **RNF-PER-002 — Aprobado:** una generación de referencia difícil debe completarse en 30 segundos o menos, medida con el mismo criterio.
- **RNF-PER-003 — Aprobado:** la interfaz debe responder en 100 ms o menos para operaciones interactivas habituales (apertura de paneles, cambios de zoom, desplazamiento, aplicación de una edición simple, deshacer/rehacer).
- **RNF-PER-004 — Aprobado:** las operaciones de persistencia (guardar, abrir, listar, eliminar) deben completarse en 2 segundos o menos en condiciones de referencia.
- **RNF-PER-005 — Aprobado:** el valor numérico del presupuesto global de nodos se calibrará mediante benchmarks de casos de referencia en una estación de desarrollo típica con Chromium, fijando el límite normal en el percentil 99 de ejecuciones exitosas dentro de 5 s y el límite difícil en el percentil 99 dentro de 30 s. Hasta la calibración, el generador usará un presupuesto provisional documentado y ajustable.

## Compatibilidad

- **RNF-COM-001 — Aprobado:** soporte oficial únicamente para escritorio con navegador Chromium. Otros navegadores o dispositivos pueden funcionar, pero no forman parte del alcance de soporte.
- **RNF-COM-002 — Aprobado:** el viewport mínimo de escritorio es 1280×720 píxeles.
- **RNF-COM-003 — Aprobado:** la referencia de concurrencia es 10 usuarios simultáneos realizando operaciones de lectura y escritura en la misma instalación.
- **RNF-COM-004 — Aprobado:** no se requiere funcionamiento sin conexión; la aplicación opera con conectividad al servidor central de la instalación.

## Accesibilidad

- **RNF-ACC-001 — Aprobado:** la interfaz debe cumplir WCAG 2.2 nivel AA.
- **RNF-ACC-002 — Aprobado:** todo el producto debe ser navegable y operable mediante teclado.
- **RNF-ACC-003 — Aprobado:** la interfaz debe ofrecer soporte semántico completo para tecnologías de asistencia, incluyendo nombres accesibles para biomas, gimnasios, microbiomas, errores y estados.
- **RNF-ACC-004 — Aprobado:** la aplicación debe respetar la preferencia del sistema de reducir movimiento; las animaciones no esenciales se suprimen cuando esa preferencia está activa.

## Seguridad

- **RNF-SEG-001 — Aprobado:** el despliegue oficial se limita a una red privada. El MVP no está diseñado para exposición pública.
- **RNF-SEG-002 — Aprobado:** HTTPS no es obligatorio para el MVP en red privada.
- **RNF-SEG-003 — Aprobado:** el área administrativa no requiere autenticación ni autorización en el MVP; cualquier usuario de la instalación puede modificar catálogos. Esta decisión solo es aceptable dentro del ámbito de red privada aprobado.
- **RNF-SEG-004 — Aprobado:** las validaciones de negocio aplican en cliente, servidor y base de datos; la autoridad final reside en el servidor.

## Privacidad

- **RNF-PRI-001 — Aprobado:** no se recopilan datos personales de los usuarios.
- **RNF-PRI-002 — Aprobado:** no se envían analíticas ni telemetría a servicios externos.
- **RNF-PRI-003 — Aprobado:** los logs y métricas locales no incluyen contenido de mapas, snapshots ni secretos de configuración o conexión.

## Confiabilidad e integridad

- **RNF-CON-001 — Aprobado:** las operaciones de escritura sobre catálogos y mapas deben ser atómicas y dejar el estado consistente ante fallos parciales.
- **RNF-CON-002 — Aprobado:** el sistema debe mantener la integridad de los snapshots históricos de mapas; los cambios posteriores de catálogos no los alteran.
- **RNF-CON-003 — Aprobado:** la estrategia de copias de seguridad y recuperación es responsabilidad de la infraestructura de cada instalación; el MVP no define RPO ni RTO.
- **RNF-CON-004 — Aprobado:** las migraciones de esquema y snapshot son versionadas, se ejecutan hacia adelante y deben incluir pruebas de compatibilidad antes de su aplicación.

## Mantenibilidad y pruebas

- **RNF-MAN-001 — Aprobado:** la estrategia mínima de pruebas incluye pruebas unitarias, pruebas de integración, pruebas de contratos de datos, pruebas end-to-end de flujos críticos y verificación automatizada o manual de accesibilidad.
- **RNF-MAN-002 — Aprobado:** los requisitos, reglas y criterios de aceptación aprobados deben poder verificarse mediante pruebas automatizadas siempre que sea técnicamente viable.
- **RNF-MAN-003 — Aprobado:** el código debe mantener una separación clara entre dominio, generación, persistencia e interfaz para facilitar pruebas y cambios futuros.
- **RNF-MAN-004 — Aprobado:** el algoritmo de generación y el procesamiento de snapshots deben estar versionados para garantizar reproducibilidad y compatibilidad futura.

## Observabilidad y diagnóstico

- **RNF-OBS-001 — Aprobado:** la aplicación debe emitir logs estructurados locales sobre errores, latencia de operaciones interactivas, generación y persistencia.
- **RNF-OBS-002 — Aprobado:** la aplicación debe exponer métricas locales básicas de operación (frecuencia de errores, tiempos de generación, tiempos de persistencia).
- **RNF-OBS-003 — Aprobado:** los logs y métricas no deben contener contenido de mapas, snapshots, nombres de usuario ni secretos.
- **RNF-OBS-004 — Aprobado:** la retención mínima de logs, métricas y auditoría administrativa es de 30 días; la infraestructura de cada instalación puede configurar una retención mayor.

## Auditoría administrativa

- **RNF-AUD-001 — Aprobado:** cada cambio administrativo (crear, editar, activar, desactivar) sobre biomas, incompatibilidades, compatibilidades de gimnasio o definiciones de microbioma se registra con marca temporal, tipo de entidad, identificador afectado y tipo de cambio.
- **RNF-AUD-002 — Aprobado:** los registros de auditoría no asocian el cambio con una identidad de usuario personal, puesto que el MVP no tiene cuentas.
- **RNF-AUD-003 — Aprobado:** los registros de auditoría se conservan al menos 30 días.

## Pendientes

No quedan requisitos no funcionales pendientes. La tecnología concreta de persistencia, esquema físico, migraciones y despliegue permanecen bajo `PEN-019`.
