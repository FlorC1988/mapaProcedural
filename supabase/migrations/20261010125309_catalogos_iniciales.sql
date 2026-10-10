-- Esquema inicial: catálogos operativos, auditoría administrativa y cabecera de mapas.
-- Autoridad: docs/05-modelo-de-datos.md, docs/03-requisitos-funcionales.md.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Biomas (RF-ADM-001, RF-ADM-007, RD-BIO-003)
-- ---------------------------------------------------------------------------
create table public.biomas (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  color text not null,
  icono text not null,
  activo boolean not null default true,
  version integer not null default 1,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint biomas_nombre_longitud check (char_length(nombre::text) between 1 and 100)
);

-- ---------------------------------------------------------------------------
-- Incompatibilidades simétricas entre biomas distintos (RD-BIO-006..009)
-- El par se almacena ordenado (a < b) para que la simetría sea implícita.
-- ---------------------------------------------------------------------------
create table public.incompatibilidades (
  bioma_a uuid not null references public.biomas (id),
  bioma_b uuid not null references public.biomas (id),
  creado_en timestamptz not null default now(),
  primary key (bioma_a, bioma_b),
  constraint incompatibilidades_distintos check (bioma_a <> bioma_b),
  constraint incompatibilidades_orden check (bioma_a < bioma_b)
);

-- ---------------------------------------------------------------------------
-- Catálogo fijo de 18 tipos de gimnasio (RF-CAT-001, RD-GIM-005)
-- ---------------------------------------------------------------------------
create table public.tipos_gimnasio (
  id smallint primary key,
  nombre text not null unique
);

create table public.tipo_gimnasio_biomas (
  tipo_id smallint not null references public.tipos_gimnasio (id),
  bioma_id uuid not null references public.biomas (id),
  primary key (tipo_id, bioma_id)
);

-- ---------------------------------------------------------------------------
-- Definiciones de microbioma (RF-ADM-003..005, RD-MIC-012..014)
-- celdas: JSONB [{dq, dr, bioma, altura}] validado estructuralmente en servidor.
-- ---------------------------------------------------------------------------
create table public.microbiomas (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  activo boolean not null default true,
  version integer not null default 1,
  celdas jsonb not null,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  constraint microbiomas_nombre_longitud check (char_length(nombre::text) between 1 and 100),
  constraint microbiomas_celdas_array check (jsonb_typeof(celdas) = 'array')
);

-- ---------------------------------------------------------------------------
-- Auditoría administrativa sin identidad de usuario (RF-OBS-001, DEC-068)
-- ---------------------------------------------------------------------------
create table public.auditoria_admin (
  id bigint generated always as identity primary key,
  ocurrido_en timestamptz not null default now(),
  tipo_entidad text not null,
  entidad_id text not null,
  tipo_cambio text not null
);

-- ---------------------------------------------------------------------------
-- Cabecera de mapa + snapshot JSONB (RF-MAP-003/004, DEC-083)
-- El snapshot es atómico y contiene estado actual + contexto histórico
-- versionado (version_algoritmo, version_snapshot).
-- ---------------------------------------------------------------------------
create table public.mapas (
  id uuid primary key default gen_random_uuid(),
  nombre citext not null unique,
  creado_en timestamptz not null default now(),
  modificado_en timestamptz not null default now(),
  version integer not null default 1,
  snapshot jsonb not null,
  constraint mapas_nombre_longitud check (char_length(nombre::text) between 1 and 100),
  constraint mapas_snapshot_objeto check (jsonb_typeof(snapshot) = 'object')
);

create index mapas_modificado_en_idx on public.mapas (modificado_en desc);

-- ---------------------------------------------------------------------------
-- RLS en todas las tablas del esquema public (DEC-081).
-- Solo el rol de servicio del backend (service_role) puede leer/escribir.
-- El backend también puede usar el rol postgres vía conexión directa con pg.
-- ---------------------------------------------------------------------------
alter table public.biomas enable row level security;
alter table public.incompatibilidades enable row level security;
alter table public.tipos_gimnasio enable row level security;
alter table public.tipo_gimnasio_biomas enable row level security;
alter table public.microbiomas enable row level security;
alter table public.auditoria_admin enable row level security;
alter table public.mapas enable row level security;

create policy biomas_servicio on public.biomas
  for all to service_role using (true) with check (true);
create policy incompatibilidades_servicio on public.incompatibilidades
  for all to service_role using (true) with check (true);
create policy tipos_gimnasio_servicio on public.tipos_gimnasio
  for all to service_role using (true) with check (true);
create policy tipo_gimnasio_biomas_servicio on public.tipo_gimnasio_biomas
  for all to service_role using (true) with check (true);
create policy microbiomas_servicio on public.microbiomas
  for all to service_role using (true) with check (true);
create policy auditoria_admin_servicio on public.auditoria_admin
  for all to service_role using (true) with check (true);
create policy mapas_servicio on public.mapas
  for all to service_role using (true) with check (true);
