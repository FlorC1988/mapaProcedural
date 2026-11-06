# Desarrollo local

## Requisitos

- Node.js 24+ y npm
- Docker Desktop
- Supabase CLI (`npm i -g supabase` o el ejecutable ya instalado)

## Arranque

Forma rápida (Windows): doble clic en `iniciar.cmd` o `.\iniciar.ps1` desde PowerShell. El script comprueba requisitos, abre Docker Desktop si no está corriendo y espera a que el motor responda, instala dependencias si faltan, crea `server/.env`, inicia Supabase si no está corriendo (la primera vez descarga sus imágenes Docker) y espera a que sus contenedores estén listos, libera los puertos 3000/5173 si los ocupa una instancia anterior de este proyecto, levanta backend y frontend (accesible también desde la red local, `host: true` en `web/vite.config.ts`), abre el navegador y muestra la URL de acceso desde la red (la IP `192.168.*` detectada en ese momento). Backend y frontend corren en segundo plano con sus logs en `logs/dev.log`. Al presionar Enter en la consola se detienen; la base queda corriendo (`npm run db:stop`). Si se cierra la ventana con la X, quedan procesos huérfanos que el siguiente arranque detiene automáticamente.

Forma manual:

```bash
# 1. Base de datos (primera vez descarga las imágenes)
npm run db:start

# 2. Dependencias (solo la primera vez)
npm install

# 3. Backend + frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (`/health`, `/api/...`)
- Supabase Studio: http://127.0.0.1:54323
- Postgres directo: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

## Comandos útiles

```bash
npm run dev:server     # solo backend (tsx watch)
npm run dev:web        # solo frontend (vite)
npm run typecheck      # tsc --noEmit en ambos
npm run db:stop        # detiene el stack Supabase
npm run db:reset       # recrea la DB y reaplica migraciones + semilla
supabase migration new <nombre>   # nueva migración imperativa
```

## Arranque y logs

- `iniciar.cmd` (doble clic) o `iniciar.ps1`: levanta Docker, Supabase, backend y frontend. La app queda **desacoplada de la ventana**: cerrarla no detiene nada. `detener.cmd` / `detener.ps1` detiene backend y frontend.
- `npm run dev` ejecuta `scripts/dev.mjs`: levanta ambos procesos, **anexa** la salida a `logs/dev.log` con timestamp, marca el inicio/fin de cada sesión y registra el código/señal de salida de cada proceso (`proceso terminado: código=X señal=Y`). Si el log se corta de golpe sin línea de cierre, la app fue matada desde afuera (reinicio de Docker/Windows/terminal), no por crash propio.

## Pruebas

Requisitos: backend y Supabase corriendo (`npm run dev`). La primera vez, instalar el navegador de Playwright con `npx playwright install chromium`.

```bash
npm test               # unitarias → API → E2E (se detiene en la primera capa con fallos)
npm run test:unit      # lógica pura: geometría, PRNG, config, microbiomas, editor, encuentro (node:test + tsx)
npm run test:api       # integración de toda la API contra API_URL (por defecto http://localhost:3000)
npm run test:e2e       # Playwright/Chromium contra WEB_URL (por defecto http://localhost:5173); informe en playwright-report/
```

- `tests/ayudantes/reglas-mapa.mjs` contiene las reglas de validez de un mapa generado; lo usan la suite y `server/scripts/validar-mapa.mjs`.
- **Las pruebas de API y E2E escriben en la base de desarrollo real.** Todo lo creado lleva el prefijo `ZZ Prueba <corrida>`: los mapas se eliminan; los catálogos (que no admiten borrado físico) se desactivan al terminar, y las compatibilidades/apariciones que se tocan se restauran. Cada corrida deja registros inactivos nuevos. `tests/api/00-preparacion.test.mjs` limpia restos activos de corridas interrumpidas.
- Mientras corre la suite existe un bioma de prueba activo durante unos segundos: no generar mapas en la app al mismo tiempo.
- Para usar otra base basta con levantar el backend con otro `DATABASE_URL` y pasar `API_URL`/`WEB_URL`.

## Estructura

- `server/` — Express + TypeScript, conexión directa a Postgres con `pg` (rol postgres local; en despliegue, rol de servicio).
- `web/` — React + TypeScript con Vite; proxy de `/api` y `/health` al backend.
- `supabase/migrations/` — migraciones imperativas, solo hacia adelante.
- `tests/` — `unit/`, `api/`, `e2e/` y `ayudantes/`; configuración de Playwright en `playwright.config.ts`.

## Notas

- `server/.env` contiene `DATABASE_URL` local (ver `server/.env.example`).
- RLS está habilitado en todas las tablas; el backend es la única puerta de entrada a los datos (DEC-081).
