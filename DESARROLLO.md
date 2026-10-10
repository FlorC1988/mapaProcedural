# Desarrollo local

## Requisitos

- Node.js 24+ y npm
- Docker Desktop
- Supabase CLI (`npm i -g supabase` o el ejecutable ya instalado)

## Arranque

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
