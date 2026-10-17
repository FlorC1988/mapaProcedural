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

## Estructura

- `server/` — Express + TypeScript, conexión directa a Postgres con `pg` (rol postgres local; en despliegue, rol de servicio).
- `web/` — React + TypeScript con Vite; proxy de `/api` y `/health` al backend.
- `supabase/migrations/` — migraciones imperativas, solo hacia adelante.

## Notas

- `server/.env` contiene `DATABASE_URL` local (ver `server/.env.example`).
- RLS está habilitado en todas las tablas; el backend es la única puerta de entrada a los datos (DEC-081).
